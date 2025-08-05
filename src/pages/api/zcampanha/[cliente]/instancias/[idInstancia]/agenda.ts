import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia } = req.query;
  if (!cliente || typeof cliente !== 'string' || !idInstancia || typeof idInstancia !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }
  const colPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/clientes`;
  const colRef = dbAdmin.collection(colPath);

  try {
    if (req.method === 'GET') {
      const snap = await colRef.get();
      const contatos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ contatos });
    }
    if (req.method === 'POST') {
      const { nome, numero } = req.body;
      if (!nome || !numero) return res.status(400).json({ error: 'Nome e número obrigatórios' });
      const docRef = await colRef.add({ nome, numero });
      return res.status(201).json({ id: docRef.id, nome, numero });
    }
    if (req.method === 'PUT') {
      const { id, nome, numero } = req.body;
      if (!id || !nome || !numero) return res.status(400).json({ error: 'Dados obrigatórios' });
      await colRef.doc(id).set({ nome, numero }, { merge: true });
      return res.status(200).json({ id, nome, numero });
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      await colRef.doc(id).delete();
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao acessar agenda' });
  }
}
