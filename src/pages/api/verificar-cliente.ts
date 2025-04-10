import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' })

  const { empresa, produto, cliente } = req.query

  if (!empresa || !produto || !cliente) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: empresa, produto e cliente' })
  }

  try {
    const ref = doc(db, 'empresas', String(empresa), 'produtos', String(produto), 'clientes', String(cliente))
    const snapshot = await getDoc(ref)

    if (snapshot.exists()) {
      return res.status(200).json({ existe: true })
    } else {
      return res.status(200).json({ existe: false })
    }
  } catch (erro) {
    console.error('Erro ao verificar cliente:', erro)
    return res.status(500).json({ erro: 'Erro interno no servidor' })
  }
}