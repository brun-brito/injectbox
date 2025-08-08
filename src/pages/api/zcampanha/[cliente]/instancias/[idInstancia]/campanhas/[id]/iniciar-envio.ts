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

// NOVO: Configurações específicas para produção (MOVER PARA O TOPO)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const AMBIENTE = IS_PRODUCTION ? 'PRODUÇÃO' : 'DESENVOLVIMENTO';

// NOVA INTERFACE: Resultado do envio de mensagem
interface ResultadoEnvio {
  sucesso: boolean;
  codigoResposta?: string;
  erro?: string;
  statusCode?: number;
  detalhes?: string;
}

// CONFIGURAÇÕES AJUSTADAS PARA PRODUÇÃO
const CONFIG_ENVIO = {
  TAMANHO_LOTE: IS_PRODUCTION ? 10 : 15, // Ainda menor em produção
  DELAY_ENTRE_LOTES: IS_PRODUCTION ? 15000 : 20000, // 15s em produção
  DELAY_MINIMO_MENSAGEM: IS_PRODUCTION ? 1000 : 1500, // 1s em produção
  DELAY_MAXIMO_MENSAGEM: IS_PRODUCTION ? 3000 : 4000, // 3s em produção
  MAX_TENTATIVAS_CONTATO: 3,
  TIMEOUT_REQUISICAO: IS_PRODUCTION ? 8000 : 10000, // 8s em produção
  TIMEOUT_TOTAL_FUNCAO: IS_PRODUCTION ? 55000 : 90000, // 55s em produção (margem de 5s)
  MAX_CONTATOS_POR_EXECUCAO: IS_PRODUCTION ? 25 : 50, // Máximo 25 em produção
};

