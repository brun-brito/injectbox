import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { ContatoSelecionado } from '../../index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia, id } = req.query;

  if (!cliente || !idInstancia || !id ||
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  try {
    const campanhaRef = dbAdmin
      .collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`)
      .doc(id);

    const contatosCol = campanhaRef.collection('contatos');
    // Buscar todos os contatos vinculados à campanha
    const snap = await contatosCol.get();
    const contatos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContatoSelecionado));
    return res.status(200).json({
      contatos,
      total: contatos.length
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao buscar contatos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
