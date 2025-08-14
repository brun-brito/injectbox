const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DELAY_ENTRE_ENVIOS = IS_PRODUCTION ? 1000 : 1500;
const TEMPO_RESPOSTA_API = 2500; // Tempo médio de resposta em milissegundos (800ms a 2000ms)

export function calcularTempoEstimadoTotal(contatosRestantes: number): number {
  // Tempo por envio = Delay + Tempo de resposta da API
  const TEMPO_POR_ENVIO = DELAY_ENTRE_ENVIOS + TEMPO_RESPOSTA_API;

  return contatosRestantes * TEMPO_POR_ENVIO;
}

export function formatarTempoEstimado(ms: number): string {
  const minutos = Math.floor(ms / 1000 / 60);
  const segundos = Math.floor((ms / 1000) % 60);
  return `${minutos}m ${segundos}s`;
}