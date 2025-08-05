import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import OpenAI from 'openai';
import { Campanha } from '../index';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_n6x1VUYPkKxoLXCefOQp0NrA';

// Configurações para timeout e tentativas
const CONFIG_OPENAI = {
  TIMEOUT_MS: 40000, // 40 segundos
  MAX_TENTATIVAS: 2,
  INTERVALO_TENTATIVAS: 2000, // 2 segundos
};

// Função para aguardar a conclusão da execução do assistente
const waitForRunCompletion = async (threadId: string, runId: string) => {
  const startTime = Date.now();
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);
  
  while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
    // Verificar timeout
    if (Date.now() - startTime > CONFIG_OPENAI.TIMEOUT_MS) {
      throw new Error('Timeout: Assistente demorou muito para processar');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }
  
  return run;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia, id } = req.query;
  const { texto } = req.body;
  
  if (!cliente || !idInstancia || !id || 
      typeof cliente !== 'string' || typeof idInstancia !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
    return res.status(400).json({ error: 'Texto é obrigatório' });
  }

  // Validação adicional: texto deve ter mais de 30 caracteres
  if (texto.trim().length <= 30) {
    return res.status(200).json({ 
      message: 'Texto muito curto para gerar variações com IA',
      variacoes: [texto.trim()], // Retornar apenas o texto original
      usouFallback: true
    });
  }

  // Verificar se a API key está configurada
  if (!process.env.OPENAI_API_KEY) {
    console.warn(`[${id}] OpenAI API key não configurada`);
    return res.status(200).json({ 
      message: 'OpenAI não configurada, usando texto original',
      variacoes: [texto.trim()],
      usouFallback: true
    });
  }

  // VERIFICAÇÃO ADICIONAL DO ASSISTANT ID
  if (!ASSISTANT_ID) {
    console.error(`[${id}] Assistant ID não configurado`);
    return res.status(200).json({ 
      message: 'Assistant ID não configurado',
      variacoes: [texto.trim()],
      usouFallback: true
    });
  }

  const docPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas/${id}`;
  const docRef = dbAdmin.doc(docPath);

  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      console.error(`[${id}] ❌ Campanha não encontrada no banco`);
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const campanha = doc.data() as Campanha;

    // Verificar se já existem variações
    if (campanha.conteudo.variacoes && campanha.conteudo.variacoes.length > 1) {
      console.log(`[${id}] ✅ Variações já existem (${campanha.conteudo.variacoes.length})`);
      return res.status(200).json({ 
        message: 'Variações já existem',
        variacoes: campanha.conteudo.variacoes,
        usouCache: true
      });
    }

    console.log(`[${id}] 🚀 Iniciando geração com OpenAI...`);

    // Tentar gerar variações com OpenAI (com retry)
    let variacoes: string[] = [];
    let tentativa = 0;
    let ultimoErro: Error | null = null;

    while (tentativa < CONFIG_OPENAI.MAX_TENTATIVAS && variacoes.length === 0) {
      tentativa++;
      
      try {
        console.log(`[${id}] 🔄 Tentativa ${tentativa}/${CONFIG_OPENAI.MAX_TENTATIVAS} com OpenAI...`);
        
        variacoes = await gerarVariacoesComAssistente(texto);
        
        if (variacoes.length > 0) {
          console.log(`[${id}] ✅ OpenAI gerou ${variacoes.length} variações com sucesso`);
          break;
        }
        
      } catch (error) {
        ultimoErro = error instanceof Error ? error : new Error('Erro desconhecido');
        console.warn(`[${id}] ❌ Tentativa ${tentativa} falhou:`, ultimoErro.message);
        
        if (tentativa < CONFIG_OPENAI.MAX_TENTATIVAS) {
          await new Promise(resolve => setTimeout(resolve, CONFIG_OPENAI.INTERVALO_TENTATIVAS));
        }
      }
    }

    // Se não conseguiu gerar variações, retornar apenas o texto original
    if (variacoes.length === 0) {
      console.warn(`[${id}] 💥 Todas as tentativas falharam, retornando texto original`);
      variacoes = [texto.trim()];
      
      return res.status(200).json({ 
        message: 'Falha ao gerar variações com OpenAI, usando texto original',
        variacoes,
        usouFallback: true,
        erro: ultimoErro?.message
      });
    }

    // Salvar variações no documento da campanha
    console.log(`[${id}] 💾 Salvando ${variacoes.length} variações no banco...`);
    await docRef.update({
      'conteudo.variacoes': variacoes
    });

    console.log(`[${id}] ✅ Variações salvas com sucesso!`);
    return res.status(200).json({ 
      message: 'Variações criadas com sucesso!',
      total: variacoes.length,
      variacoes,
      tentativas: tentativa
    });

  } catch (error) {
    console.error(`[${id}] 💥 Erro geral no handler:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({ 
      error: 'Falha ao gerar variações da mensagem',
      details: errorMessage,
      variacoes: [texto.trim()], // Fallback para o texto original
      usouFallback: true
    });
  }
}

