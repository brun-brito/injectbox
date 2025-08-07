import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { Campanha, StatusCampanha } from '../index';

// Cache global para controle de campanhas ativas - MAIS ROBUSTO
const campanhasAtivas = new Map<string, {
  status: 'enviando' | 'pausada' | 'cancelada';
  controlador: AbortController;
  ultimaAtualizacao: number;
  pausadoEm?: number;
  canceladoEm?: number;
  mensagemStatus?: string;
}>();

// Cache adicional para comunicação entre processos
const statusGlobal = new Map<string, {
  devePausar: boolean;
  deveCancelar: boolean;
  ultimaVerificacao: number;
}>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  const { acao } = req.body; // 'pausar', 'retomar', 'cancelar'
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  if (!['pausar', 'retomar', 'cancelar'].includes(acao)) {
    return res.status(400).json({ error: 'Ação inválida. Use: pausar, retomar ou cancelar' });
  }

  const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
  const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);

  try {
    // Buscar campanha atual
    const doc = await campanhaRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = { id: doc.id, ...doc.data() } as Campanha;
    
    // Executar ação baseada no tipo
    switch (acao) {
      case 'pausar':
        return await pausarCampanha(campanhaRef, campanha, res);
      
      case 'retomar':
        return await retomarCampanha(campanhaRef, campanha, cliente, idInstancia, res);
      
      case 'cancelar':
        return await cancelarCampanha(campanhaRef, campanha, res);
      
      default:
        return res.status(400).json({ error: 'Ação não implementada' });
    }

  } catch (error) {
    console.error(`Erro ao controlar campanha ${id}:`, error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function pausarCampanha(campanhaRef: FirebaseFirestore.DocumentReference, campanha: Campanha, res: NextApiResponse) {
  if (campanha.status !== 'enviando') {
    return res.status(400).json({ 
      error: `Campanha não pode ser pausada. Status atual: ${campanha.status}` 
    });
  }

  const agora = Date.now();
  const campanhaId = campanha.id!;
  
  // Extract cliente and idInstancia from campanhaRef path
  const { cliente, idInstancia } = extrairParametrosDaRef(campanhaRef);
  
  console.log(`[${campanhaId}] === PAUSANDO CAMPANHA ===`);
  
  // MÉTODO 1: Marcar no cache de controle
  const controleAtivo = campanhasAtivas.get(campanhaId);
  if (controleAtivo) {
    controleAtivo.status = 'pausada';
    controleAtivo.ultimaAtualizacao = agora;
    controleAtivo.pausadoEm = agora;
    controleAtivo.mensagemStatus = 'Pausada pelo usuário';
    console.log(`[${campanhaId}] Cache de controle atualizado para PAUSADA`);
  } else {
    // Criar entrada no cache se não existir
    campanhasAtivas.set(campanhaId, {
      status: 'pausada',
      controlador: new AbortController(),
      ultimaAtualizacao: agora,
      pausadoEm: agora,
      mensagemStatus: 'Pausada pelo usuário'
    });
    console.log(`[${campanhaId}] Nova entrada criada no cache para PAUSADA`);
  }

  // MÉTODO 2: Marcar no cache de status global
  statusGlobal.set(campanhaId, {
    devePausar: true,
    deveCancelar: false,
    ultimaVerificacao: agora
  });
  console.log(`[${campanhaId}] Status global marcado para PAUSAR`);

  // MÉTODO 3: Atualizar status no banco de dados
  await campanhaRef.update({
    status: 'pausada' as StatusCampanha,
    ultimaAtualizacao: agora,
    pausadaEm: agora
  });
  console.log(`[${campanhaId}] Status no banco atualizado para PAUSADA`);

  // MÉTODO 4: Criar arquivo de sinalização no banco
  await dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).set({
    acao: 'pausar',
    timestamp: agora,
    status: 'pausada'
  });
  console.log(`[${campanhaId}] Arquivo de sinalização criado`);

  console.log(`[${campanhaId}] === PAUSE COMPLETO ===`);

  return res.status(200).json({
    message: 'Campanha pausada com sucesso',
    status: 'pausada',
    pausadaEm: agora,
    metodos: ['cache-controle', 'status-global', 'banco-dados', 'sinalizacao']
  });
}

async function retomarCampanha(
  campanhaRef: FirebaseFirestore.DocumentReference, 
  campanha: Campanha, 
  cliente: string, 
  idInstancia: string, 
  res: NextApiResponse
) {
  if (campanha.status !== 'pausada') {
    return res.status(400).json({ 
      error: `Campanha não pode ser retomada. Status atual: ${campanha.status}` 
    });
  }

  // Verificar se há contatos pendentes
  const contatosPendentes = campanha.logs.filter(log => 
    log.status === 'pendente' || (log.status === 'erro' && log.tentativas < 3)
  );

  if (contatosPendentes.length === 0) {
    return res.status(400).json({ 
      error: 'Não há contatos pendentes para retomar o envio' 
    });
  }

  const agora = Date.now();
  const campanhaId = campanha.id!;

  console.log(`[${campanhaId}] === RETOMANDO CAMPANHA ===`);
  console.log(`[${campanhaId}] Status atual: ${campanha.status}`);
  console.log(`[${campanhaId}] Contatos pendentes: ${contatosPendentes.length}`);

  // CORREÇÃO: Limpar controles de pausa ANTES de qualquer atualização
  campanhasAtivas.delete(campanhaId);
  statusGlobal.delete(campanhaId);
  
  // Remover arquivo de sinalização
  try {
    await dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).delete();
    console.log(`[${campanhaId}] Arquivo de sinalização removido`);
  } catch (error) {
    console.log(`[${campanhaId}] Arquivo de sinalização não existia`);
    console.error(error);
  }

  // CORREÇÃO: NÃO atualizar status aqui - deixar o iniciar-envio fazer isso
  console.log(`[${campanhaId}] Controles de pausa limpos, preparando para retomar...`);

  // Chamar a API de iniciar-envio para retomar o processo
  try {
    const url = `${getBaseUrl()}/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas/${campanhaId}/iniciar-envio`;
    console.log(`[${campanhaId}] Chamando: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[${campanhaId}] Resposta da API iniciar-envio: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[${campanhaId}] === RETOMADA COMPLETA ===`);
      console.log(`[${campanhaId}] Dados retornados:`, {
        message: data.message,
        totalContatos: data.totalContatos,
        totalLotes: data.totalLotes
      });
      
      return res.status(200).json({
        message: 'Campanha retomada com sucesso',
        status: 'enviando',
        retomadaEm: agora,
        contatosPendentes: contatosPendentes.length
      });
    } else {
      // CORREÇÃO: Capturar detalhes do erro 400
      const errorData = await response.json();
      console.error(`[${campanhaId}] Erro HTTP ${response.status}:`, errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

  } catch (error) {
    // CORREÇÃO: Como não alteramos o status, não precisamos reverter
    
    // Mas precisamos recriar os controles de pausa se houve erro
    statusGlobal.set(campanhaId, {
      devePausar: true,
      deveCancelar: false,
      ultimaVerificacao: agora
    });

    await dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).set({
      acao: 'pausar',
      timestamp: agora,
      status: 'pausada'
    });

    console.error(`[${campanhaId}] Erro ao retomar campanha, controles de pausa restaurados:`, error);
    
    return res.status(500).json({
      error: 'Erro ao retomar campanha',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      originalError: error instanceof Error ? error.stack : undefined
    });
  }
}