// TIPO PARA O PROGRESSO DE ENVIO
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
  const startTime = Date.now();
  
  console.log(`🚀 [${AMBIENTE}] INICIANDO HANDLER`);
  console.log(`⚙️ [${AMBIENTE}] Configurações:`, {
    timeout: CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO,
    maxContatos: CONFIG_ENVIO.MAX_CONTATOS_POR_EXECUCAO,
    tamanhoLote: CONFIG_ENVIO.TAMANHO_LOTE
  });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  console.log(`📊 [${id}] DADOS RECEBIDOS: cliente=${cliente}, instancia=${idInstancia}`);

  const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
  const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);

  try {
    // Verificar se a campanha existe e pode ser enviada
    console.log(`🔍 [${id}] Buscando campanha no banco...`);
    const doc = await campanhaRef.get();
    if (!doc.exists) {
      console.error(`❌ [${id}] Campanha não encontrada`);
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = { id: doc.id, ...doc.data() } as Campanha;
    console.log(`📋 [${id}] Campanha encontrada: status=${campanha.status}, logs=${campanha.logs?.length || 0}`);
    
    // CORREÇÃO: Aceitar campanhas pausadas para retomada
    if (!['rascunho', 'pausada'].includes(campanha.status)) {
      console.warn(`⚠️ [${id}] Status inválido: ${campanha.status}`);
      return res.status(400).json({ 
        error: `Campanha não pode ser enviada. Status atual: ${campanha.status}`,
        details: `Apenas campanhas com status 'rascunho' ou 'pausada' podem ser iniciadas/retomadas.`
      });
    }

    // Filtrar contatos pendentes
    const contatosPendentes = campanha.logs.filter(log => 
      log.status === 'pendente' || (log.status === 'erro' && log.tentativas < CONFIG_ENVIO.MAX_TENTATIVAS_CONTATO)
    );

    console.log(`📞 [${id}] Contatos pendentes: ${contatosPendentes.length}`);

    if (contatosPendentes.length === 0) {
      console.warn(`⚠️ [${id}] Nenhum contato pendente encontrado`);
      return res.status(400).json({ 
        error: 'Não há contatos pendentes para envio' 
      });
    }

    // VERIFICAÇÃO CRÍTICA: Em produção, sempre usar modo simplificado para lotes grandes
    if (IS_PRODUCTION && contatosPendentes.length > 15) {
      console.log(`🔧 [${id}] PRODUÇÃO: Ativando modo simplificado para ${contatosPendentes.length} contatos`);
      return processarLoteSimplificado(campanha, contatosPendentes.slice(0, 15), campanhaRef, cliente, idInstancia, res);
    }

    console.log(`[${id}] INICIAR/RETOMAR ENVIO: ${contatosPendentes.length} contatos pendentes`);

    // Buscar tokens necessários
    console.log(`🔑 [${id}] Buscando tokens...`);
    const { tokenInstancia, clientToken } = await buscarTokens(cliente, idInstancia);
    if (!tokenInstancia || !clientToken) {
      console.error(`❌ [${id}] Tokens não encontrados: instancia=${!!tokenInstancia}, client=${!!clientToken}`);
      return res.status(400).json({ 
        error: 'Tokens de instância não encontrados' 
      });
    }
    console.log(`✅ [${id}] Tokens encontrados com sucesso`);

    // Atualizar status inicial da campanha
    const agora = Date.now();
    console.log(`💾 [${id}] Atualizando status para 'enviando'...`);
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

    console.log(`📤 [${id}] Respondendo ao cliente: ${contatosPendentes.length} contatos, ${totalLotes} lotes`);

    // Responder imediatamente ao cliente
    res.status(200).json({
      message: 'Envio da campanha iniciado com sucesso',
      progresso,
      totalContatos: contatosPendentes.length,
      totalLotes,
      ambiente: AMBIENTE,
      timeout: CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO
    });

    // NOVO: Timeout mais agressivo em produção
    const tempoDecorrido = Date.now() - startTime;
    const tempoRestante = CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO - tempoDecorrido;
    
    console.log(`⏱️ [${id}] Tempo decorrido: ${tempoDecorrido}ms, restante: ${tempoRestante}ms`);
    
    if (IS_PRODUCTION && tempoRestante < 20000) { // 20 segundos em produção
      console.warn(`⚠️ [${id}] PRODUÇÃO: Tempo insuficiente, usando modo express`);
      
      setImmediate(() => {
        processarModoExpress(
          campanha,
          contatosPendentes.slice(0, 5), // Apenas 5 contatos no modo express
          tokenInstancia,
          clientToken,
          campanhaRef,
          cliente,
          idInstancia
        ).catch(error => {
          console.error(`💥 [${id}] Erro no modo express:`, error);
        });
      });
      return;
    }

    // Iniciar processamento assíncrono (sem await para não bloquear a resposta)
    console.log(`🔄 [${id}] Iniciando processamento assíncrono...`);
    setImmediate(() => {
      processarCampanhaCompleta(
        campanha,
        contatosPendentes,
        tokenInstancia,
        clientToken,
        campanhaRef,
        cliente,
        idInstancia,
        progresso,
        startTime
      ).catch(error => {
        console.error(`💥 [${id}] Erro no processamento da campanha:`, error);
      });
    });

  } catch (error) {
    const tempoTotal = Date.now() - startTime;
    console.error(`💥 Erro ao iniciar envio (${tempoTotal}ms):`, error);
    
    // NOVO: Log detalhado para debug
    console.error(`💥 Stack trace:`, error instanceof Error ? error.stack : 'Sem stack');
    console.error(`💥 Ambiente:`, process.env.NODE_ENV);
    console.error(`💥 Timeout configurado:`, CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      tempoExecucao: tempoTotal,
      ambiente: AMBIENTE
    });
  }
}

