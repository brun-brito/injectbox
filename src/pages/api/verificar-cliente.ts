import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Cliente } from '@/types/Cliente'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' })

  const { empresa, produto, telefone } = req.query

  if (!empresa || !produto || !telefone) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: empresa, produto e telefone' })
  }

  const colecaoRef = collection(db, 'empresas', String(empresa), 'produtos', String(produto), 'clientes')
  
  let telefoneLimpo = String(telefone);
  if (telefoneLimpo.startsWith('+')) {
    telefoneLimpo = telefoneLimpo.slice(1); // remove o +
  }
  const telefoneOriginal = telefoneLimpo.replace(/\D/g, '')

  let numeroBase = telefoneOriginal
  if (telefoneOriginal.startsWith('55')) {
    numeroBase = telefoneOriginal.slice(2) // remove o 55
  }

  const alternativas = new Set<string>()

  // base sem o 55
  alternativas.add(numeroBase)

  // base com o 55
  alternativas.add('55' + numeroBase)

  // variações sem o 9 (caso tenha 9 no meio do número)
  if (/^\d{2}9\d{8}$/.test(numeroBase)) {
    const sem9 = numeroBase.replace(/^(\d{2})9(\d{8})$/, '$1$2')
    alternativas.add(sem9)
    alternativas.add('55' + sem9)
  }

  // variações com 9 adicionado (caso seja número antigo)
  if (/^\d{2}\d{8}$/.test(numeroBase)) {
    const com9 = numeroBase.replace(/^(\d{2})(\d{8})$/, '$19$2')
    alternativas.add(com9)
    alternativas.add('55' + com9)
  }

  try {
    const clientesSnapshot = await getDocs(colecaoRef)


    const clienteEncontrado = clientesSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return data as Cliente
      })
      .find((cliente) => {
        const telefoneCliente = String(cliente.telefone || '').replace(/\D/g, '')
        return alternativas.has(telefoneCliente)
      })

    if (!clienteEncontrado) {
      return res.status(404).json({ existe: false, erro: 'Cliente não encontrado com esse telefone' })
    }

    if (!clienteEncontrado.adimplente) {
      return res.status(200).json({
        existe: true,
        adimplente: false,
        erro: 'Cliente encontrado, mas está inadimplente'
      })
    }

    return res.status(200).json({ existe: true, adimplente: true })
  } catch (erro) {
    console.error('Erro ao verificar cliente:', erro)
    return res.status(500).json({ erro: 'Erro interno no servidor' })
  }
}