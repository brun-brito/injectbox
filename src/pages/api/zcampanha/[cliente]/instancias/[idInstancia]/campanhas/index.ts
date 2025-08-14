import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import MensagemSender from '@/utils/mensagemSender';

// Tipos para as campanhas
export type StatusCampanha = 'rascunho' | 'agendada' | 'enviando' | 'pausada' | 'concluida' | 'cancelada';

export type TipoMensagem = 'texto' | 'imagem' | 'botoes';

export type ButtonAction = {
  id: string;
  label: string;
};

export type ConteudoMensagem = {
  tipo: TipoMensagem;
  texto?: string;
  imagem?: string;
  legenda?: string;
  botoes?: ButtonAction[];
  variacoes?: string[];
  variacoesLegenda?: string[];
};

export type ContatoSelecionado = {
  id: string;
  nome: string;
  numero: string;
};

export type LogEnvio = {
  id?: string;
  contatoId: string;
  nomeContato: string;
  numeroContato: string;
  status: 'pendente' | 'enviando' | 'sucesso' | 'erro';
  timestampEnvio?: number;
  tempoResposta?: number;
  codigoResposta?: number;
  mensagemErro?: string;
  tentativas: number;
  ultimaTentativa?: number;
  variacaoUsada?: {
    indice: number;
    conteudo: string;
    tipo: 'texto' | 'legenda';
  };
};

export type EstatisticasCampanha = {
  totalContatos: number;
  pendentes: number;
  enviados: number;
  sucessos: number;
  erros: number;
  percentualSucesso: number;
};