// NOVA FUNÇÃO: Processamento simplificado para produção
async function processarLoteSimplificado(
  campanha: Campanha,
  contatos: LogEnvio[],
  campanhaRef: FirebaseDocRef,
  cliente: string,
  idInstancia: string,
  res: NextApiResponse
) {
  console.log(`🚀 [${campanha.id}] PROCESSAMENTO SIMPLIFICADO: ${contatos.length} contatos`);
  
  // Responder imediatamente
  res.status(200).json({
    message: 'Processamento simplificado iniciado',
    totalContatos: contatos.length,
    modo: 'simplificado',
    ambiente: 'PRODUÇÃO'
  });

  // Processar de forma simplificada
  try {
    const { tokenInstancia, clientToken } = await buscarTokens(cliente, idInstancia);
    if (!tokenInstancia || !clientToken) {
      throw new Error('Tokens não encontrados');
    }

    // Criar instância do MensagemSender
    const sender = new MensagemSender({
      tokenInstancia,
      clientToken,
      idInstancia,
      timeout: CONFIG_ENVIO.TIMEOUT_REQUISICAO
    });

    // Processar contatos sequencialmente com timeout rígido
    for (let i = 0; i < contatos.length; i++) {
      const contato = contatos[i];
      const inicioEnvio = Date.now();
      
      try {
        contato.status = 'enviando';
        contato.timestampEnvio = inicioEnvio;
        
        // NOVO: Obter variação para qualquer tipo de mensagem
        const { conteudo: conteudoParaEnvio, variacaoInfo } = obterConteudoComVariacao(
          campanha.conteudo, 
          campanha.conteudo.variacoes || [campanha.conteudo.texto || ''], 
          i, 
          i
        );

        // NOVO: Salvar variação usada no log
        if (variacaoInfo) {
          contato.variacaoUsada = variacaoInfo;
        }
        
        // Enviar mensagem com tipo correto
        const resultado = await Promise.race([
          sender.enviarMensagem(contato, conteudoParaEnvio as ConteudoMensagem),
          new Promise<ResultadoEnvio>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout individual')), CONFIG_ENVIO.TIMEOUT_REQUISICAO)
          )
        ]) as ResultadoEnvio;

        const fimEnvio = Date.now();
        contato.tempoResposta = fimEnvio - inicioEnvio;
        
        if (resultado.sucesso) {
          contato.status = 'sucesso';
          contato.codigoResposta = resultado.codigoResposta ? parseInt(resultado.codigoResposta, 10) : undefined;
        } else {
          contato.status = 'erro';
          contato.tentativas++;
          contato.mensagemErro = resultado.erro;
        }

        console.log(`📞 [${campanha.id}] Contato ${i + 1}/${contatos.length}: ${contato.status} (${contato.tempoResposta}ms)`);

      } catch (error) {
        contato.status = 'erro';
        contato.tentativas++;
        contato.mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
        contato.tempoResposta = Date.now() - inicioEnvio;
        console.error(`❌ [${campanha.id}] Erro contato ${i + 1}:`, error);
      }

      contato.ultimaTentativa = Date.now();
      
      // Delay menor entre mensagens
      if (i < contatos.length - 1) {
        await delay(1000); // 1 segundo apenas
      }
    }

    // Atualizar logs no banco
    await atualizarLogsCampanha(campanhaRef, contatos);
    
    console.log(`✅ [${campanha.id}] Processamento simplificado concluído`);

  } catch (error) {
    console.error(`💥 [${campanha.id}] Erro no processamento simplificado:`, error);
    await campanhaRef.update({
      status: 'pausada' as StatusCampanha,
      ultimaAtualizacao: Date.now()
    });
  }
}

// NOVA FUNÇÃO: Processamento com controle de timeout
async function processarCampanhaSimplificada(
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
  const startTime = Date.now();
  
  console.log(`🔥 [${campanhaId}] PROCESSAMENTO SIMPLIFICADO INICIADO`);
  
  registrarCampanhaAtiva(campanhaId, cliente, idInstancia);
  
  try {
    // Criar variações apenas se necessário
    await criarVariacoesMensagem(campanha, campanhaRef);
    
    // Verificar timeout
    if (Date.now() - startTime > CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO * 0.8) {
      console.warn(`⏱️ [${campanhaId}] Timeout próximo, finalizando`);
      return;
    }

    // Buscar campanha atualizada
    const campanhaDoc = await campanhaRef.get();
    const campanhaAtualizada = { id: campanhaDoc.id, ...campanhaDoc.data() } as Campanha;
    
    if (!campanhaAtualizada.conteudo.variacoes || campanhaAtualizada.conteudo.variacoes.length === 0) {
      campanhaAtualizada.conteudo.variacoes = [campanha.conteudo.texto || ''];
    }

    // Criar instância do MensagemSender
    const sender = new MensagemSender({
      tokenInstancia,
      clientToken,
      idInstancia,
      timeout: CONFIG_ENVIO.TIMEOUT_REQUISICAO
    });

    // Processar apenas primeiro lote
    const primeiroLote = contatosPendentes.slice(0, CONFIG_ENVIO.TAMANHO_LOTE);
    
    console.log(`📦 [${campanhaId}] Processando lote simplificado: ${primeiroLote.length} contatos`);
    
    const resultados = await processarLoteSimples(primeiroLote, campanhaAtualizada, sender, progresso, campanhaId);
    
    // Atualizar logs
    await atualizarLogsCampanha(campanhaRef, resultados.logs);
    
    // Verificar se ainda há contatos pendentes
    const campanhaFinal = await campanhaRef.get();
    const campanhaFinalData = campanhaFinal.data() as Campanha;
    const aindaPendentes = campanhaFinalData.logs.filter(log => 
      log.status === 'pendente' || (log.status === 'erro' && log.tentativas < CONFIG_ENVIO.MAX_TENTATIVAS_CONTATO)
    );
    
    if (aindaPendentes.length === 0) {
      await campanhaRef.update({
        status: 'concluida' as StatusCampanha,
        dataConclusao: Date.now()
      });
      console.log(`✅ [${campanhaId}] Campanha concluída!`);
    } else {
      await campanhaRef.update({
        status: 'pausada' as StatusCampanha,
        ultimaAtualizacao: Date.now()
      });
      console.log(`⏸️ [${campanhaId}] Campanha pausada: ${aindaPendentes.length} contatos restantes`);
    }
    
    limparControleCampanha(campanhaId, cliente, idInstancia);
    
  } catch (error) {
    console.error(`💥 [${campanhaId}] Erro no processamento simplificado:`, error);
    
    await campanhaRef.update({
      status: 'pausada' as StatusCampanha,
      ultimaAtualizacao: Date.now()
    });
    
    limparControleCampanha(campanhaId, cliente, idInstancia);
  }
}

