import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { Campanha, LogEnvio, StatusCampanha } from '../index';
import MensagemSender from '@/utils/mensagemSender';
import WebSocketManager, { ProgressoCampanha } from '@/lib/websocketServer';
import { 
  devePararCampanha, 
  getStatusControle, 
  registrarCampanhaAtiva, 
  limparControleCampanha 
} from './controle';
import { FirebaseDocRef } from '@/types/firebase';
import { ConteudoComVariacao } from '@/types/api';
import { ConteudoMensagem } from '../index';

// Configurações do sistema de envio
const CONFIG_ENVIO = {
  TAMANHO_LOTE: 25, // Quantas mensagens por lote
  DELAY_ENTRE_LOTES: 30000, // 30 segundos entre lotes
  DELAY_MINIMO_MENSAGEM: 2000, // 2 segundos mínimo entre mensagens
  DELAY_MAXIMO_MENSAGEM: 6000, // 6 segundos máximo entre mensagens
  MAX_TENTATIVAS_CONTATO: 3,
  TIMEOUT_REQUISICAO: 15000, // 15 segundos timeout por requisição
};

type ProgressoEnvio = {
  campanhaId: string;
  status: 'iniciando' | 'criando-variacoes' | 'processando' | 'finalizando' | 'concluida' | 'erro' | 'pausada' | 'cancelada';
  loteAtual: number;
  totalLotes: number;
  contatosProcessados: number;
  totalContatos: number;
  sucessos: number;
  erros: number;
  iniciadoEm: number;
  ultimaAtualizacao: number;
  estimativaTermino?: number;
  mensagemStatus?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
  const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);

  try {
    // Verificar se a campanha existe e pode ser enviada
    const doc = await campanhaRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = { id: doc.id, ...doc.data() } as Campanha;
    
    // CORREÇÃO: Aceitar campanhas pausadas para retomada
    if (!['rascunho', 'pausada'].includes(campanha.status)) {
      return res.status(400).json({ 
        error: `Campanha não pode ser enviada. Status atual: ${campanha.status}`,
        details: `Apenas campanhas com status 'rascunho' ou 'pausada' podem ser iniciadas/retomadas.`
      });
    }

    // Filtrar contatos pendentes
    const contatosPendentes = campanha.logs.filter(log => 
      log.status === 'pendente' || (log.status === 'erro' && log.tentativas < CONFIG_ENVIO.MAX_TENTATIVAS_CONTATO)
    );

    if (contatosPendentes.length === 0) {
      return res.status(400).json({ 
        error: 'Não há contatos pendentes para envio' 
      });
    }

    console.log(`[${id}] INICIAR/RETOMAR ENVIO: ${contatosPendentes.length} contatos pendentes`);

    // Buscar tokens necessários
    const { tokenInstancia, clientToken } = await buscarTokens(cliente, idInstancia);
    if (!tokenInstancia || !clientToken) {
      return res.status(400).json({ 
        error: 'Tokens de instância não encontrados' 
      });
    }

    // Atualizar status inicial da campanha
    const agora = Date.now();
    await campanhaRef.update({
      status: 'enviando' as StatusCampanha,
      dataInicio: agora
    });

    // Criar progresso inicial
    const totalLotes = Math.ceil(contatosPendentes.length / CONFIG_ENVIO.TAMANHO_LOTE);
    const progresso: ProgressoEnvio = {
      campanhaId: id,
      status: 'iniciando',
      loteAtual: 0,
      totalLotes,
      contatosProcessados: 0,
      totalContatos: contatosPendentes.length,
      sucessos: 0,
      erros: 0,
      iniciadoEm: agora,
      ultimaAtualizacao: agora,
      estimativaTermino: calcularEstimativaTermino(contatosPendentes.length),
      mensagemStatus: 'Preparando envio...'
    };

    // Responder imediatamente ao cliente
    res.status(200).json({
      message: 'Envio da campanha iniciado com sucesso',
      progresso,
      totalContatos: contatosPendentes.length,
      totalLotes
    });

    // Iniciar processamento assíncrono (sem await para não bloquear a resposta)
    processarCampanhaCompleta(
      campanha,
      contatosPendentes,
      tokenInstancia,
      clientToken,
      campanhaRef,
      cliente,
      idInstancia,
      progresso
    ).catch(error => {
      console.error(`Erro no processamento da campanha ${id}:`, error);
    });

  } catch (error) {
    console.error('Erro ao iniciar envio:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function processarCampanhaCompleta(
  campanha: Campanha,
  contatosPendentes: LogEnvio[],
  tokenInstancia: string,
  clientToken: string,
  campanhaRef: FirebaseDocRef,
  cliente: string,
  idInstancia: string,
  progresso: ProgressoEnvio
) {
  const campanhaId = campanha.id!;
  const wsManager = WebSocketManager.getInstance();
  
  // Registrar campanha como ativa no sistema de controle
  registrarCampanhaAtiva(campanhaId, cliente, idInstancia);
  
  try {
    // PASSO 1: Criar variações da mensagem
    progresso.status = 'criando-variacoes';
    progresso.mensagemStatus = 'Criando variações da mensagem...';
    progresso.ultimaAtualizacao = Date.now();
    
    emitirProgresso(wsManager, progresso);
    
    console.log(`[${campanhaId}] Criando variações da mensagem...`);
    await criarVariacoesMensagem(campanha, campanhaRef);

    // Verificar se foi pausada/cancelada durante a criação de variações
    if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
      const statusControle = getStatusControle(campanhaId);
      console.log(`[${campanhaId}] Campanha ${statusControle} durante criação de variações`);
      return;
    }

    // CORREÇÃO: Buscar campanha atualizada CORRETAMENTE
    const campanhaDoc = await campanhaRef.get();
    const campanhaAtualizada = { id: campanhaDoc.id, ...campanhaDoc.data() } as Campanha;
    
    // Garantir que as variações estão disponíveis
    if (!campanhaAtualizada.conteudo.variacoes || campanhaAtualizada.conteudo.variacoes.length === 0) {
      campanhaAtualizada.conteudo.variacoes = [campanha.conteudo.texto || ''];
    }
    
    const variacoes = campanhaAtualizada.conteudo.variacoes;
    
    console.log(`[${campanhaId}] Variações disponíveis para envio: ${variacoes.length}`);
    variacoes.forEach((variacao, index) => {
      console.log(`[${campanhaId}] Variação ${index}: "${variacao.substring(0, 60)}..."`);
    });

    // PASSO 2: Processar envios em lotes
    progresso.status = 'processando';
    progresso.mensagemStatus = 'Enviando mensagens...';
    progresso.ultimaAtualizacao = Date.now();
    
    emitirProgresso(wsManager, progresso);

    const lotes = dividirEmLotes(contatosPendentes, CONFIG_ENVIO.TAMANHO_LOTE);
    progresso.totalLotes = lotes.length;

    console.log(`[${campanhaId}] Iniciando processamento de ${lotes.length} lotes...`);

    // Criar instância do MensagemSender
    const sender = new MensagemSender({
      tokenInstancia,
      clientToken,
      idInstancia,
      timeout: CONFIG_ENVIO.TIMEOUT_REQUISICAO
    });

    for (let i = 0; i < lotes.length; i++) {
      // VERIFICAÇÃO CRÍTICA: Checar se deve parar antes de cada lote
      if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
        const statusControle = getStatusControle(campanhaId);
        console.log(`[${campanhaId}] 🛑 INTERROMPENDO NO LOTE ${i + 1}/${lotes.length} - STATUS: ${statusControle}`);
        
        if (statusControle === 'pausada') {
          progresso.status = 'pausada';
          progresso.mensagemStatus = `Campanha pausada no lote ${i + 1}/${lotes.length}`;
          emitirProgresso(wsManager, progresso);
          
          // CORREÇÃO: Atualizar status no banco como pausada
          await campanhaRef.update({
            status: 'pausada' as StatusCampanha,
            ultimaAtualizacao: Date.now()
          });
          
          console.log(`[${campanhaId}] ✅ Campanha pausada e salva no banco`);
          
          // Não limpar do cache, manter para poder retomar
          return;
        } else if (statusControle === 'cancelada') {
          progresso.status = 'cancelada';
          progresso.mensagemStatus = 'Campanha cancelada pelo usuário';
          emitirProgresso(wsManager, progresso);
          
          // Marcar como cancelada no banco
          await campanhaRef.update({
            status: 'cancelada' as StatusCampanha,
            dataConclusao: Date.now()
          });
          
          limparControleCampanha(campanhaId, cliente, idInstancia);
          return;
        }
      }

      const loteAtual = lotes[i];
      progresso.loteAtual = i + 1;
      progresso.ultimaAtualizacao = Date.now();

      console.log(`[${campanhaId}] Processando lote ${i + 1}/${lotes.length} (${loteAtual.length} contatos)...`);

      // CORREÇÃO: Passar a campanha com variações corretas
      const resultadosLote = await processarLote(loteAtual, campanhaAtualizada, sender, progresso, wsManager, campanhaId, cliente, idInstancia);

      // Verificar se foi pausada/cancelada durante o lote
      if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
        const statusControle = getStatusControle(campanhaId);
        console.log(`[${campanhaId}] 🛑 INTERROMPENDO APÓS LOTE ${i + 1} - STATUS: ${statusControle}`);
        
        // Salvar logs do lote atual antes de parar
        await atualizarLogsCampanha(campanhaRef, resultadosLote.logs);
        
        if (statusControle === 'pausada') {
          // Garantir que está pausada no banco
          await campanhaRef.update({
            status: 'pausada' as StatusCampanha,
            ultimaAtualizacao: Date.now()
          });
          console.log(`[${campanhaId}] ✅ Status pausada confirmado no banco após lote`);
          return; // Sair sem limpar cache
        } else if (statusControle === 'cancelada') {
          await campanhaRef.update({
            status: 'cancelada' as StatusCampanha,
            dataConclusao: Date.now()
          });
          limparControleCampanha(campanhaId, cliente, idInstancia);
          return;
        }
      }

      // Atualizar logs no banco após cada lote (com logs completos)
      await atualizarLogsCampanha(campanhaRef, resultadosLote.logs);

      console.log(`[${campanhaId}] Lote ${i + 1} concluído: ${resultadosLote.sucessos} sucessos, ${resultadosLote.erros} erros`);

      // Delay entre lotes (exceto no último) - com verificações de parada
      if (i < lotes.length - 1) {
        const delaySegundos = CONFIG_ENVIO.DELAY_ENTRE_LOTES / 1000;
        console.log(`[${campanhaId}] Aguardando ${delaySegundos}s antes do próximo lote...`);
        
        // Delay com verificações periódicas (a cada segundo)
        for (let delayElapsed = 0; delayElapsed < CONFIG_ENVIO.DELAY_ENTRE_LOTES; delayElapsed += 1000) {
          if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
            const statusControle = getStatusControle(campanhaId);
            console.log(`[${campanhaId}] 🛑 INTERROMPENDO DURANTE DELAY - STATUS: ${statusControle}`);
            
            if (statusControle === 'pausada') {
              // Atualizar status no banco
              await campanhaRef.update({
                status: 'pausada' as StatusCampanha,
                ultimaAtualizacao: Date.now()
              });
              console.log(`[${campanhaId}] ✅ Status pausada confirmado no banco durante delay`);
              return;
            } else if (statusControle === 'cancelada') {
              await campanhaRef.update({
                status: 'cancelada' as StatusCampanha,
                dataConclusao: Date.now()
              });
              limparControleCampanha(campanhaId, cliente, idInstancia);
              return;
            }
          }
          await delay(Math.min(1000, CONFIG_ENVIO.DELAY_ENTRE_LOTES - delayElapsed));
        }
      }
    }

    // PASSO 3: Finalizar campanha (só chega aqui se não foi pausada/cancelada)
    progresso.status = 'finalizando';
    progresso.mensagemStatus = 'Finalizando campanha...';
    progresso.ultimaAtualizacao = Date.now();
    
    emitirProgresso(wsManager, progresso);

    console.log(`[${campanhaId}] Finalizando campanha...`);
    await finalizarCampanha(campanhaRef, progresso);

    // Emitir conclusão
    wsManager.emitirCampanhaConcluida(campanhaId, {
      totalContatos: progresso.totalContatos,
      sucessos: progresso.sucessos,
      erros: progresso.erros,
      percentualSucesso: progresso.totalContatos > 0 ? (progresso.sucessos / progresso.totalContatos) * 100 : 0
    });

    console.log(`[${campanhaId}] Campanha concluída com sucesso! Total: ${progresso.sucessos} sucessos, ${progresso.erros} erros`);

    // Limpar do cache de controle
    limparControleCampanha(campanhaId, cliente, idInstancia);

  } catch (error) {
    console.error(`[${campanhaId}] Erro no processamento:`, error);
    
    progresso.status = 'erro';
    progresso.mensagemStatus = `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    progresso.ultimaAtualizacao = Date.now();

    // Emitir erro
    wsManager.emitirErroCampanha(campanhaId, progresso.mensagemStatus);

    await campanhaRef.update({
      status: 'cancelada' as StatusCampanha,
      dataConclusao: Date.now()
    });
    
    // Limpar do cache de controle
    limparControleCampanha(campanhaId, cliente, idInstancia);
  }
}

async function processarLote(
  lote: LogEnvio[],
  campanha: Campanha,
  sender: MensagemSender,
  progresso: ProgressoEnvio,
  wsManager: WebSocketManager,
  campanhaId: string,
  cliente: string,
  idInstancia: string
) {
  const resultados = {
    sucessos: 0,
    erros: 0,
    logs: [] as LogEnvio[]
  };

  // Determinar variações disponíveis baseado no tipo de mensagem
  let variacoes: string[] = [];
  const tipoMensagem = campanha.conteudo.tipo;
  
  switch (tipoMensagem) {
    case 'texto':
      variacoes = campanha.conteudo.variacoes || [campanha.conteudo.texto || ''];
      break;
    case 'imagem':
      // Para imagens, usar variações da legenda se existirem
      if (campanha.conteudo.legenda) {
        variacoes = campanha.conteudo.variacoesLegenda || [campanha.conteudo.legenda];
      }
      break;
    case 'botoes':
      variacoes = campanha.conteudo.variacoes || [campanha.conteudo.texto || ''];
      break;
  }
  
  console.log(`[${campanha.id}] Iniciando lote ${tipoMensagem} com ${variacoes.length} variações disponíveis`);

  for (let i = 0; i < lote.length; i++) {
    // VERIFICAÇÃO CRÍTICA: Checar antes de cada mensagem - VERSÃO ASSÍNCRONA
    if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
      const statusControle = getStatusControle(campanhaId);
      console.log(`[${campanhaId}] 🛑 INTERROMPENDO NA MENSAGEM ${i + 1}/${lote.length} - STATUS: ${statusControle}`);
      
      // CORREÇÃO: Atualizar progresso para pausada antes de sair
      if (statusControle === 'pausada') {
        progresso.status = 'pausada';
        progresso.mensagemStatus = `Pausada na mensagem ${i + 1} do lote ${progresso.loteAtual}`;
        emitirProgresso(wsManager, progresso);
        
        // Atualizar status no banco imediatamente
        const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
        const campanhaRef = dbAdmin.collection(campanhaPath).doc(campanhaId);
        await campanhaRef.update({
          status: 'pausada' as StatusCampanha,
          ultimaAtualizacao: Date.now()
        });
        
        console.log(`[${campanhaId}] Status atualizado para PAUSADA no banco durante processamento`);
      }
      
      break; // Sair do loop de mensagens
    }

    const contato = lote[i];
    const inicioEnvio = Date.now();
    
    try {
      // Atualizar status para enviando
      contato.status = 'enviando';
      contato.timestampEnvio = inicioEnvio;
      
      // Escolher variação da mensagem
      const { conteudo: conteudoParaEnvio, variacaoInfo } = obterConteudoComVariacao(
        campanha.conteudo, 
        variacoes, 
        i, 
        progresso.contatosProcessados + i
      );
      
      // Salvar informação da variação no log do contato
      if (variacaoInfo) {
        contato.variacaoUsada = variacaoInfo;
      }
      
      // Log da variação escolhida baseado no tipo
      let logVariacao = '';
      switch (tipoMensagem) {
        case 'texto':
        case 'botoes':
          logVariacao = variacaoInfo 
            ? `variação ${variacaoInfo.indice}: "${typeof variacaoInfo.conteudo === 'string' ? variacaoInfo.conteudo.substring(0, 50) : String(variacaoInfo.conteudo).substring(0, 50)}..."` 
            : `texto original: "${typeof conteudoParaEnvio.texto === 'string' ? conteudoParaEnvio.texto.substring(0, 50) : String(conteudoParaEnvio.texto || '').substring(0, 50)}..."`;
          break;
        case 'imagem':
          if (variacaoInfo) {
            logVariacao = `legenda variação ${variacaoInfo.indice}: "${typeof variacaoInfo.conteudo === 'string' ? variacaoInfo.conteudo.substring(0, 50) : String(variacaoInfo.conteudo).substring(0, 50)}..."`;
          } else {
            const legenda = conteudoParaEnvio.legenda;
            logVariacao = typeof legenda === 'string' && legenda
              ? `legenda original: "${legenda.substring(0, 50)}..."` 
              : 'sem legenda';
          }
          break;
      }
      
      console.log(`[${campanha.id}] Contato ${i + 1} (${contato.nomeContato}): Usando ${logVariacao}`);
      
      // Enviar mensagem
      const resultado = await sender.enviarMensagem(contato, conteudoParaEnvio as ConteudoMensagem);

      const fimEnvio = Date.now();
      contato.tempoResposta = fimEnvio - inicioEnvio;
      contato.codigoResposta = resultado.codigoResposta;

      if (resultado.sucesso) {
        contato.status = 'sucesso';
        resultados.sucessos++;
        progresso.sucessos++;
      } else {
        contato.status = 'erro';
        contato.tentativas++;
        contato.mensagemErro = resultado.erro;
        resultados.erros++;
        progresso.erros++;
      }

      console.log(`[${campanha.id}] Contato ${contato.nomeContato}: ${resultado.sucesso ? 'SUCESSO' : 'ERRO'} - ${contato.tempoResposta}ms`);

    } catch (error) {
      contato.status = 'erro';
      contato.tentativas++;
      contato.mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      contato.tempoResposta = Date.now() - inicioEnvio;
      resultados.erros++;
      progresso.erros++;
      
      console.error(`[${campanha.id}] Erro no contato ${contato.nomeContato}:`, error);
    }

    contato.ultimaTentativa = Date.now();
    resultados.logs.push({ ...contato });

    // ATUALIZAR PROGRESSO A CADA MENSAGEM ENVIADA
    progresso.contatosProcessados++;
    progresso.ultimaAtualizacao = Date.now();
    progresso.mensagemStatus = `Enviado para ${contato.nomeContato} (${progresso.contatosProcessados}/${progresso.totalContatos})`;
    
    // Emitir progresso individual (WebSocket)
    emitirProgresso(wsManager, progresso);
    
    // ATUALIZAR TAMBÉM NO BANCO IMEDIATAMENTE para polling
    await atualizarEstatisticasEmTempRoeal(campanhaId, progresso, cliente, idInstancia);

    console.log(`[${campanha.id}] Progresso atualizado: ${progresso.contatosProcessados}/${progresso.totalContatos} (${(progresso.contatosProcessados / progresso.totalContatos * 100).toFixed(1)}%)`);

    // Delay entre mensagens dentro do lote - com verificação ASSÍNCRONA
    if (i < lote.length - 1) {
      const delayAleatorio = gerarDelayAleatorio();
      console.log(`[${campanha.id}] Aguardando ${delayAleatorio}ms antes da próxima mensagem...`);
      
      // Verificar durante o delay se deve parar
      const delayStep = 500; // Verificar a cada 500ms
      for (let elapsed = 0; elapsed < delayAleatorio; elapsed += delayStep) {
        if (await devePararCampanha(campanhaId, cliente, idInstancia)) {
          console.log(`[${campanha.id}] 🛑 INTERROMPENDO DURANTE DELAY ENTRE MENSAGENS`);
          break;
        }
        await delay(Math.min(delayStep, delayAleatorio - elapsed));
      }
    }
  }

  return resultados;
}

async function atualizarEstatisticasEmTempRoeal(campanhaId: string, progresso: ProgressoEnvio, cliente: string, idInstancia: string) {
  try {
    const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
    const campanhaRef = dbAdmin.collection(campanhaPath).doc(campanhaId);
    
    // Calcular percentual
    const percentualConcluido = progresso.totalContatos > 0 
      ? (progresso.contatosProcessados / progresso.totalContatos) * 100 
      : 0;
    
    // Atualizar apenas as estatísticas essenciais para o progresso
    await campanhaRef.update({
      'estatisticas.enviados': progresso.contatosProcessados,
      'estatisticas.sucessos': progresso.sucessos,
      'estatisticas.erros': progresso.erros,
      'estatisticas.percentualSucesso': progresso.sucessos > 0 ? (progresso.sucessos / progresso.contatosProcessados) * 100 : 0,
      ultimaAtualizacao: progresso.ultimaAtualizacao
    });
    
    console.log(`[${campanhaId}] Estatísticas em tempo real atualizadas no banco: ${percentualConcluido.toFixed(1)}%`);
    
  } catch (error) {
    console.error(`[${campanhaId}] Erro ao atualizar estatísticas em tempo real:`, error);
  }
}

function obterConteudoComVariacao(
  conteudoOriginal: Record<string, unknown>, 
  variacoes: string[], 
  indiceNoLote: number, 
  indiceGlobal: number
): ConteudoComVariacao {
  const tipoMensagem = conteudoOriginal.tipo;
  
  // Para mensagens de texto
  if (tipoMensagem === 'texto') {
    if (!Array.isArray(variacoes) || variacoes.length === 0) {
      console.log(`[DEBUG] Texto sem variações disponíveis`);
      return { conteudo: conteudoOriginal, variacaoInfo: null };
    }

    const indiceVariacao = obterIndiceVariacaoAleatoria(variacoes.length, indiceGlobal);
    const textoVariado = variacoes[indiceVariacao];

    console.log(`[DEBUG] Texto - Variação ${indiceVariacao}: "${typeof textoVariado === 'string' ? textoVariado.substring(0, 30) : String(textoVariado).substring(0, 30)}..."`);

    return {
      conteudo: {
        ...conteudoOriginal,
        texto: textoVariado
      },
      variacaoInfo: {
        indice: indiceVariacao,
        conteudo: textoVariado || '',
        tipo: 'texto' as const
      }
    };
  }
  
  // Para mensagens de imagem com legenda
  if (tipoMensagem === 'imagem' && conteudoOriginal.legenda) {
    const variacoesLegenda = Array.isArray(conteudoOriginal.variacoesLegenda) 
      ? conteudoOriginal.variacoesLegenda as string[]
      : [String(conteudoOriginal.legenda)];
    
    if (variacoesLegenda.length > 1) {
      const indiceVariacao = obterIndiceVariacaoAleatoria(variacoesLegenda.length, indiceGlobal);
      const legendaVariada = variacoesLegenda[indiceVariacao];

      console.log(`[DEBUG] Imagem - Legenda variação ${indiceVariacao}: "${typeof legendaVariada === 'string' ? legendaVariada.substring(0, 30) : String(legendaVariada).substring(0, 30)}..."`);

      return {
        conteudo: {
          ...conteudoOriginal,
          legenda: legendaVariada
        },
        variacaoInfo: {
          indice: indiceVariacao,
          conteudo: String(legendaVariada || ''),
          tipo: 'legenda' as const
        }
      };
    }
  }
  
  // Para mensagens com botões
  if (tipoMensagem === 'botoes') {
    if (!Array.isArray(variacoes) || variacoes.length === 0) {
      console.log(`[DEBUG] Botões sem variações disponíveis`);
      return { conteudo: conteudoOriginal, variacaoInfo: null };
    }

    const indiceVariacao = obterIndiceVariacaoAleatoria(variacoes.length, indiceGlobal);
    const textoVariado = variacoes[indiceVariacao];

    console.log(`[DEBUG] Botões - Texto variação ${indiceVariacao}: "${typeof textoVariado === 'string' ? textoVariado.substring(0, 30) : String(textoVariado).substring(0, 30)}..."`);

    return {
      conteudo: {
        ...conteudoOriginal,
        texto: textoVariado
      },
      variacaoInfo: {
        indice: indiceVariacao,
        conteudo: String(textoVariado || ''),
        tipo: 'texto' as const
      }
    };
  }

  console.log(`[DEBUG] Retornando conteúdo original - tipo: ${tipoMensagem}`);
  return { conteudo: conteudoOriginal, variacaoInfo: null };
}

// Funções auxiliares
function obterIndiceVariacaoAleatoria(totalVariacoes: number, indiceContato: number): number {
  if (totalVariacoes <= 1) {
    return 0;
  }

  // Usar uma função de hash mais robusta para melhor distribuição
  let seed = indiceContato;
  seed = ((seed << 13) ^ seed) >>> 0;
  seed = (seed * (seed * seed * 15731 + 789221) + 1376312589) >>> 0;
  
  const random = (seed & 0x7fffffff) / 0x7fffffff;
  
  // Distribuição ponderada melhorada
  const pesoOriginal = 0.25; // 25% para o texto original
  const pesoVariacoes = 0.75 / (totalVariacoes - 1); // 75% dividido entre as variações
  
  let acumulado = 0;
  
  // Verificar se cai no texto original (índice 0)
  acumulado += pesoOriginal;
  if (random < acumulado) {
    return 0;
  }
  
  // Verificar em qual variação cai
  for (let i = 1; i < totalVariacoes; i++) {
    acumulado += pesoVariacoes;
    if (random < acumulado) {
      return i;
    }
  }
  
  // Fallback com distribuição uniforme
  return 1 + Math.floor(random * (totalVariacoes - 1));
}

function dividirEmLotes<T>(array: T[], tamanhoLote: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < array.length; i += tamanhoLote) {
    lotes.push(array.slice(i, i + tamanhoLote));
  }
  return lotes;
}

function gerarDelayAleatorio(): number {
  return Math.floor(
    Math.random() * (CONFIG_ENVIO.DELAY_MAXIMO_MENSAGEM - CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM) + 
    CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM
  );
}

function calcularEstimativaTermino(totalContatos: number): number {
  const delayMedioMensagem = (CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM + CONFIG_ENVIO.DELAY_MAXIMO_MENSAGEM) / 2;
  const tempoMensagens = totalContatos * delayMedioMensagem;
  const numeroLotes = Math.ceil(totalContatos / CONFIG_ENVIO.TAMANHO_LOTE);
  const tempoLotes = (numeroLotes - 1) * CONFIG_ENVIO.DELAY_ENTRE_LOTES;
  
  return Date.now() + tempoMensagens + tempoLotes + 60000; // +1 minuto de margem
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscarTokens(cliente: string, idInstancia: string) {
  // Buscar token da instância
  const instanciasRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias`);
  const instanciasSnap = await instanciasRef.get();
  
  let tokenInstancia = null;
  instanciasSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.idInstancia === idInstancia) {
      tokenInstancia = data.tokenInstancia;
    }
  });

  // Buscar client token
  const clienteRef = dbAdmin.doc(`/empresas/${cliente}/produtos/zcampanha`);
  const clienteDoc = await clienteRef.get();
  const clientToken = clienteDoc.data()?.['Client-Token'];

  return { tokenInstancia, clientToken };
}

