import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { Campanha } from '../index';
import { calcularTempoEstimadoTotal, formatarTempoEstimado } from '@/utils/calculaTempoEstimado';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const startTime = Date.now();

  try {
    const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
    const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);
    
    console.log(`📊 [STATUS] Buscando campanha ${id}...`);
    
    const doc = await campanhaRef.get();
    if (!doc.exists) {
      console.warn(`⚠️ [STATUS] Campanha ${id} não encontrada`);
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = { id: doc.id, ...doc.data() } as Campanha;
    
    // Calcular estatísticas em tempo real
    const logsSnap = await campanhaRef.collection('logs').get();
    const logs = logsSnap.docs.map(doc => doc.data());

    const estatisticas = {
      totalContatos: logs.length,
      pendentes: logs.filter(log => log.status === 'pendente').length,
      enviados: logs.filter(log => log.status !== 'pendente').length,
      sucessos: logs.filter(log => log.status === 'sucesso').length,
      erros: logs.filter(log => log.status === 'erro').length,
      percentualSucesso: 0
    };

    if (estatisticas.enviados > 0) {
      estatisticas.percentualSucesso = (estatisticas.sucessos / estatisticas.enviados) * 100;
    }

    // Sempre retornar o tempoEstimado do banco, se existir
    let tempoEstimado: string | undefined = campanha.tempoEstimado;
    if (!tempoEstimado && ['enviando', 'pausada'].includes(campanha.status)) {
      const ms = calcularTempoEstimadoTotal(estatisticas.pendentes);
      tempoEstimado = formatarTempoEstimado(ms);
    }

    const tempoResposta = Date.now() - startTime;
    
    const status = {
      id: campanha.id,
      status: campanha.status,
      estatisticas,
      dataInicio: campanha.dataInicio,
      dataConclusao: campanha.dataConclusao,
      ultimaAtualizacao: campanha.ultimaAtualizacao || Date.now(),
      tempoResposta,
      ambiente: process.env.NODE_ENV,
      tempoEstimado
    };

    console.log(`✅ [STATUS] Campanha ${id}: ${campanha.status} (${tempoResposta}ms)`);

    return res.status(200).json({ status });

  } catch (error) {
    const tempoResposta = Date.now() - startTime;
    console.error(`💥 [STATUS] Erro ao buscar status (${tempoResposta}ms):`, error);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      tempoResposta
    });
  }
}