// FUNÇÃO SIMPLIFICADA para processar lote
async function processarLoteSimples(
  lote: LogEnvio[],
  campanha: Campanha,
  sender: MensagemSender,
  progresso: ProgressoEnvio,
  campanhaId: string
) {
  const resultados = {
    sucessos: 0,
    erros: 0,
    logs: [] as LogEnvio[]
  };

  const variacoes = campanha.conteudo.variacoes || [campanha.conteudo.texto || ''];

  for (let i = 0; i < lote.length; i++) {
    const contato = lote[i];
    const inicioEnvio = Date.now();
    
    try {
      contato.status = 'enviando';
      contato.timestampEnvio = inicioEnvio;
      
      // Escolher variação
      const { conteudo: conteudoParaEnvio, variacaoInfo } = obterConteudoComVariacao(
        campanha.conteudo, 
        variacoes, 
        i, 
        progresso.contatosProcessados + i
      );

      if (variacaoInfo) {
        contato.variacaoUsada = variacaoInfo;
      }
      
      // Enviar mensagem com timeout e tipo correto
      const resultado = await Promise.race([
        sender.enviarMensagem(contato, conteudoParaEnvio as ConteudoMensagem),
        new Promise<ResultadoEnvio>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), CONFIG_ENVIO.TIMEOUT_REQUISICAO)
        )
      ]) as ResultadoEnvio;

      const fimEnvio = Date.now();
      contato.tempoResposta = fimEnvio - inicioEnvio;
      contato.codigoResposta = resultado.codigoResposta ? parseInt(resultado.codigoResposta, 10) : undefined;

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

      console.log(`📞 [${campanhaId}] ${contato.nomeContato}: ${contato.status} (${contato.tempoResposta}ms)`);

    } catch (error) {
      contato.status = 'erro';
      contato.tentativas++;
      contato.mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      contato.tempoResposta = Date.now() - inicioEnvio;
      resultados.erros++;
      progresso.erros++;
      
      console.error(`❌ [${campanhaId}] Erro ${contato.nomeContato}:`, error);
    }

    contato.ultimaTentativa = Date.now();
    resultados.logs.push({ ...contato });

    progresso.contatosProcessados++;
    progresso.ultimaAtualizacao = Date.now();

    // Delay mínimo entre mensagens
    if (i < lote.length - 1) {
      await delay(1500); // 1.5 segundos
    }
  }

  return resultados;
}

