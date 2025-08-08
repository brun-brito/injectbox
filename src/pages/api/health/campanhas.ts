import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

// Definir tipos para o health check
interface CampanhaAtiva {
  id: string;
  empresa: string;
  instancia: string;
  status: string;
  dataInicio?: number;
  ultimaAtualizacao?: number;
  estatisticas: {
    totalContatos?: number;
    pendentes?: number;
    enviados?: number;
    sucessos?: number;
    erros?: number;
    percentualSucesso?: number;
  };
  logs: number;
}

interface HealthResponse {
  status: 'healthy' | 'error';
  campanhasAtivas: number;
  campanhas: CampanhaAtiva[];
  tempoResposta: number;
  timestamp: number;
  ambiente?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      status: 'error',
      error: 'Método não permitido',
      campanhasAtivas: 0,
      campanhas: [],
      tempoResposta: 0,
      timestamp: Date.now()
    });
  }

  const startTime = Date.now();

  try {
    // Buscar campanhas em execução
    const empresasRef = dbAdmin.collection('empresas');
    const empresasSnap = await empresasRef.get();
    
    const campanhasAtivas: CampanhaAtiva[] = [];
    
    for (const empresaDoc of empresasSnap.docs) {
      const empresaId = empresaDoc.id;
      
      try {
        const zcampanhaRef = empresaDoc.ref.collection('produtos').doc('zcampanha');
        const instanciasRef = zcampanhaRef.collection('instancias');
        const instanciasSnap = await instanciasRef.get();
        
        for (const instanciaDoc of instanciasSnap.docs) {
          const instanciaId = instanciaDoc.id;
          
          const campanhasRef = instanciaDoc.ref.collection('campanhas');
          const campanhasSnap = await campanhasRef.where('status', 'in', ['enviando', 'pausada']).get();
          
          campanhasSnap.docs.forEach(campanhaDoc => {
            const campanha = campanhaDoc.data();
            
            const campanhaAtiva: CampanhaAtiva = {
              id: campanhaDoc.id,
              empresa: empresaId,
              instancia: instanciaId,
              status: campanha.status || 'desconhecido',
              dataInicio: campanha.dataInicio,
              ultimaAtualizacao: campanha.ultimaAtualizacao,
              estatisticas: {
                totalContatos: campanha.estatisticas?.totalContatos || 0,
                pendentes: campanha.estatisticas?.pendentes || 0,
                enviados: campanha.estatisticas?.enviados || 0,
                sucessos: campanha.estatisticas?.sucessos || 0,
                erros: campanha.estatisticas?.erros || 0,
                percentualSucesso: campanha.estatisticas?.percentualSucesso || 0
              },
              logs: Array.isArray(campanha.logs) ? campanha.logs.length : 0
            };
            
            campanhasAtivas.push(campanhaAtiva);
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar campanhas da empresa ${empresaId}:`, error);
      }
    }

    const tempoResposta = Date.now() - startTime;

    return res.status(200).json({
      status: 'healthy',
      campanhasAtivas: campanhasAtivas.length,
      campanhas: campanhasAtivas,
      tempoResposta,
      timestamp: Date.now(),
      ambiente: process.env.NODE_ENV
    });

  } catch (error) {
    const tempoResposta = Date.now() - startTime;
    console.error('Erro no health check:', error);
    
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      campanhasAtivas: 0,
      campanhas: [],
      tempoResposta,
      timestamp: Date.now()
    });
  }
}
