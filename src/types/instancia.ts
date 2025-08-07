export interface Instancia {
  idInstancia: string;
  nome: string;
  numero: string;
  tokenInstancia?: string;
  status?: 'ativo' | 'inativo';
  dataCriacao?: number;
  ultimaAtualizacao?: number;
}

export interface InstanciasResponse {
  instancias: Instancia[];
  total?: number;
}