export type Campanha = {
  id?: string;
  nome: string;
  descricao?: string;
  conteudo: ConteudoMensagem;
  status: StatusCampanha;
  dataAgendamento?: number;
  dataCriacao: number;
  dataInicio?: number;
  dataConclusao?: number;
  configuracoes: {
    delayEntreEnvios: number; // em segundos
    maxTentativas: number;
    enviarApenasHorarioComercial: boolean;
    horarioInicio?: string; // HH:mm
    horarioFim?: string; // HH:mm
  };
  estatisticas: EstatisticasCampanha;
  ultimaAtualizacao?: number;
  tempoEstimado?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cliente, idInstancia } = req.query;
  
  if (!cliente || typeof cliente !== 'string' || !idInstancia || typeof idInstancia !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const colPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/campanhas`;
  const colRef = dbAdmin.collection(colPath);

  try {
    if (req.method === 'GET') {
      // Listar campanhas com filtros opcionais
      const { status, limite = 50, pagina = 1 } = req.query;
      
      let query = colRef.orderBy('dataCriacao', 'desc');
      
      if (status && typeof status === 'string') {
        query = query.where('status', '==', status);
      }
      
      const offset = (Number(pagina) - 1) * Number(limite);
      query = query.limit(Number(limite)).offset(offset);
      
      const snapshot = await query.get();
      // Para cada campanha, não trazer contatos/logs (serão buscados sob demanda)
      const campanhas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Contar total para paginação
      const totalSnapshot = await colRef.get();
      const total = totalSnapshot.size;
      
      return res.status(200).json({
        campanhas,
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite))
      });
    }

    if (req.method === 'POST') {
      // Criar nova campanha
      const {
        nome,
        descricao,
        conteudo,
        contatos,
        dataAgendamento
      }: Partial<Campanha> & { contatos?: ContatoSelecionado[] } = req.body;

      if (!nome || !conteudo || !contatos || !Array.isArray(contatos) || contatos.length === 0) {
        return res.status(400).json({ 
          error: 'Nome, conteúdo e pelo menos um contato são obrigatórios' 
        });
      }

      // Verificar se já existe uma campanha com o mesmo nome
      const trimmedName = nome.trim();
      const existingNameSnapshot = await colRef.where('nome', '==', trimmedName).limit(1).get();
      if (!existingNameSnapshot.empty) {
        return res.status(400).json({ error: `Uma campanha com o nome "${trimmedName}" já existe.` });
      }

      // Validar conteúdo da mensagem usando o utilitário
      const validacao = MensagemSender.validarConteudo(conteudo);
      if (!validacao.valido) {
        return res.status(400).json({ error: validacao.erro });
      }

      const agora = Date.now();

      // Calcular estatísticas iniciais
      const estatisticasIniciais: EstatisticasCampanha = {
        totalContatos: contatos.length,
        pendentes: contatos.length,
        enviados: 0,
        sucessos: 0,
        erros: 0,
        percentualSucesso: 0
      };

      // Configurações padrão definidas no backend
      const configuracoesPadrao = {
        delayEntreEnvios: 5, // 5 segundos
        maxTentativas: 3, // 3 tentativas
        enviarApenasHorarioComercial: false,
      };

      // Preparar conteúdo sem valores undefined
      const conteudoFiltrado = {
        tipo: conteudo.tipo,
        ...(conteudo.texto && { texto: conteudo.texto }),
        ...(conteudo.imagem && { imagem: conteudo.imagem }),
        ...(conteudo.legenda && { legenda: conteudo.legenda }),
        ...(conteudo.botoes && conteudo.botoes.length > 0 && { botoes: conteudo.botoes })
      };

      // Construir campanha sem contatos/logs
      const novaCampanha: Partial<Campanha> = {
        nome: nome.trim(),
        dataCriacao: agora,
        status: dataAgendamento ? 'agendada' : 'rascunho',
        conteudo: conteudoFiltrado,
        configuracoes: configuracoesPadrao,
        estatisticas: estatisticasIniciais,
      };

      if (descricao?.trim()) {
        novaCampanha.descricao = descricao.trim();
      }
      if (dataAgendamento) {
        novaCampanha.dataAgendamento = dataAgendamento;
      }

      // Criar documento da campanha
      const docRef = await colRef.add(novaCampanha);

      // Criar subcoleção contatos
      const contatosBatch = dbAdmin.batch();
      const contatosCol = docRef.collection('contatos');
      contatos.forEach((contato: ContatoSelecionado) => {
        contatosBatch.set(contatosCol.doc(contato.id), contato);
      });
      await contatosBatch.commit();

      // Criar subcoleção logs
      const logsBatch = dbAdmin.batch();
      const logsCol = docRef.collection('logs');
      contatos.forEach((contato: ContatoSelecionado) => {
        const log: LogEnvio = {
          contatoId: contato.id,
          nomeContato: contato.nome,
          numeroContato: contato.numero,
          status: 'pendente',
          tentativas: 0
        };
        logsBatch.set(logsCol.doc(contato.id), log);
      });
      await logsBatch.commit();

      return res.status(201).json({
        id: docRef.id,
        ...novaCampanha,
        message: 'Campanha criada com sucesso'
      });
    }

    if (req.method === 'PUT') {
      // Atualizar campanha existente
      const { id, contatos, ...dadosAtualizacao } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID da campanha é obrigatório' });
      }

      const docRef = colRef.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Campanha não encontrada' });
      }

      const campanhaAtual = doc.data() as Campanha;
      
      // Verificar se a campanha pode ser editada
      if (['enviando', 'concluida'].includes(campanhaAtual.status)) {
        return res.status(400).json({ 
          error: 'Não é possível editar campanhas em envio ou concluídas' 
        });
      }

      // Verificar se o novo nome já está em uso por outra campanha
      if (dadosAtualizacao.nome) {
        const trimmedName = dadosAtualizacao.nome.trim();
        const existingNameSnapshot = await colRef.where('nome', '==', trimmedName).limit(1).get();
        if (!existingNameSnapshot.empty && existingNameSnapshot.docs[0].id !== id) {
          return res.status(400).json({ error: `Uma campanha com o nome "${trimmedName}" já existe.` });
        }
      }

      // Validar conteúdo se foi alterado
      if (dadosAtualizacao.conteudo) {
        const validacao = MensagemSender.validarConteudo(dadosAtualizacao.conteudo);
        if (!validacao.valido) {
          return res.status(400).json({ error: validacao.erro });
        }
      }

      // Limpar variações antigas se o conteúdo de texto for alterado
      if (dadosAtualizacao.conteudo && dadosAtualizacao.conteudo.texto !== campanhaAtual.conteudo.texto) {
        dadosAtualizacao.conteudo.variacoes = [];
      }

      // Se contatos mudaram, atualizar subcoleção contatos e logs
      if (contatos) {
        // Apagar subcoleções antigas
        const contatosCol = docRef.collection('contatos');
        const logsCol = docRef.collection('logs');
        const contatosSnap = await contatosCol.get();
        const logsSnap = await logsCol.get();
        const batch = dbAdmin.batch();
        contatosSnap.docs.forEach(doc => batch.delete(doc.ref));
        logsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Criar novos contatos/logs
        const contatosBatch = dbAdmin.batch();
        contatos.forEach((contato: ContatoSelecionado) => {
          contatosBatch.set(contatosCol.doc(contato.id), contato);
        });
        await contatosBatch.commit();

        const logsBatch = dbAdmin.batch();
        contatos.forEach((contato: ContatoSelecionado) => {
          const log: LogEnvio = {
            contatoId: contato.id,
            nomeContato: contato.nome,
            numeroContato: contato.numero,
            status: 'pendente',
            tentativas: 0
          };
          logsBatch.set(logsCol.doc(contato.id), log);
        });
        await logsBatch.commit();

        // Atualizar estatísticas
        dadosAtualizacao.estatisticas = {
          totalContatos: contatos.length,
          pendentes: contatos.length,
          enviados: 0,
          sucessos: 0,
          erros: 0,
          percentualSucesso: 0
        };
      }

      // Validação básica do conteúdo da mensagem
      if (!dadosAtualizacao.conteudo || !dadosAtualizacao.conteudo.tipo) {
        return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      }

      // Validar conteúdo baseado no tipo
      switch (dadosAtualizacao.conteudo.tipo) {
        case 'texto':
          if (!dadosAtualizacao.conteudo.texto?.trim()) {
            return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
          }
          break;
        
        case 'imagem':
          if (!dadosAtualizacao.conteudo.imagem) {
            return res.status(400).json({ error: 'Imagem é obrigatória' });
          }
          break;
        
        case 'botoes':
          if (!dadosAtualizacao.conteudo.texto?.trim()) {
            return res.status(400).json({ error: 'Texto da mensagem com botões é obrigatório' });
          }
          if (!dadosAtualizacao.conteudo.botoes || dadosAtualizacao.conteudo.botoes.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um botão é obrigatório' });
          }
          // Validar cada botão
          for (const botao of dadosAtualizacao.conteudo.botoes) {
            if (!botao.label?.trim()) {
              return res.status(400).json({ error: 'Todos os botões devem ter um texto' });
            }
          }
          break;
        
        default:
          return res.status(400).json({ error: `Tipo de mensagem não suportado: ${dadosAtualizacao.conteudo.tipo}` });
      }

      // Remover contatos/logs do update principal
      delete dadosAtualizacao.logs;
      delete dadosAtualizacao.contatos;

      await docRef.update(dadosAtualizacao);
      
      const campanhaAtualizada = await docRef.get();
      
      return res.status(200).json({
        id: campanhaAtualizada.id,
        ...campanhaAtualizada.data(),
        message: 'Campanha atualizada com sucesso'
      });
    }

    if (req.method === 'DELETE') {
      // Deletar campanha
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID da campanha é obrigatório' });
      }

      const docRef = colRef.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Campanha não encontrada' });
      }

      const campanha = doc.data() as Campanha;
      
      // Verificar se a campanha pode ser deletada
      if (campanha.status === 'enviando') {
        return res.status(400).json({ 
          error: 'Não é possível deletar campanhas em andamento' 
        });
      }

      // Apagar subcoleções contatos e logs
      const contatosCol = docRef.collection('contatos');
      const logsCol = docRef.collection('logs');
      const contatosSnap = await contatosCol.get();
      const logsSnap = await logsCol.get();
      const batch = dbAdmin.batch();
      contatosSnap.docs.forEach(doc => batch.delete(doc.ref));
      logsSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      await docRef.delete();
      
      return res.status(200).json({ 
        message: 'Campanha deletada com sucesso' 
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('Erro no handler de campanhas:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
