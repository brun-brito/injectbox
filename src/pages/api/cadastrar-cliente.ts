import type { NextApiRequest, NextApiResponse } from 'next'
import { dbAdmin } from '@/lib/firebaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { empresa, produto, nome, email, telefone, cpf, conselho, especialidade, uf } = req.body

  if (
    !empresa || !produto || !nome || !email || !telefone ||
    !cpf || !conselho || !especialidade || !uf
  ) {
    return res.status(400).json({ erro: 'Campos obrigatórios não informados' })
  }

  const telefoneFormatado = "55" + String(telefone).replace(/\D/g, '')

  const clienteData = {
    nome: String(nome),
    email: String(email),
    telefone: telefoneFormatado,
    cpf: String(cpf),
    conselho: String(conselho),
    especialidade: String(especialidade),
    uf: String(uf),
    criado_em: new Date(),
    adimplente: true
  };

  try {
    const ref = await dbAdmin
      .collection('empresas')
      .doc(empresa)
      .collection('produtos')
      .doc(produto)
      .collection('clientes')
      .add(clienteData);

    return res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso', id: ref.id })
  } catch (erro) {
    console.error('Erro ao salvar cliente:', erro)
    return res.status(500).json({ erro: 'Erro interno no servidor' })
  }
}