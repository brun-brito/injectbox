import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente } = req.query;
  if (!cliente || typeof cliente !== 'string') {
    return res.status(400).json({ exists: false });
  }
  try {
    // Verifica se existe o produto zcampanha para o cliente
    const docRef = dbAdmin.doc(`/empresas/${cliente}/produtos/zcampanha`);
    const docSnap = await docRef.get();
    res.status(200).json({ exists: docSnap.exists, doc: docSnap.data() });
  } catch {
    res.status(500).json({ exists: false });
  }
}