async function atualizarLogsCampanha(campanhaRef: FirebaseDocRef, logs: LogEnvio[]) {
  const campanhaDoc = await campanhaRef.get();
  const campanha = campanhaDoc.data() as Campanha;
  
  // Atualizar logs existentes
  const logsAtualizados = campanha.logs.map(logExistente => {
    const logAtualizado = logs.find(l => l.contatoId === logExistente.contatoId);
    return logAtualizado || logExistente;
  });

  // Calcular estatísticas atualizadas
  const estatisticas = {
    totalContatos: logsAtualizados.length,
    pendentes: logsAtualizados.filter(l => l.status === 'pendente').length,
    enviados: logsAtualizados.filter(l => l.status !== 'pendente').length,
    sucessos: logsAtualizados.filter(l => l.status === 'sucesso').length,
    erros: logsAtualizados.filter(l => l.status === 'erro').length,
    percentualSucesso: 0
  };
  
  if (estatisticas.enviados > 0) {
    estatisticas.percentualSucesso = (estatisticas.sucessos / estatisticas.enviados) * 100;
  }

  await campanhaRef.update({
    logs: logsAtualizados,
    estatisticas
  });
}

async function finalizarCampanha(campanhaRef: FirebaseDocRef, progresso: ProgressoEnvio) {
  const agora = Date.now();
  
  // CORREÇÃO: Verificar se REALMENTE deve finalizar como concluída
  const campanhaDoc = await campanhaRef.get();
  const campanhaAtual = campanhaDoc.data() as Campanha;
  
  // Calcular estatísticas finais
  const logsPendentes = campanhaAtual.logs.filter(log => 
    log.status === 'pendente' || (log.status === 'erro' && log.tentativas < CONFIG_ENVIO.MAX_TENTATIVAS_CONTATO)
  );
  
  const statusFinal: StatusCampanha = logsPendentes.length === 0 ? 'concluida' : 'pausada';
  
  console.log(`[${progresso.campanhaId}] FINALIZANDO: ${logsPendentes.length} contatos pendentes restantes`);
  console.log(`[${progresso.campanhaId}] STATUS FINAL: ${statusFinal}`);
  
  progresso.status = statusFinal;
  progresso.mensagemStatus = statusFinal === 'concluida' 
    ? `Campanha finalizada! ${progresso.sucessos} sucessos, ${progresso.erros} erros`
    : `Campanha pausada com ${logsPendentes.length} contatos pendentes`;
  progresso.ultimaAtualizacao = agora;

  const updateData: Record<string, unknown> = {
    status: statusFinal,
    ultimaAtualizacao: agora
  };

  // Só marcar como concluída se realmente não há pendências
  if (statusFinal === 'concluida') {
    updateData.dataConclusao = agora;
  }

  await campanhaRef.update(updateData);
  
  console.log(`[${progresso.campanhaId}] Campanha finalizada com status: ${statusFinal}`);
}

