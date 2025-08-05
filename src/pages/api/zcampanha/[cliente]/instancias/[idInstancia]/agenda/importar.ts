import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import * as XLSX from 'xlsx';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ContatoImportacao = {
  nome: string;
  numero: string;
  linha: number;
};

type ResultadoValidacao = {
  valido: boolean;
  erros: string[];
  contato?: ContatoImportacao;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente, idInstancia } = req.query;
  
  if (!cliente || typeof cliente !== 'string' || !idInstancia || typeof idInstancia !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  const colPath = `/empresas/${cliente}/produtos/zcampanha/instancias/${idInstancia}/clientes`;
  const colRef = dbAdmin.collection(colPath);

  try {
    // Parse do arquivo enviado
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => {
        return part.name === 'arquivo' && (
          part.mimetype?.includes('spreadsheet') ||
          part.mimetype?.includes('excel') ||
          part.mimetype?.includes('csv') ||
          (part as any).originalFilename?.endsWith('.xlsx') ||
          (part as any).originalFilename?.endsWith('.xls') ||
          (part as any).originalFilename?.endsWith('.csv')
        );
      }
    });

    const [fields, files] = await form.parse(req);
    const arquivo = Array.isArray(files.arquivo) ? files.arquivo[0] : files.arquivo;

    if (!arquivo) {
      return res.status(400).json({ error: 'Nenhum arquivo válido enviado' });
    }

    // Ler e processar arquivo
    const contatos = await processarArquivo(arquivo.filepath, (arquivo as any).originalFilename || '');
    
    // Validar contatos
    const resultadosValidacao = await validarContatos(contatos, colRef);
    
    // Separar válidos e inválidos
    const contatosValidos = resultadosValidacao
      .filter(r => r.valido && r.contato)
      .map(r => r.contato!);
    
    const errosValidacao = resultadosValidacao
      .filter(r => !r.valido)
      .map(r => ({ linha: r.contato?.linha || 0, erros: r.erros }));

    // Inserir contatos válidos no banco
    const contatosInseridos = [];
    for (const contato of contatosValidos) {
      try {
        const docRef = await colRef.add({
          nome: contato.nome,
          numero: contato.numero
        });
        contatosInseridos.push({
          id: docRef.id,
          nome: contato.nome,
          numero: contato.numero,
          linha: contato.linha
        });
      } catch (error) {
        errosValidacao.push({
          linha: contato.linha,
          erros: ['Erro ao salvar no banco de dados']
        });
      }
    }

    // Limpar arquivo temporário
    fs.unlinkSync(arquivo.filepath);

    return res.status(200).json({
      success: true,
      totalLinhas: contatos.length,
      contatosInseridos: contatosInseridos.length,
      errosEncontrados: errosValidacao.length,
      contatos: contatosInseridos,
      erros: errosValidacao
    });

  } catch (error) {
    console.error('Erro na importação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function processarArquivo(caminho: string, nomeArquivo: string): Promise<ContatoImportacao[]> {
  const contatos: ContatoImportacao[] = [];
  
  try {
    let workbook: XLSX.WorkBook;
    
    if (nomeArquivo.toLowerCase().endsWith('.csv')) {
      // Processar CSV
      const csvData = fs.readFileSync(caminho, 'utf8');
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      // Processar Excel
      workbook = XLSX.readFile(caminho);
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Pular cabeçalho se existir
    let inicioLinha = 0;
    if (dados.length > 0) {
      const primeiraLinha = dados[0];
      const contemCabecalho = primeiraLinha.some((cell: any) => 
        typeof cell === 'string' && 
        (cell.toLowerCase().includes('nome') || cell.toLowerCase().includes('numero'))
      );
      inicioLinha = contemCabecalho ? 1 : 0;
    }

    // Processar dados
    for (let i = inicioLinha; i < dados.length; i++) {
      const linha = dados[i];
      const numeroLinha = i + 1;
      
      // Pular linhas vazias
      if (!linha || linha.length === 0 || linha.every(cell => !cell)) {
        continue;
      }
      
      const nome = linha[0] ? String(linha[0]).trim() : '';
      const numero = linha[1] ? String(linha[1]).trim() : '';
      
      contatos.push({
        nome,
        numero,
        linha: numeroLinha
      });
    }

    return contatos;

  } catch (error) {
    throw new Error(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

async function validarContatos(
  contatos: ContatoImportacao[], 
  colRef: any
): Promise<ResultadoValidacao[]> {
  const resultados: ResultadoValidacao[] = [];
  
  // Buscar números existentes
  const numerosExistentes = new Set<string>();
  const snapExistentes = await colRef.get();
  snapExistentes.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.numero) {
      numerosExistentes.add(limparNumero(data.numero));
    }
  });

  // Rastrear duplicatas na importação
  const numerosNaImportacao = new Set<string>();

  for (const contato of contatos) {
    const erros: string[] = [];
    
    // Validar nome
    if (!contato.nome || contato.nome.length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (contato.nome && contato.nome.length > 100) {
      erros.push('Nome deve ter no máximo 100 caracteres');
    }

    // Validar número
    if (!contato.numero) {
      erros.push('Número é obrigatório');
    } else {
      const numeroLimpo = limparNumero(contato.numero);
      
      // Validar formato básico
      if (!/^\d{10,15}$/.test(numeroLimpo)) {
        erros.push('Número deve conter entre 10 e 15 dígitos');
      }
      
      // Verificar se já existe no banco
      if (numerosExistentes.has(numeroLimpo)) {
        erros.push('Número já existe na agenda');
      }
      
      // Verificar duplicata na importação
      if (numerosNaImportacao.has(numeroLimpo)) {
        erros.push('Número duplicado na planilha');
      } else {
        numerosNaImportacao.add(numeroLimpo);
      }
      
      // Atualizar número limpo
      contato.numero = numeroLimpo;
    }

    resultados.push({
      valido: erros.length === 0,
      erros,
      contato
    });
  }

  return resultados;
}

function limparNumero(numero: string): string {
  // Remove tudo que não é dígito
  return numero.replace(/\D/g, '');
}