// NOVA FUNÇÃO: Modo express para situações críticas de timeout
async function processarModoExpress(
  campanha: Campanha,
  contatos: LogEnvio[],
  tokenInstancia: string,
  clientToken: string,
  campanhaRef: FirebaseDocRef,
  cliente: string,
  idInstancia: string
) {
  const campanhaId = campanha.id!;
  console.log(`⚡ [${campanhaId}] MODO EXPRESS: ${contatos.length} contatos`);
  
  try {
    registrarCampanhaAtiva(campanhaId, cliente, idInstancia);
    
    // Pular criação de variações no modo express
    const sender = new MensagemSender({
      tokenInstancia,
      clientToken,
      idInstancia,
      timeout: 5000 // Timeout super agressivo
    });

    // Processar sem delays
    for (let i = 0; i < contatos.length; i++) {
      const contato = contatos[i];
      const inicioEnvio = Date.now();
      
      try {
        contato.status = 'enviando';
        contato.timestampEnvio = inicioEnvio;
        
        // NOVO: Obter variação mesmo no modo express
        const { conteudo: conteudoParaEnvio, variacaoInfo } = obterConteudoComVariacao(
          campanha.conteudo, 
          campanha.conteudo.variacoes || [campanha.conteudo.texto || ''], 
          i, 
          i
        );

        // NOVO: Salvar variação usada no log
        if (variacaoInfo) {
          contato.variacaoUsada = variacaoInfo;
        }
        
        // Timeout ainda mais agressivo com tipo correto
        const resultado = await Promise.race([
          sender.enviarMensagem(contato, conteudoParaEnvio as ConteudoMensagem),
          new Promise<ResultadoEnvio>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout express')), 3000)
          )
        ]) as ResultadoEnvio;

        contato.tempoResposta = Date.now() - inicioEnvio;
        
        if (resultado.sucesso) {
          contato.status = 'sucesso';
          contato.codigoResposta = resultado.codigoResposta ? parseInt(resultado.codigoResposta, 10) : undefined;
        } else {
          contato.status = 'erro';
          contato.tentativas++;
          contato.mensagemErro = resultado.erro;
        }

        console.log(`⚡ [${campanhaId}] Express ${i + 1}/${contatos.length}: ${contato.status}`);

      } catch (error) {
        contato.status = 'erro';
        contato.tentativas++;
        contato.mensagemErro = error instanceof Error ? error.message : 'Erro express';
        contato.tempoResposta = Date.now() - inicioEnvio;
        console.error(`❌ [${campanhaId}] Express erro ${i + 1}:`, error);
      }

      contato.ultimaTentativa = Date.now();
      
      // SEM delays no modo express
    }

    // Atualizar logs
    await atualizarLogsCampanha(campanhaRef, contatos);
    
    // Determinar status final
    const campanhaAtual = await campanhaRef.get();
    const campanhaData = campanhaAtual.data() as Campanha;
    const pendentes = campanhaData.logs.filter(log => 
      log.status === 'pendente' || (log.status === 'erro' && log.tentativas < CONFIG_ENVIO.MAX_TENTATIVAS_CONTATO)
    );
    
    const statusFinal = pendentes.length === 0 ? 'concluida' : 'pausada';
    
    await campanhaRef.update({
      status: statusFinal as StatusCampanha,
      ultimaAtualizacao: Date.now(),
      ...(statusFinal === 'concluida' ? { dataConclusao: Date.now() } : {})
    });
    
    console.log(`⚡ [${campanhaId}] Modo express finalizado: ${statusFinal}`);
    
    limparControleCampanha(campanhaId, cliente, idInstancia);
    
  } catch (error) {
    console.error(`💥 [${campanhaId}] Erro no modo express:`, error);
    
    await campanhaRef.update({
      status: 'pausada' as StatusCampanha,
      ultimaAtualizacao: Date.now()
    });
    
    limparControleCampanha(campanhaId, cliente, idInstancia);
  }
}

