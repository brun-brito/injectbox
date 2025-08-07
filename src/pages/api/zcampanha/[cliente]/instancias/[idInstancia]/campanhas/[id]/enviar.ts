import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { Campanha, LogEnvio, StatusCampanha } from '../index';
import MensagemSender from '@/utils/mensagemSender';
import { FirebaseDocRef } from '@/types/firebase';

// Configurações do sistema de envio
const CONFIG_ENVIO = {
  TAMANHO_LOTE: 20, // Quantas mensagens por lote
  DELAY_ENTRE_LOTES: 45000, // 45 segundos entre lotes
  DELAY_MINIMO_MENSAGEM: 2000, // 2 segundos mínimo entre mensagens
  DELAY_MAXIMO_MENSAGEM: 5000, // 5 segundos máximo entre mensagens
  MAX_TENTATIVAS_CONTATO: 3,
  TIMEOUT_REQUISICAO: 10000, // 10 segundos timeout por requisição
};

type StatusEnvio = {
  campanhaId: string;
  status: 'iniciando' | 'processando' | 'pausada' | 'concluida' | 'erro';
  loteAtual: number;
  totalLotes: number;
  contatosProcessados: number;
  totalContatos: number;
  sucessos: number;
  erros: number;
  iniciadoEm: number;
  ultimaAtualizacao: number;
  estimativaTermino?: number;
};

