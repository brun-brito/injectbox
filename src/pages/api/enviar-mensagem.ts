import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '../../lib/firebaseAdmin';
import axios from 'axios';

const API_URL = 'https://api.z-api.io/instances/3DB416777CAE50403F51DA9FF2413145/token/4EF4CFFA839C9181472EABE8/send-button-actions';
const CLIENT_TOKEN = 'F6ed0a48bf0af4faa8f05c8d632096a9aS';

type ResultadoEnvio = {
  phone: string;
  status: 'enviado' | 'erro';
  response?: unknown;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const { empresa, produto } = req.query;

  if (!empresa || !produto) {
    return res.status(400).json({ error: 'Parâmetros "empresa" e "produto" são obrigatórios.' });
  }

  try {
    const snapshot = await dbAdmin
      .collection(`empresas/${empresa}/produtos/${produto}/clientes`)
      .get();

    const resultados: ResultadoEnvio[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const phone = data?.telefone;
      const nomeCompleto = data?.nome || '';
      const primeiroNome = nomeCompleto.split(' ')[0];

      if (phone) {
        try {
          const response = await axios.post(
            API_URL,
            {
              phone,
              message: `Boa tarde, ${primeiroNome}! 😁👋\n\n😍 Conheça o *Saypha Rich*, skinbooster da Croma Pharma com zero BDDE. 🥰\n\n💉Usado para hidratação e preenchimento da pele, com foco em combate aos sinais de envelhecimento e melhora da hidratação, tônus e elasticidade cutânea\n\n💉 O *Saypha Rich* tem se transformado no queridinho dos procedimentos que visam a boa administração da pele.`,
              buttonList: {
              buttons: [
                {
                  id: "1",
                  label: "Já conheço o Saypha Rich!"
                },
                {
                  id: "2",
                  label: "Nunca utilizei o Saypha Rich."
                }
              ]
            }
          },
            {
              headers: {
                'Content-Type': 'application/json',
                'Client-Token': CLIENT_TOKEN,
              },
            }
          );

          resultados.push({ phone, status: 'enviado', response: response.data });
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Erro desconhecido');
          resultados.push({ phone, status: 'erro', error: err.message });
        }
      }
    }

    return res.status(200).json({ enviados: resultados.length, detalhes: resultados });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    return res.status(500).json({ error: 'Erro geral ao enviar mensagens', detalhe: err.message });
  }
}