// FUNÇÃO PRINCIPAL: Processamento completo
async function processarCampanhaCompleta(
  campanha: Campanha,
  contatosPendentes: LogEnvio[],
  tokenInstancia: string,
  clientToken: string,
  campanhaRef: FirebaseDocRef,
  cliente: string,
  idInstancia: string,
  progresso: ProgressoEnvio,
  startTime: number
) {
  const campanhaId = campanha.id!;
  const wsManager = WebSocketManager.getInstance();
  
  console.log(`🔄 [${campanhaId}] PROCESSAMENTO COMPLETO INICIADO`);
  
  registrarCampanhaAtiva(campanhaId, cliente, idInstancia);
  
  try {
    // VERIFICAÇÃO CRÍTICA DE TIMEOUT
    const tempoDecorrido = Date.now() - startTime;
    if (tempoDecorrido > CONFIG_ENVIO.TIMEOUT_TOTAL_FUNCAO * 0.7) {
      console.warn(`⏱️ [${campanhaId}] Tempo limite próximo, mudando para processamento simplificado`);
      return processarCampanhaSimplificada(
        campanha, 
        contatosPendentes.slice(0, 10), 
        tokenInstancia, 
        clientToken, 
        campanhaRef, 
        cliente, 
        idInstancia, 
        progresso
      );
    }

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

    // Buscar campanha atualizada
    const campanhaDoc = await campanhaRef.get();
    const campanhaAtualizada = { id: campanhaDoc.id, ...campanhaDoc.data() } as Campanha;
    
    if (!campanhaAtualizada.conteudo.variacoes || campanhaAtualizada.conteudo.variacoes.length === 0) {
      campanhaAtualizada.conteudo.variacoes = [campanha.conteudo.texto || ''];
    }
    
    const variacoes = campanhaAtualizada.conteudo.variacoes;
    console.log(`[${campanhaId}] Variações disponíveis para envio: ${variacoes.length}`);

    // PASSO 2: Processar envios em lotes simplificados
    progresso.status = 'processando';
    progresso.mensagemStatus = 'Enviando mensagens...';
    progresso.ultimaAtualizacao = Date.now();
    
    emitirProgresso(wsManager, progresso);

    // Processar apenas o primeiro lote em produção para evitar timeout
    const primeiroLote = contatosPendentes.slice(0, CONFIG_ENVIO.TAMANHO_LOTE);
    
    console.log(`[${campanhaId}] Processando primeiro lote: ${primeiroLote.length} contatos`);

    const sender = new MensagemSender({
      tokenInstancia,
      clientToken,
      idInstancia,
      timeout: CONFIG_ENVIO.TIMEOUT_REQUISICAO
    });

    const resultados = await processarLoteSimples(primeiroLote, campanhaAtualizada, sender, progresso, campanhaId);

    // Atualizar logs no banco
    await atualizarLogsCampanha(campanhaRef, resultados.logs);

    console.log(`[${campanhaId}] Primeiro lote concluído: ${resultados.sucessos} sucessos, ${resultados.erros} erros`);

    // PASSO 3: Finalizar ou pausar baseado nos contatos restantes
    await finalizarCampanha(campanhaRef, progresso);

    limparControleCampanha(campanhaId, cliente, idInstancia);

  } catch (error) {
    const tempoTotal = Date.now() - startTime;
    console.error(`[${campanhaId}] Erro no processamento (${tempoTotal}ms):`, error);
    
    progresso.status = 'erro';
    progresso.mensagemStatus = `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    progresso.ultimaAtualizacao = Date.now();

    wsManager.emitirErroCampanha(campanhaId, progresso.mensagemStatus);

    await campanhaRef.update({
      status: 'pausada' as StatusCampanha,
      ultimaAtualizacao: Date.now()
    });
    
    limparControleCampanha(campanhaId, cliente, idInstancia);
  }
}

// FUNÇÕES AUXILIARES
async function buscarTokens(cliente: string, idInstancia: string) {
  const instanciasRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias`);
  const instanciasSnap = await instanciasRef.get();
  
  let tokenInstancia = null;
  instanciasSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.idInstancia === idInstancia) {
      tokenInstancia = data.tokenInstancia;
    }
  });

  const clienteRef = dbAdmin.doc(`/empresas/${cliente}/produtos/zcampanha`);
  const clienteDoc = await clienteRef.get();
  const clientToken = clienteDoc.data()?.['Client-Token'];

  return { tokenInstancia, clientToken };
}

async function atualizarLogsCampanha(campanhaRef: FirebaseDocRef, logs: LogEnvio[]) {
  const campanhaDoc = await campanhaRef.get();
  const campanha = campanhaDoc.data() as Campanha;
  
  const logsAtualizados = campanha.logs.map(logExistente => {
    const logAtualizado = logs.find(l => l.contatoId === logExistente.contatoId);
    return logAtualizado || logExistente;
  });

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
  
  const campanhaDoc = await campanhaRef.get();
  const campanhaAtual = campanhaDoc.data() as Campanha;
  
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

  if (statusFinal === 'concluida') {
    updateData.dataConclusao = agora;
  }

  await campanhaRef.update(updateData);
  
  console.log(`[${progresso.campanhaId}] Campanha finalizada com status: ${statusFinal}`);
}