function emitirProgresso(wsManager: WebSocketManager, progresso: ProgressoEnvio) {
  // Map ProgressoEnvio to ProgressoCampanha with compatible status types
  const statusMapping: Record<ProgressoEnvio['status'], ProgressoCampanha['status']> = {
    'iniciando': 'iniciando',
    'criando-variacoes': 'criando-variacoes', 
    'processando': 'processando',
    'finalizando': 'finalizando',
    'concluida': 'concluida',
    'erro': 'erro',
    'pausada': 'processando', // Map pausada to processando for WebSocket compatibility
    'cancelada': 'erro' // Map cancelada to erro for WebSocket compatibility
  };

  const progressoWS: ProgressoCampanha = {
    campanhaId: progresso.campanhaId,
    status: statusMapping[progresso.status],
    loteAtual: progresso.loteAtual,
    totalLotes: progresso.totalLotes,
    contatosProcessados: progresso.contatosProcessados,
    totalContatos: progresso.totalContatos,
    sucessos: progresso.sucessos,
    erros: progresso.erros,
    iniciadoEm: progresso.iniciadoEm,
    ultimaAtualizacao: progresso.ultimaAtualizacao,
    percentualConcluido: progresso.totalContatos > 0 
      ? (progresso.contatosProcessados / progresso.totalContatos) * 100 
      : 0,
    estimativaTermino: progresso.estimativaTermino,
    mensagemStatus: progresso.mensagemStatus
  };
  
  wsManager.emitirProgressoCampanha(progressoWS);
}

