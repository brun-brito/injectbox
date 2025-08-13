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
  variacoesLegenda?: string[]; // Para variações da legenda de imagens
};

export type ContatoSelecionado = {
  id: string;
  nome: string;
  numero: string;
};

export type LogEnvio = {
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
  contatos?: ContatoSelecionado[]; // agora opcional
  status: StatusCampanha;
  dataAgendamento?: number;
  dataCriacao: number;
  dataInicio?: number;
  dataConclusao?: number;
  criadoPor: string;
  estatisticas: EstatisticasCampanha;
  pausadaEm?: number;
  tempoEstimado?: number;
  progresso?: {
    tempoEstimado: number;
  };
}
export type Contato = { id: string; nome: string; numero: string };