function calcularEstimativaTermino(totalContatos: number): number {
  const delayMedioMensagem = (CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM + CONFIG_ENVIO.DELAY_MAXIMO_MENSAGEM) / 2;
  const tempoMensagens = totalContatos * delayMedioMensagem;
  const numeroLotes = Math.ceil(totalContatos / CONFIG_ENVIO.TAMANHO_LOTE);
  const tempoLotes = (numeroLotes - 1) * CONFIG_ENVIO.DELAY_ENTRE_LOTES;
  
  return Date.now() + tempoMensagens + tempoLotes + 60000;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      // Se não tem variações mas tem texto original
      if (conteudoOriginal.texto) {
        return {
          conteudo: conteudoOriginal,
          variacaoInfo: {
            indice: 0,
            conteudo: String(conteudoOriginal.texto),
            tipo: 'texto' as const
          }
        };
      }
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
  
  // Para mensagens de imagem
  if (tipoMensagem === 'imagem') {
    // Verificar se tem variações de legenda
    const variacoesLegenda = Array.isArray(conteudoOriginal.variacoesLegenda) 
      ? conteudoOriginal.variacoesLegenda as string[]
      : (conteudoOriginal.legenda ? [String(conteudoOriginal.legenda)] : []);
    
    if (variacoesLegenda.length > 0) {
      const indiceVariacao = obterIndiceVariacaoAleatoria(variacoesLegenda.length, indiceGlobal);
      const legendaVariada = variacoesLegenda[indiceVariacao];

      console.log(`[DEBUG] Imagem - Legenda variação ${indiceVariacao}: "${typeof legendaVariada === 'string' ? legendaVariada.substring(0, 30) : String(legendaVariada).substring(0, 30)}..."`);

      return {
        conteudo: {
          ...conteudoOriginal,
          legenda: legendaVariada,
          // NOVO: Preservar o campo imagem quando há variação de legenda
          imagem: conteudoOriginal.imagem
        },
        variacaoInfo: {
          indice: indiceVariacao,
          conteudo: String(legendaVariada || ''),
          tipo: 'legenda' as const
        }
      };
    }
    
    // Se não tem variações mas tem legenda original
    if (conteudoOriginal.legenda) {
      return {
        conteudo: {
          ...conteudoOriginal,
          // NOVO: Preservar o campo imagem quando não há variação
          imagem: conteudoOriginal.imagem
        },
        variacaoInfo: {
          indice: 0,
          conteudo: String(conteudoOriginal.legenda),
          tipo: 'legenda' as const
        }
      };
    }

    // Se não tem legenda, registrar como imagem sem legenda
    return {
      conteudo: {
        ...conteudoOriginal,
        // NOVO: Preservar o campo imagem mesmo sem legenda
        imagem: conteudoOriginal.imagem
      },
      variacaoInfo: {
        indice: 0,
        conteudo: 'Imagem sem legenda',
        tipo: 'legenda' as const
      }
    };
  }
  
  // Para mensagens com botões
  if (tipoMensagem === 'botoes') {
    if (!Array.isArray(variacoes) || variacoes.length === 0) {
      // Se não tem variações mas tem texto original
      if (conteudoOriginal.texto) {
        return {
          conteudo: conteudoOriginal,
          variacaoInfo: {
            indice: 0,
            conteudo: String(conteudoOriginal.texto),
            tipo: 'texto' as const
          }
        };
      }
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

  // Fallback para tipos não mapeados (não deve acontecer com os 3 tipos suportados)
  console.log(`[DEBUG] Tipo de mensagem não suportado: ${tipoMensagem}`);
  return { 
    conteudo: conteudoOriginal, 
    variacaoInfo: {
      indice: 0,
      conteudo: `Mensagem do tipo: ${tipoMensagem}`,
      tipo: 'texto' as const // Usar 'texto' como fallback
    }
  };
}

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

// Função auxiliar para extrair parâmetros da referência do Firestore
function extrairParametrosDaRef(campanhaRef: FirebaseDocRef): { cliente: string; idInstancia: string } {
  // Exemplo de path: /empresas/cliente/produtos/zcampanha/instancias/idInstancia/campanhas/campanhaId
  const pathParts = campanhaRef.path.split('/');
  const cliente = pathParts[1];
  const idInstancia = pathParts[5];
  
  return { cliente, idInstancia };
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
      console.error('Erro na combinação:', error);
    }
  });

  // Limitar a 8 variações para deixar espaço para as da OpenAI
  return variacoes.slice(0, 8);
}

function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://injectbox.com.br';
  }
  return 'http://localhost:3000';
}