async function criarVariacoesMensagem(campanha: Campanha, campanhaRef: FirebaseDocRef) {
  // Verificar se já existem variações
  if (campanha.conteudo.variacoes && campanha.conteudo.variacoes.length > 1) {
    console.log(`[${campanha.id}] Variações já existem, pulando criação...`);
    return;
  }

  // Determinar qual texto usar para criar variações baseado no tipo
  let textoParaVariacao = '';
  const tipoMensagem = campanha.conteudo.tipo;

  switch (tipoMensagem) {
    case 'texto':
      textoParaVariacao = campanha.conteudo.texto || '';
      break;
    
    case 'imagem':
      // Para imagens, usar a legenda se existir, senão não criar variações
      if (campanha.conteudo.legenda && campanha.conteudo.legenda.trim()) {
        textoParaVariacao = campanha.conteudo.legenda.trim();
      } else {
        console.log(`[${campanha.id}] Imagem sem legenda, não criando variações`);
        return;
      }
      break;
    
    case 'botoes':
      // Para botões, usar o texto principal
      textoParaVariacao = campanha.conteudo.texto || '';
      break;
    
    default:
      console.log(`[${campanha.id}] Tipo de mensagem não suportado para variações: ${tipoMensagem}`);
      return;
  }

  // Validar se o texto tem conteúdo suficiente
  if (!textoParaVariacao || textoParaVariacao.trim().length === 0) {
    console.log(`[${campanha.id}] Texto vazio, não criando variações`);
    return;
  }

  const textoLimpo = textoParaVariacao.trim();
  let variacoes = [textoLimpo]; // Sempre incluir o texto original

  try {
    // VALIDAÇÃO: Só usar OpenAI se o texto tiver mais de 30 caracteres
    if (textoLimpo.length > 30) {
      console.log(`[${campanha.id}] Texto qualifica para OpenAI (${textoLimpo.length} chars > 30)`);
      console.log(`[${campanha.id}] Iniciando chamada para OpenAI...`);
      
      const variacoesOpenAI = await criarVariacoesComOpenAI(campanha, campanhaRef, textoLimpo);
      
      if (variacoesOpenAI && variacoesOpenAI.length > 1) {
        variacoes = variacoesOpenAI;
        console.log(`[${campanha.id}] OpenAI gerou ${variacoes.length} variações com sucesso`);
      } else {
        console.log(`[${campanha.id}] OpenAI retornou resultado inválido:`, variacoesOpenAI);
        throw new Error('OpenAI não retornou variações válidas');
      }
    } else {
      console.log(`[${campanha.id}] Texto muito curto para OpenAI (${textoLimpo.length} chars <= 30)`);
      throw new Error('Texto muito curto para OpenAI');
    }

  } catch (error) {
    console.warn(`[${campanha.id}] Fallback para variações simples. Erro:`, error);
    
    // ESTRATÉGIA 2: Fallback para variações simples
    variacoes = gerarVariacoesMensagemSimples(textoLimpo);
    console.log(`[${campanha.id}] Geradas ${variacoes.length} variações simples`);
  }

  // Atualizar conteúdo com variações baseado no tipo de mensagem
  let conteudoAtualizado: Record<string, unknown>;
  
  switch (tipoMensagem) {
    case 'texto':
      conteudoAtualizado = {
        ...campanha.conteudo,
        variacoes
      };
      break;
    
    case 'imagem':
      // Para imagens, criar variações da legenda
      conteudoAtualizado = {
        ...campanha.conteudo,
        variacoesLegenda: variacoes
      };
      break;
    
    case 'botoes':
      // Para botões, criar variações do texto principal
      conteudoAtualizado = {
        ...campanha.conteudo,
        variacoes
      };
      break;
  }

  await campanhaRef.update({
    conteudo: conteudoAtualizado
  });

  console.log(`[${campanha.id}] Variações salvas para ${tipoMensagem}: ${variacoes.length} total`);
}