async function cancelarCampanha(campanhaRef: FirebaseFirestore.DocumentReference, campanha: Campanha, res: NextApiResponse) {
  if (!['enviando', 'pausada'].includes(campanha.status)) {
    return res.status(400).json({ 
      error: `Campanha não pode ser cancelada. Status atual: ${campanha.status}` 
    });
  }

  const agora = Date.now();
  const campanhaId = campanha.id!;
  
  // Extract cliente and idInstancia from campanhaRef path
  const { cliente, idInstancia } = extrairParametrosDaRef(campanhaRef);
  
  console.log(`[${campanhaId}] === CANCELANDO CAMPANHA ===`);
  
  // Marcar como cancelada no cache global
  const controleAtivo = campanhasAtivas.get(campanhaId);
  if (controleAtivo) {
    controleAtivo.status = 'cancelada';
    controleAtivo.ultimaAtualizacao = agora;
    controleAtivo.canceladoEm = agora;
    
    // Abortar qualquer operação ativa
    try {
      controleAtivo.controlador.abort();
    } catch (error) {
      console.error(error);
    }
  } else {
    // Criar entrada no cache se não existir
    campanhasAtivas.set(campanhaId, {
      status: 'cancelada',
      controlador: new AbortController(),
      ultimaAtualizacao: agora,
      canceladoEm: agora
    });
  }

  // Marcar no status global
  statusGlobal.set(campanhaId, {
    devePausar: false,
    deveCancelar: true,
    ultimaVerificacao: agora
  });

  // Atualizar status no banco
  await campanhaRef.update({
    status: 'cancelada' as StatusCampanha,
    dataConclusao: agora,
    ultimaAtualizacao: agora
  });

  // Criar arquivo de sinalização para cancelamento
  await dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).set({
    acao: 'cancelar',
    timestamp: agora,
    status: 'cancelada'
  });

  // Remover do cache após um tempo para limpeza
  setTimeout(() => {
    campanhasAtivas.delete(campanhaId);
    statusGlobal.delete(campanhaId);
    dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).delete().catch(() => {});
  }, 60000); // 1 minuto

  console.log(`[${campanhaId}] === CANCELAMENTO COMPLETO ===`);

  return res.status(200).json({
    message: 'Campanha cancelada permanentemente',
    status: 'cancelada',
    canceladaEm: agora
  });
}

