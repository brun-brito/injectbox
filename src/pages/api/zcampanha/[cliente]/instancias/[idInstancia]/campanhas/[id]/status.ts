import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { Campanha } from '../index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  try {
    const campanhaPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
    const campanhaRef = dbAdmin.collection(campanhaPath).doc(id);
    
    const doc = await campanhaRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = { id: doc.id, ...doc.data() } as Campanha;
    
    // Retornar apenas dados relevantes para o status
    const status = {
      id: campanha.id,
      status: campanha.status,
      estatisticas: campanha.estatisticas,
      dataInicio: campanha.dataInicio,
      dataConclusao: campanha.dataConclusao,
      ultimaAtualizacao: Date.now()
    };

    return res.status(200).json({ status });

  } catch (error) {
    console.error('Erro ao buscar status da campanha:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
