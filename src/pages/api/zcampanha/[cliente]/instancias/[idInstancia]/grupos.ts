import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';

export type GrupoContatos = {
  id?: string;
  nome: string;
  descricao?: string;
  contatos: string[]; // IDs dos contatos
  cor?: string; // Para visualização
  dataCriacao: number;
  dataAtualizacao: number;
  criadoPor: string;
  totalContatos: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia } = req.query;
  
  if (!cliente || typeof cliente !== 'string' || !idInstancia || typeof idInstancia !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const colPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/grupos`;
  const colRef = dbAdmin.collection(colPath);

  try {
    if (req.method === 'GET') {
      // Listar grupos
      const { incluirContatos = 'false' } = req.query;
      
      const snapshot = await colRef.orderBy('dataCriacao', 'desc').get();
      let grupos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GrupoContatos[];

      // Se solicitado, incluir dados completos dos contatos
      if (incluirContatos === 'true') {
        const contatosRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/clientes`);
        const contatosSnapshot = await contatosRef.get();
        const todosContatos = contatosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        grupos = grupos.map(grupo => ({
          ...grupo,
          contatosDetalhados: grupo.contatos.map(id => 
            todosContatos.find(c => c.id === id)
          ).filter(Boolean)
        }));
      }

      return res.status(200).json({ grupos });
    }

    if (req.method === 'POST') {
      // Criar novo grupo
      const { nome, descricao, contatos, cor }: Partial<GrupoContatos> = req.body;

      if (!nome?.trim()) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }

      if (!contatos || !Array.isArray(contatos) || contatos.length === 0) {
        return res.status(400).json({ error: 'Pelo menos um contato deve ser selecionado' });
      }

      // Verificar se já existe um grupo com o mesmo nome
      const existingSnapshot = await colRef.where('nome', '==', nome.trim()).limit(1).get();
      if (!existingSnapshot.empty) {
        return res.status(400).json({ error: `Um grupo com o nome "${nome.trim()}" já existe` });
      }

      // Validar se todos os contatos existem
      const contatosRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/clientes`);
      const contatosValidos = [];
      
      for (const contatoId of contatos) {
        const contatoDoc = await contatosRef.doc(contatoId).get();
        if (contatoDoc.exists) {
          contatosValidos.push(contatoId);
        }
      }

      if (contatosValidos.length === 0) {
        return res.status(400).json({ error: 'Nenhum contato válido encontrado' });
      }

      const agora = Date.now();
      const novoGrupo: Omit<GrupoContatos, 'id'> = {
        nome: nome.trim(),
        descricao: descricao?.trim() || '',
        contatos: contatosValidos,
        cor: cor || '#3b82f6',
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'usuário',
        totalContatos: contatosValidos.length
      };

      const docRef = await colRef.add(novoGrupo);
      
      return res.status(201).json({
        id: docRef.id,
        ...novoGrupo,
        message: 'Grupo criado com sucesso'
      });
    }

    if (req.method === 'PUT') {
      // Atualizar grupo existente
      const { id, nome, descricao, contatos, cor }: GrupoContatos = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID do grupo é obrigatório' });
      }

      if (!nome?.trim()) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }

      const docRef = colRef.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o novo nome já está em uso por outro grupo
      if (nome?.trim()) {
        const existingSnapshot = await colRef.where('nome', '==', nome.trim()).limit(1).get();
        if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== id) {
          return res.status(400).json({ error: `Um grupo com o nome "${nome.trim()}" já existe` });
        }
      }

      // Validar contatos se fornecidos
      let contatosValidos = contatos;
      if (contatos && Array.isArray(contatos)) {
        const contatosRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/clientes`);
        contatosValidos = [];
        
        for (const contatoId of contatos) {
          const contatoDoc = await contatosRef.doc(contatoId).get();
          if (contatoDoc.exists) {
            contatosValidos.push(contatoId);
          }
        }
      }

      const dadosAtualizacao: Partial<GrupoContatos> = {
        nome: nome.trim(),
        descricao: descricao?.trim() || '',
        dataAtualizacao: Date.now()
      };

      if (cor) dadosAtualizacao.cor = cor;
      if (contatosValidos) {
        dadosAtualizacao.contatos = contatosValidos;
        dadosAtualizacao.totalContatos = contatosValidos.length;
      }

      await docRef.update(dadosAtualizacao);
      
      const grupoAtualizado = await docRef.get();
      
      return res.status(200).json({
        id: grupoAtualizado.id,
        ...grupoAtualizado.data(),
        message: 'Grupo atualizado com sucesso'
      });
    }

    if (req.method === 'DELETE') {
      // Deletar grupo
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID do grupo é obrigatório' });
      }

      const docRef = colRef.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      await docRef.delete();
      
      return res.status(200).json({ 
        message: 'Grupo deletado com sucesso' 
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro no handler de grupos:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
