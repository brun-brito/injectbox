// Novo endpoint simples: contar-clientes.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const { empresa, produto } = req.query;

  if (!empresa || !produto) {
    return res.status(400).json({ error: 'Parâmetros "empresa" e "produto" são obrigatórios.' });
  }

  try {
    const snapshot = await dbAdmin
      .collection(`empresas/${empresa}/produtos/${produto}/clientes`)
      .get();

    return res.status(200).json({ totalClientes: snapshot.size });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    return res.status(500).json({ error: 'Erro ao contar clientes', detalhe: err.message });
  }
}