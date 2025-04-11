import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  const { empresa, produto, nome, email, telefone, cpf, conselho, especialidade, uf } = req.body

  if (!empresa || !produto || !nome || !email || !telefone || !cpf || !conselho || !especialidade || !uf) {
    return res.status(400).json({ erro: 'Campos obrigatórios não informados' })
  }

  const telefoneFormatado = "55" + String(telefone).replace(/\D/g, '')

  try {
    const ref = await addDoc(collection(db, 'empresas', empresa, 'produtos', produto, 'clientes'), {
      nome,
      email,
      telefone: telefoneFormatado,
      cpf,
      conselho,
      especialidade,
      uf,
      criado_em: new Date(),
      adimplente: true
    })

    return res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso', id: ref.id })
  } catch (erro) {
    console.error('Erro ao salvar cliente:', erro)
    return res.status(500).json({ erro: 'Erro interno no servidor' })
  }
}