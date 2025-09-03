import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import MensagemSender from '@/utils/mensagemSender';
import { calcularTempoEstimadoTotal, formatarTempoEstimado } from '@/utils/calculaTempoEstimado';
import { 
  uploadImagemCampanha, 
  removerImagemCampanha, 
  removerImagensCampanha,
  extrairCaminhoStorage,
  validarImagem 
} from '@/utils/firebaseStorage';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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
  imagemPath?: string;
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

// Configuração do Next.js para desabilitar body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para processar upload de arquivo
const processarUpload = async (req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> => {
  return new Promise((resolve, reject) => {
    // Criar diretório temporário se não existir
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        return Boolean(mimetype && mimetype.includes('image'));
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
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
      // Processar upload multipart
      const { fields, files } = await processarUpload(req);
      
      // Extrair dados dos fields
      const nome = Array.isArray(fields.nome) ? fields.nome[0] : fields.nome;
      const descricao = Array.isArray(fields.descricao) ? fields.descricao[0] : fields.descricao;
      const conteudoStr = Array.isArray(fields.conteudo) ? fields.conteudo[0] : fields.conteudo;
      const contatosStr = Array.isArray(fields.contatos) ? fields.contatos[0] : fields.contatos;
      const dataAgendamento = Array.isArray(fields.dataAgendamento) ? fields.dataAgendamento[0] : fields.dataAgendamento;

      if (!nome || !conteudoStr || !contatosStr) {
        return res.status(400).json({ 
          error: 'Nome, conteúdo e contatos são obrigatórios' 
        });
      }

      let conteudo: ConteudoMensagem;
      let contatos: ContatoSelecionado[];

      try {
        conteudo = JSON.parse(conteudoStr);
        contatos = JSON.parse(contatosStr);
      } catch {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      if (!Array.isArray(contatos) || contatos.length === 0) {
        return res.status(400).json({ 
          error: 'Pelo menos um contato é obrigatório' 
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

      // Calcular tempo estimado inicial
      const tempoEstimadoMs = calcularTempoEstimadoTotal(contatos.length);
      const tempoEstimadoStr = formatarTempoEstimado(tempoEstimadoMs);

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
        tempoEstimado: tempoEstimadoStr
      };

      if (descricao?.trim()) {
        novaCampanha.descricao = descricao.trim();
      }
      if (dataAgendamento) {
        novaCampanha.dataAgendamento = parseInt(dataAgendamento);
      }

      // Criar documento da campanha primeiro para ter o ID
      const docRef = await colRef.add(novaCampanha);
      const campanhaId = docRef.id;

      // Processar imagem se enviada (após ter o ID da campanha)
      if (files.imagem) {
        const imageFile = Array.isArray(files.imagem) ? files.imagem[0] : files.imagem;
        if (imageFile && imageFile.size > 0) {
          // Validar imagem
          const validacaoImagem = validarImagem(imageFile);
          if (!validacaoImagem.valido) {
            // Remover campanha criada em caso de erro na imagem
            await docRef.delete();
            return res.status(400).json({ error: validacaoImagem.erro });
          }

          try {
            // Upload para Firebase Storage
            const uploadResult = await uploadImagemCampanha(imageFile, cliente, campanhaId);
            
            // Atualizar conteúdo com URL da imagem
            const conteudoComImagem = {
              ...conteudoFiltrado,
              imagem: uploadResult.url,
              imagemPath: uploadResult.fullPath // Guardar caminho para eventual remoção
            };

            // Atualizar documento da campanha com a URL da imagem
            await docRef.update({ conteudo: conteudoComImagem });
          } catch (error) {
            // Remover campanha criada em caso de erro no upload
            await docRef.delete();
            console.error('Erro no upload da imagem:', error);
            return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
          }
        }
      }

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

      // Buscar dados atualizados da campanha
      const campanhaFinal = await docRef.get();

      return res.status(201).json({
        id: campanhaFinal.id,
        ...campanhaFinal.data(),
        message: 'Campanha criada com sucesso'
      });
    }

    if (req.method === 'PUT') {
      // Processar upload multipart para atualização
      const { fields, files } = await processarUpload(req);
      
      const id = Array.isArray(fields.id) ? fields.id[0] : fields.id;
      const contatosStr = Array.isArray(fields.contatos) ? fields.contatos[0] : fields.contatos;
      
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

      // Construir dados de atualização
      const dadosAtualizacao: any = {};
      
      // Processar campos textuais
      Object.keys(fields).forEach(key => {
        if (key !== 'id' && key !== 'contatos') {
          const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
          if (key === 'conteudo') {
            try {
              dadosAtualizacao[key] = JSON.parse(value as string);
            } catch {
              // Ignorar se não conseguir fazer parse
            }
          } else {
            dadosAtualizacao[key] = value;
          }
        }
      });

      // Processar imagem se enviada
      if (files.imagem) {
        const imageFile = Array.isArray(files.imagem) ? files.imagem[0] : files.imagem;
        if (imageFile && imageFile.size > 0) {
          // Validar imagem
          const validacaoImagem = validarImagem(imageFile);
          if (!validacaoImagem.valido) {
            return res.status(400).json({ error: validacaoImagem.erro });
          }

          try {
            // Remover imagem antiga se existir
            if (campanhaAtual.conteudo.imagemPath) {
              await removerImagemCampanha(campanhaAtual.conteudo.imagemPath);
            }

            // Upload nova imagem para Firebase Storage
            const uploadResult = await uploadImagemCampanha(imageFile, cliente, id);
            
            // Atualizar conteúdo com nova URL da imagem
            if (dadosAtualizacao.conteudo) {
              dadosAtualizacao.conteudo.imagem = uploadResult.url;
              dadosAtualizacao.conteudo.imagemPath = uploadResult.fullPath;
            }
          } catch (error) {
            console.error('Erro no upload da imagem:', error);
            return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
          }
        }
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

      // Se contatos mudaram, atualizar subcoleção contatos e logs
      if (contatosStr) {
        let contatos: ContatoSelecionado[];
        try {
          contatos = JSON.parse(contatosStr);
        } catch {
          return res.status(400).json({ error: 'Dados de contatos inválidos' });
        }

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
        
        const tempoEstimadoMs = calcularTempoEstimadoTotal(contatos.length);
        dadosAtualizacao.tempoEstimado = formatarTempoEstimado(tempoEstimadoMs);
      }

      // Remover contatos/logs do update principal
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
      // Para DELETE, ainda usar body parser normal
      let body;
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        const bodyStr = Buffer.concat(chunks).toString();
        body = JSON.parse(bodyStr);
      } catch {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const { id } = body;
      
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

      // Remover todas as imagens da campanha do Firebase Storage
      await removerImagensCampanha(cliente, id);

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