// === FUNÇÕES DE VERIFICAÇÃO MELHORADAS ===

// Função auxiliar para verificar se uma campanha deve parar - VERSÃO MELHORADA
export async function devePararCampanha(campanhaId: string, cliente: string, idInstancia: string): Promise<boolean> {
  const agora = Date.now();
  
  console.log(`[${campanhaId}] ⚡ VERIFICANDO SE DEVE PARAR...`);
  
  // MÉTODO 1: Verificar cache local
  const controle = campanhasAtivas.get(campanhaId);
  if (controle && ['pausada', 'cancelada'].includes(controle.status)) {
    console.log(`[${campanhaId}] ⚡ CACHE LOCAL: ${controle.status.toUpperCase()}`);
    return true;
  }
  
  // MÉTODO 2: Verificar status global
  const statusGlobal_ = statusGlobal.get(campanhaId);
  if (statusGlobal_ && (statusGlobal_.devePausar || statusGlobal_.deveCancelar)) {
    statusGlobal_.ultimaVerificacao = agora;
    console.log(`[${campanhaId}] ⚡ STATUS GLOBAL: DEVE ${statusGlobal_.devePausar ? 'PAUSAR' : 'CANCELAR'}`);
    return true;
  }
  
  // MÉTODO 3: Verificar arquivo de sinalização no banco (mais lento, usar com moderação)
  try {
    const doc = await dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).get();
    if (doc.exists) {
      const data = doc.data();
      if (data && ['pausar', 'cancelar'].includes(data.acao)) {
        console.log(`[${campanhaId}] ⚡ SINALIZAÇÃO BANCO: ${data.acao.toUpperCase()}`);
        return true;
      }
    }
  } catch (error) {
    console.error(`[${campanhaId}] Erro ao verificar sinalização:`, error);
  }
  
  // MÉTODO 4: Verificar status no banco da campanha (backup)
  try {
    const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
    const campanhaDoc = await dbAdmin.collection(campanhaPath).doc(campanhaId).get();
    
    if (campanhaDoc.exists) {
      const status = campanhaDoc.data()?.status;
      if (['pausada', 'cancelada'].includes(status)) {
        console.log(`[${campanhaId}] ⚡ BANCO CAMPANHA: ${status.toUpperCase()}`);
        return true;
      }
    }
  } catch (error) {
    console.error(`[${campanhaId}] Erro ao verificar status da campanha:`, error);
  }
  
  console.log(`[${campanhaId}] ⚡ VERIFICAÇÃO: CONTINUAR`);
  return false;
}

// Função auxiliar para verificar o status de controle
export function getStatusControle(campanhaId: string): 'enviando' | 'pausada' | 'cancelada' | null {
  // Verificar cache local primeiro
  const controle = campanhasAtivas.get(campanhaId);
  if (controle) {
    return controle.status;
  }
  
  // Verificar status global
  const status = statusGlobal.get(campanhaId);
  if (status) {
    if (status.deveCancelar) return 'cancelada';
    if (status.devePausar) return 'pausada';
  }
  
  return null;
}

// Função auxiliar para registrar campanha ativa
export function registrarCampanhaAtiva(campanhaId: string, cliente: string, idInstancia: string) {
  console.log(`[${campanhaId}] 📝 REGISTRANDO CAMPANHA ATIVA`);
  
  campanhasAtivas.set(campanhaId, {
    status: 'enviando',
    controlador: new AbortController(),
    ultimaAtualizacao: Date.now(),
    mensagemStatus: 'Enviando mensagens'
  });
  
  // Limpar qualquer status de pausa/cancelamento anterior
  statusGlobal.delete(campanhaId);
  
  // Remover arquivo de sinalização se existir
  dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).delete().catch(() => {});
}

// Função auxiliar para limpar controle da campanha
export function limparControleCampanha(campanhaId: string, cliente: string, idInstancia: string) {
  console.log(`[${campanhaId}] 🧹 LIMPANDO CONTROLE DA CAMPANHA`);
  
  campanhasAtivas.delete(campanhaId);
  statusGlobal.delete(campanhaId);
  
  // Remover arquivo de sinalização
  dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas-controle`).doc(campanhaId).delete().catch(() => {});
}

// Função auxiliar para obter a URL base
function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';
  }
  return 'http://localhost:3000';
}

// Função auxiliar para extrair parâmetros da referência do Firestore
function extrairParametrosDaRef(campanhaRef: FirebaseFirestore.DocumentReference): { cliente: string; idInstancia: string } {
  // Exemplo de path: /empresas/cliente/produtos/zcampanha/instancias/idInstancia/campanhas/campanhaId
  const pathParts = campanhaRef.path.split('/');
  const cliente = pathParts[1];
  const idInstancia = pathParts[5];
  
  return { cliente, idInstancia };
}
