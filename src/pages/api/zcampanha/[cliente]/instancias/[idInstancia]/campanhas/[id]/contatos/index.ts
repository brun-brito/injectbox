import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { ContatoSelecionado } from '../../index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia, id } = req.query;
  const { limit = 100, page = 1 } = req.query;

  if (!cliente || !idInstancia || !id ||
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  try {
    const campanhaRef = dbAdmin
      .collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`)
      .doc(id);

    const contatosCol = campanhaRef.collection('contatos');
    const limitNum = Math.max(1, Math.min(Number(limit), 500));
    const pageNum = Math.max(1, Number(page));
    const offset = (pageNum - 1) * limitNum;

    const query = contatosCol.limit(limitNum);
    if (offset > 0) {
      // Firestore não suporta offset diretamente, então para paginação real use cursor.
      // Aqui, para listas pequenas, podemos buscar todos e paginar em memória.
      const allSnap = await contatosCol.get();
      const allDocs = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const paginated = allDocs.slice(offset, offset + limitNum);
      return res.status(200).json({
        contatos: paginated,
        total: allDocs.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(allDocs.length / limitNum)
      });
    } else {
      const snap = await query.get();
      const contatos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContatoSelecionado));
      const totalSnap = await contatosCol.get();
      return res.status(200).json({
        contatos,
        total: totalSnap.size,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalSnap.size / limitNum)
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao buscar contatos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
