export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface CampanhaControleRequest {
  action: 'pausar' | 'retomar' | 'cancelar' | 'status';
  params?: Record<string, unknown>;
}

export interface CampanhaStatus {
  status: string;
  progresso?: number;
  mensagem?: string;
  dados?: Record<string, unknown>;
}

export type RequestBody = Record<string, unknown>;
export type QueryParams = Record<string, string | string[] | undefined>;
export type ApiHandler<T = unknown> = (data: RequestBody, query: QueryParams) => Promise<ApiResponse<T>>;

// Content variation types
export interface VariacaoInfo {
  indice: number;
  conteudo: string;
  tipo: 'texto' | 'legenda';
}

export interface ConteudoComVariacao {
  conteudo: Record<string, unknown>;
  variacaoInfo: VariacaoInfo | null;
}
