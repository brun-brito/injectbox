// import type { NextApiRequest, NextApiResponse } from 'next';
// import { dbAdmin } from '@/lib/firebaseAdmin';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Método não permitido' });
//   }

//   const { cliente, idInstancia, id } = req.query;
//   if (!cliente || !idInstancia || !id) {
//     return res.status(400).json({ error: 'Parâmetros inválidos' });
//   }

//   const campanhaRef = dbAdmin.collection(`/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`).doc(id);

//   // Buscar logs com erro e tentativas < MAX_TENTATIVAS
//   const logsSnap = await campanhaRef.collection('logs').where('status', '==', 'erro').get();
//   let atualizados = 0;
//   for (const doc of logsSnap.docs) {
//     const data = doc.data();
//     if ((data.tentativas || 0) < 3) {
//       await doc.ref.update({ status: 'pendente' });
//       atualizados++;
//     }
//   }

//   // Disparar novamente a função de envio (igual ao retomar)
//   // ...chamada para processaCampanhaHttp...

//   return res.status(200).json({ message: `Marcados ${atualizados} contatos para reenvio.` });
// }
