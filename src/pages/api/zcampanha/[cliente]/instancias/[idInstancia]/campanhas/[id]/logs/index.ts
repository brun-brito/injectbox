import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { LogEnvio } from '../../index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia, id } = req.query;
  const { limit = 100, page = 1, status } = req.query;

  if (!cliente || !idInstancia || !id ||
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  try {
    const campanhaRef = dbAdmin
      .collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`)
      .doc(id);

    const logsCol = campanhaRef.collection('logs');
    const limitNum = Math.max(1, Math.min(Number(limit), 500));
    const pageNum = Math.max(1, Number(page));
    const offset = (pageNum - 1) * limitNum;

    let query = logsCol as FirebaseFirestore.Query;
    if (status && typeof status === 'string') {
      query = query.where('status', '==', status);
    }
    query = query.limit(limitNum);

    if (offset > 0) {
      // Firestore não suporta offset diretamente, então para paginação real use cursor.
      // Aqui, para listas pequenas, podemos buscar todos e paginar em memória.
      const allSnap = status
        ? await logsCol.where('status', '==', status).get()
        : await logsCol.get();
      const allDocs = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const paginated = allDocs.slice(offset, offset + limitNum);
      return res.status(200).json({
        logs: paginated,
        total: allDocs.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(allDocs.length / limitNum)
      });
    } else {
      const snap = await query.get();
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEnvio));
      const totalSnap = status
        ? await logsCol.where('status', '==', status).get()
        : await logsCol.get();
      return res.status(200).json({
        logs,
        total: totalSnap.size,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalSnap.size / limitNum)
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao buscar logs',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
