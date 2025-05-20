import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  texto_limpo: string
} | {
  erro: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const { texto } = req.body

  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({ erro: 'Texto inválido ou não enviado' })
  }

  // Remove marcações no formato [9†source], 【10†source), (3†source], etc.
  let textoLimpo = texto.replace(/[\[({【〈《〔［].*?†.*?[\])}】〉》〕］]/g, '')

  // Remove múltiplos espaços
  textoLimpo = textoLimpo.replace(/\s+/g, ' ').trim()

  return res.status(200).json({ texto_limpo: textoLimpo })
}