async function gerarVariacoesComAssistente(textoOriginal: string): Promise<string[]> {
  console.log(`[OPENAI] 🎯 Criando thread para texto: "${textoOriginal.substring(0, 50)}..."`);
  
  // 1. Criar uma Thread
  const thread = await openai.beta.threads.create();
  console.log(`[OPENAI] 📝 Thread criada: ${thread.id}`);

  try {
    // 2. Adicionar a mensagem do usuário à Thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: textoOriginal,
    });
    console.log(`[OPENAI] 💬 Mensagem adicionada à thread`);

    // 3. Executar o Assistente na Thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log(`[OPENAI] 🏃 Run iniciada: ${run.id}`);

    // 4. Aguardar a conclusão da execução
    const completedRun = await waitForRunCompletion(thread.id, run.id);
    console.log(`[OPENAI] ✅ Run completada com status: ${completedRun.status}`);

    if (completedRun.status !== 'completed') {
      throw new Error(`Assistente falhou com status: ${completedRun.status}`);
    }

    // 5. Recuperar as mensagens da Thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(m => m.role === 'assistant');

    if (!assistantMessage || assistantMessage.content[0].type !== 'text') {
      throw new Error('Assistente não retornou resposta de texto válida');
    }

    const jsonString = assistantMessage.content[0].text.value;
    console.log(`[OPENAI] 📄 Resposta recebida: "${jsonString.substring(0, 100)}..."`);
    
    // Validar e parsear JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[OPENAI] ❌ Erro ao parsear JSON:`, parseError);
      throw new Error(`JSON inválido do assistente: ${parseError}`);
    }

    const { variations } = parsedResponse as { original: string; variations: string[] };

    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      console.error(`[OPENAI] ❌ Formato inválido:`, parsedResponse);
      throw new Error('Formato de resposta inválido ou array de variações vazio');
    }

    // Filtrar variações válidas (não vazias e diferentes do original)
    const variacoesValidas = variations
      .filter(v => v && typeof v === 'string' && v.trim().length > 0 && v.trim() !== textoOriginal.trim())
      .map(v => v.trim())
      .slice(0, 10); // Máximo 10 variações

    console.log(`[OPENAI] 🎯 Variações válidas encontradas: ${variacoesValidas.length}`);

    // Adicionar o texto original como primeira opção
    const todasVariacoes = [textoOriginal, ...variacoesValidas];

    return todasVariacoes;

  } finally {
    // Cleanup: deletar a thread para economizar recursos
    try {
      await openai.beta.threads.del(thread.id);
      console.log(`[OPENAI] 🗑️ Thread ${thread.id} deletada`);
    } catch (cleanupError) {
      console.warn(`[OPENAI] ⚠️ Erro ao limpar thread:`, cleanupError);
    }
  }
}