// Cache em memória para controle de envios ativos (em produção, use Redis)
const enviosAtivos = new Map<string, StatusEnvio>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia, id } = req.query;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
  const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);

  try {
    if (req.method === 'POST') {
      // Iniciar envio da campanha
      return await iniciarEnvioCampanha(campanhaRef, cliente, idInstancia, id, res);
    }
    
    if (req.method === 'PUT') {
      // Pausar/Retomar campanha
      const { acao } = req.body; // 'pausar' ou 'retomar'
      return await controlarEnvioCampanha(campanhaRef, id, acao, res);
    }
    
    if (req.method === 'GET') {
      // Obter status do envio
      return await obterStatusEnvio(id, res);
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro no handler de envio:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function iniciarEnvioCampanha(
  campanhaRef: FirebaseDocRef,
  cliente: string,
  idInstancia: string,
  campanhaId: string,
  res: NextApiResponse
) {
  const doc = await campanhaRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Campanha não encontrada' });
  }

  const campanha = { id: doc.id, ...doc.data() } as Campanha;
  
  // Verificar se a campanha pode ser enviada
  if (!['rascunho', 'pausada'].includes(campanha.status)) {
    return res.status(400).json({ 
      error: `Campanha não pode ser enviada. Status atual: ${campanha.status}` 
    });
  }

  // Verificar se já existe um envio ativo
  if (enviosAtivos.has(campanhaId)) {
    return res.status(409).json({ 
      error: 'Campanha já está sendo enviada' 
    });
  }

  // Buscar tokens necessários
  const { tokenInstancia, clientToken } = await buscarTokens(cliente, idInstancia);
  if (!tokenInstancia || !clientToken) {
    return res.status(400).json({ 
      error: 'Tokens de instância não encontrados' 
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

  // Calcular lotes
  const totalLotes = Math.ceil(contatosPendentes.length / CONFIG_ENVIO.TAMANHO_LOTE);
  const agora = Date.now();

  // Criar status de envio
  const statusEnvio: StatusEnvio = {
    campanhaId,
    status: 'iniciando',
    loteAtual: 0,
    totalLotes,
    contatosProcessados: 0,
    totalContatos: contatosPendentes.length,
    sucessos: 0,
    erros: 0,
    iniciadoEm: agora,
    ultimaAtualizacao: agora,
    estimativaTermino: calcularEstimativaTermino(contatosPendentes.length, campanha.configuracoes.delayEntreEnvios)
  };

  enviosAtivos.set(campanhaId, statusEnvio);

  // Atualizar status da campanha no banco
  await campanhaRef.update({
    status: 'enviando',
    dataInicio: agora
  });

  // Iniciar processo de envio assíncrono
  processarEnvioCampanha(campanha, contatosPendentes, tokenInstancia, clientToken, campanhaRef, idInstancia)
    .catch(error => {
      console.error(`Erro no envio da campanha ${campanhaId}:`, error);
      enviosAtivos.delete(campanhaId);
    });

  return res.status(200).json({
    message: 'Envio da campanha iniciado',
    status: statusEnvio
  });
}

async function processarEnvioCampanha(
  campanha: Campanha,
  contatosPendentes: LogEnvio[],
  tokenInstancia: string,
  clientToken: string,
  campanhaRef: FirebaseDocRef,
  idInstancia: string
) {
  const campanhaId = campanha.id!;
  const statusEnvio = enviosAtivos.get(campanhaId)!;
  
  try {
    // Dividir em lotes
    const lotes = dividirEmLotes(contatosPendentes, CONFIG_ENVIO.TAMANHO_LOTE);
    
    statusEnvio.status = 'processando';
    statusEnvio.totalLotes = lotes.length;

    for (let i = 0; i < lotes.length; i++) {
      // Verificar se foi pausado
      const statusAtual = enviosAtivos.get(campanhaId);
      if (!statusAtual || statusAtual.status === 'pausada') {
        console.log(`Campanha ${campanhaId} pausada no lote ${i + 1}`);
        break;
      }

      statusEnvio.loteAtual = i + 1;
      statusEnvio.ultimaAtualizacao = Date.now();

      console.log(`Processando lote ${i + 1}/${lotes.length} da campanha ${campanhaId}`);

      // Processar lote atual
      const resultadosLote = await processarLote(
        lotes[i], 
        campanha, 
        tokenInstancia, 
        clientToken,
        idInstancia
      );

      // Atualizar estatísticas
      statusEnvio.contatosProcessados += lotes[i].length;
      statusEnvio.sucessos += resultadosLote.sucessos;
      statusEnvio.erros += resultadosLote.erros;

      // Atualizar logs no banco
      await atualizarLogsCampanha(campanhaRef, resultadosLote.logs);

      // Delay entre lotes (exceto no último)
      if (i < lotes.length - 1) {
        console.log(`Aguardando ${CONFIG_ENVIO.DELAY_ENTRE_LOTES / 1000}s antes do próximo lote...`);
        await delay(CONFIG_ENVIO.DELAY_ENTRE_LOTES);
      }
    }

    // Finalizar campanha
    await finalizarCampanha(campanhaId, campanhaRef, statusEnvio);

  } catch (error) {
    console.error(`Erro no processamento da campanha ${campanhaId}:`, error);
    statusEnvio.status = 'erro';
    
    await campanhaRef.update({
      status: 'cancelada' as StatusCampanha,
      dataConclusao: Date.now()
    });
    
    enviosAtivos.delete(campanhaId);
  }
}

async function processarLote(
  lote: LogEnvio[],
  campanha: Campanha,
  tokenInstancia: string,
  clientToken: string,
  idInstancia: string
) {
  const resultados = {
    sucessos: 0,
    erros: 0,
    logs: [] as LogEnvio[]
  };

  // Criar instância do MensagemSender
  const sender = new MensagemSender({
    tokenInstancia,
    clientToken,
    idInstancia,
    timeout: CONFIG_ENVIO.TIMEOUT_REQUISICAO
  });

  for (const contato of lote) {
    const inicioEnvio = Date.now();
    
    try {
      // Atualizar status para enviando
      contato.status = 'enviando';
      contato.timestampEnvio = inicioEnvio;
      
      // Enviar mensagem usando a nova classe
      const resultado = await sender.enviarMensagem(contato, campanha.conteudo);

      const fimEnvio = Date.now();
      contato.tempoResposta = fimEnvio - inicioEnvio;
      contato.codigoResposta = resultado.codigoResposta;

      if (resultado.sucesso) {
        contato.status = 'sucesso';
        resultados.sucessos++;
      } else {
        contato.status = 'erro';
        contato.tentativas++;
        contato.mensagemErro = resultado.erro;
        resultados.erros++;
      }

    } catch (error) {
      contato.status = 'erro';
      contato.tentativas++;
      contato.mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      contato.tempoResposta = Date.now() - inicioEnvio;
      resultados.erros++;
    }

    contato.ultimaTentativa = Date.now();
    resultados.logs.push({ ...contato });

    // Delay entre mensagens (com variação aleatória)
    const delayAleatorio = gerarDelayAleatorio(
      campanha.configuracoes.delayEntreEnvios * 1000
    );
    await delay(delayAleatorio);
  }

  return resultados;
}

// Remove the old enviarMensagem function since it's now handled by MensagemSender

// Remove the old processarVariaveis function since it's now in MensagemSender

// Funções auxiliares
function dividirEmLotes<T>(array: T[], tamanhoLote: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < array.length; i += tamanhoLote) {
    lotes.push(array.slice(i, i + tamanhoLote));
  }
  return lotes;
}

function gerarDelayAleatorio(delayBase: number): number {
  const variacao = delayBase * 0.3; // 30% de variação
  return Math.max(
    CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM,
    Math.min(
      CONFIG_ENVIO.DELAY_MAXIMO_MENSAGEM,
      delayBase + (Math.random() - 0.5) * variacao
    )
  );
}

function calcularEstimativaTermino(totalContatos: number, delaySegundos: number): number {
  const delayMedio = delaySegundos * 1000;
  const tempoEstimado = totalContatos * delayMedio + 
                       Math.ceil(totalContatos / CONFIG_ENVIO.TAMANHO_LOTE) * CONFIG_ENVIO.DELAY_ENTRE_LOTES;
  return Date.now() + tempoEstimado;
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

async function finalizarCampanha(campanhaId: string, campanhaRef: FirebaseDocRef, statusEnvio: StatusEnvio) {
  const agora = Date.now();
  
  statusEnvio.status = 'concluida';
  statusEnvio.ultimaAtualizacao = agora;

  await campanhaRef.update({
    status: 'concluida' as StatusCampanha,
    dataConclusao: agora
  });

  // Remover do cache após 5 minutos para permitir consulta do status
  setTimeout(() => {
    enviosAtivos.delete(campanhaId);
  }, 5 * 60 * 1000);

  console.log(`Campanha ${campanhaId} finalizada. Sucessos: ${statusEnvio.sucessos}, Erros: ${statusEnvio.erros}`);
}

async function controlarEnvioCampanha(campanhaRef: FirebaseDocRef, campanhaId: string, acao: string, res: NextApiResponse) {
  const statusEnvio = enviosAtivos.get(campanhaId);
  
  if (!statusEnvio) {
    return res.status(404).json({ error: 'Envio não encontrado' });
  }

  if (acao === 'pausar') {
    statusEnvio.status = 'pausada';
    await campanhaRef.update({ status: 'pausada' as StatusCampanha });
    
    return res.status(200).json({ 
      message: 'Campanha pausada',
      status: statusEnvio
    });
  }

  if (acao === 'retomar') {
    statusEnvio.status = 'processando';
    await campanhaRef.update({ status: 'enviando' as StatusCampanha });
    
    return res.status(200).json({ 
      message: 'Campanha retomada',
      status: statusEnvio
    });
  }

  return res.status(400).json({ error: 'Ação inválida' });
}

async function obterStatusEnvio(campanhaId: string, res: NextApiResponse) {
  const statusEnvio = enviosAtivos.get(campanhaId);
  
  if (!statusEnvio) {
    return res.status(404).json({ error: 'Envio não encontrado' });
  }

  return res.status(200).json({ status: statusEnvio });
}
