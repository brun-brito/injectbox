import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente } = req.query;
  if (!cliente || typeof cliente !== 'string') {
    return res.status(400).json({ error: 'Cliente inválido' });
  }
  try {
    const colPath = `/empresas/${cliente}/produtos/zcampanha/instancias`;
    const snap = await dbAdmin.collection(colPath).get();
    const instancias = snap.docs.map(doc => doc.data());
    res.status(200).json({ instancias });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar instâncias' });
  }
}
