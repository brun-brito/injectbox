export interface Cliente {
  id?: string;
  adimplente?: boolean;
  conselho: string;
  cpf: string;
  email: string;
  especialidade: string;
  nome: string;
  telefone: string;uf: string
}

export interface ClientesResponse {
  clientes: Cliente[];
  total?: number;
  pagina?: number;
  limite?: number;
}