async function criarVariacoesComOpenAI(
  campanha: Campanha, 
  campanhaRef: FirebaseDocRef, 
  textoParaVariacao: string
): Promise<string[]> {
  const { cliente, idInstancia } = extrairParametrosDaRef(campanhaRef);
  
  try {
    console.log(`[${campanha.id}] Chamando API: /api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas/${campanha.id}/cria-variacoes`);
    
    const response = await fetch(`${getBaseUrl()}/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas/${campanha.id}/cria-variacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: textoParaVariacao
      })
    });

    console.log(`[${campanha.id}] Resposta da API: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[${campanha.id}] Dados recebidos:`, {
        variacoes: data.variacoes?.length || 0,
        usouFallback: data.usouFallback,
        usouCache: data.usouCache,
        erro: data.erro
      });
      
      return data.variacoes || [textoParaVariacao];
    } else {
      const errorData = await response.json();
      console.error(`[${campanha.id}] Erro HTTP ${response.status}:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

  } catch (error) {
    console.error(`[${campanha.id}] Erro na chamada OpenAI:`, error);
    throw error;
  }
}

function gerarVariacoesMensagemSimples(textoOriginal: string): string[] {
  const variacoes = [textoOriginal]; // Sempre incluir o texto original

  // Variações baseadas em transformações de texto
  const transformacoes = [
    // Variações de saudação
    (texto: string) => texto.replace(/\bOlá\b/gi, 'Oi'),
    (texto: string) => texto.replace(/\bOi\b/gi, 'Olá'),
    (texto: string) => texto.replace(/\bBom dia\b/gi, 'Olá'),
    (texto: string) => texto.replace(/\bBoa tarde\b/gi, 'Oi'),
    
    // Variações de despedida
    (texto: string) => texto.replace(/\bAbraços\b/gi, 'Att'),
    (texto: string) => texto.replace(/\bAtenciosamente\b/gi, 'Cordialmente'),
    (texto: string) => texto.replace(/\bObrigado\b/gi, 'Muito obrigado'),
    
    // Variações de pontuação
    (texto: string) => texto.replace(/!/g, '.'),
    (texto: string) => texto.replace(/\.\.\./g, '…'),
    (texto: string) => texto.replace(/\?/g, '?!'),
    
    // Variações de formalidade
    (texto: string) => texto.replace(/\bvocê\b/gi, 'tu'),
    (texto: string) => texto.replace(/\bseu\b/gi, 'teu'),
    (texto: string) => texto.replace(/\bsua\b/gi, 'tua'),
    
    // Adição de elementos
    (texto: string) => texto + ' 😊',
    (texto: string) => texto + ' 👍',
    (texto: string) => '✨ ' + texto,
    
    // Variações de conectivos
    (texto: string) => texto.replace(/\be\b/g, 'e também'),
    (texto: string) => texto.replace(/\bmas\b/g, 'porém'),
    (texto: string) => texto.replace(/\bentão\b/g, 'assim'),
    
    // Variações de intensidade
    (texto: string) => texto.replace(/\bmuito\b/gi, 'super'),
    (texto: string) => texto.replace(/\bótimo\b/gi, 'excelente'),
    (texto: string) => texto.replace(/\bbom\b/gi, 'legal'),
  ];

  // Aplicar transformações
  transformacoes.forEach(transformacao => {
    try {
      const variacao = transformacao(textoOriginal);
      if (variacao && variacao !== textoOriginal && !variacoes.includes(variacao)) {
        variacoes.push(variacao);
      }
    } catch (error) {
      console.error('Erro na transformação:', error);
    }
  });

  // Combinações de transformações (máximo 3 adicionais)
  const combinacoes = [
    (texto: string) => texto.replace(/\bOlá\b/gi, 'Oi').replace(/!/g, '.'),
    (texto: string) => texto.replace(/\bvocê\b/gi, 'tu') + ' 😊',
    (texto: string) => '✨ ' + texto.replace(/\bObrigado\b/gi, 'Muito obrigado'),
  ];

  combinacoes.forEach(combinacao => {
    try {
      const variacao = combinacao(textoOriginal);
      if (variacao && variacao !== textoOriginal && !variacoes.includes(variacao)) {
        variacoes.push(variacao);
      }
    } catch (error) {
      console.error('Erro: ', error);
    }
  });

  // Limitar a 8 variações para deixar espaço para as da OpenAI
  return variacoes.slice(0, 8);
}

// Função auxiliar para extrair parâmetros da referência do Firestore
function extrairParametrosDaRef(campanhaRef: FirebaseDocRef): { cliente: string; idInstancia: string } {
  // Exemplo de path: /empresas/cliente/produtos/zcampanha/instancias/idInstancia/campanhas/campanhaId
  const pathParts = campanhaRef.path.split('/');
  const cliente = pathParts[1];
  const idInstancia = pathParts[5];
  
  return { cliente, idInstancia };
}

// Função auxiliar para obter a URL base
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';
  }
  return 'http://localhost:3000';
}
