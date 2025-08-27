import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export type SubgrupoContatos = {
  id?: string;
  nome: string;
  contatos: string[];
  cor?: string;
  dataCriacao: number;
  dataAtualizacao: number;
  totalContatos: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia, grupoId } = req.query;
  if (!cliente || !idInstancia || !grupoId || typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof grupoId !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const subColPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/grupos/${grupoId}/subgrupos`;
  const subColRef = dbAdmin.collection(subColPath);

  try {
    if (req.method === 'GET') {
      // Listar subgrupos
      const snapshot = await subColRef.orderBy('dataCriacao', 'desc').get();
      const subgrupos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubgrupoContatos[];
      return res.status(200).json({ subgrupos });
    }

    if (req.method === 'POST') {
      // Criar subgrupo
      const { nome, contatos, cor }: Partial<SubgrupoContatos> = req.body;
      if (!nome?.trim()) {
        return res.status(400).json({ error: 'Nome do subgrupo é obrigatório' });
      }
      if (!contatos || !Array.isArray(contatos) || contatos.length === 0) {
        return res.status(400).json({ error: 'Pelo menos um contato deve ser selecionado' });
      }

      // Validar se todos os contatos estão no grupo pai
      const grupoDoc = await dbAdmin.doc(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/grupos/${grupoId}`).get();
      if (!grupoDoc.exists) {
        return res.status(404).json({ error: 'Grupo pai não encontrado' });
      }
      const grupoData = grupoDoc.data();
      const contatosGrupoPai = grupoData?.contatos || [];
      const invalids = contatos.filter(cid => !contatosGrupoPai.includes(cid));
      if (invalids.length > 0) {
        return res.status(400).json({ error: 'Subgrupo possui contatos que não pertencem ao grupo pai.' });
      }

      const agora = Date.now();
      const subgrupoData = {
        nome: nome.trim(),
        contatos,
        cor: cor || '#3b82f6',
        dataCriacao: agora,
        dataAtualizacao: agora,
        totalContatos: contatos.length
      };
      const docRef = await subColRef.add(subgrupoData);
      return res.status(201).json({ id: docRef.id, ...subgrupoData });
    }

    if (req.method === 'PUT') {
      // Editar subgrupo
      const { id, nome, contatos, cor }: SubgrupoContatos = req.body;
      if (!id) return res.status(400).json({ error: 'ID do subgrupo é obrigatório' });
      if (!nome?.trim()) return res.status(400).json({ error: 'Nome do subgrupo é obrigatório' });

      const docRef = subColRef.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Subgrupo não encontrado' });
      }
      const subgrupoAtual = doc.data() as SubgrupoContatos;

      // Só validar contatos se mudou
      let contatosValidos = subgrupoAtual.contatos;
      let contatosAlterados = false;
      if (Array.isArray(contatos) && JSON.stringify(contatos) !== JSON.stringify(subgrupoAtual.contatos)) {
        contatosAlterados = true;
        // Validar se todos os contatos estão no grupo pai
        const grupoDoc = await dbAdmin.doc(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/grupos/${grupoId}`).get();
        if (!grupoDoc.exists) {
          return res.status(404).json({ error: 'Grupo pai não encontrado' });
        }
        const grupoData = grupoDoc.data();
        const contatosGrupoPai = grupoData?.contatos || [];
        const invalids = contatos.filter(cid => !contatosGrupoPai.includes(cid));
        if (invalids.length > 0) {
          return res.status(400).json({ error: 'Subgrupo possui contatos que não pertencem ao grupo pai.' });
        }
        contatosValidos = contatos;
      }

      // Monta objeto de atualização apenas com campos alterados
      const dadosAtualizacao: Partial<SubgrupoContatos> = {};
      if (nome.trim() !== subgrupoAtual.nome) dadosAtualizacao.nome = nome.trim();
      if (cor && cor !== subgrupoAtual.cor) dadosAtualizacao.cor = cor;
      if (contatosAlterados) {
        dadosAtualizacao.contatos = contatosValidos;
        dadosAtualizacao.totalContatos = contatosValidos.length;
      }
      dadosAtualizacao.dataAtualizacao = Date.now();

      await docRef.update(dadosAtualizacao);
      const subgrupoAtualizado = await docRef.get();
      return res.status(200).json({ id: subgrupoAtualizado.id, ...subgrupoAtualizado.data() });
    }

    if (req.method === 'DELETE') {
      // Deletar subgrupo
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID do subgrupo é obrigatório' });
      await subColRef.doc(id).delete();
      return res.status(200).json({ message: 'Subgrupo deletado com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro no handler de subgrupos:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
