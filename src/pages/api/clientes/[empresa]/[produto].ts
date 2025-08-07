import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { empresa, produto } = req.query;
  if (!empresa || !produto) return res.status(400).json({ erro: 'Parâmetros inválidos' });

  try {
    const clientesSnap = await dbAdmin
      .collection('empresas')
      .doc(String(empresa))
      .collection('produtos')
      .doc(String(produto))
      .collection('clientes')
      .get();

    const clientes = clientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ clientes });
  } catch {
    return res.status(500).json({ erro: 'Erro ao consultar clientes' });
  }
}
