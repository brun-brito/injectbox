const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DELAY_ENTRE_ENVIOS = IS_PRODUCTION ? 10000 : 10000;
const TEMPO_RESPOSTA_API = 2500; // Tempo médio de resposta em milissegundos (800ms a 2000ms)

export function calcularTempoEstimadoTotal(contatosRestantes: number): number {
  // Tempo por envio = Delay + Tempo de resposta da API
  const TEMPO_POR_ENVIO = DELAY_ENTRE_ENVIOS + TEMPO_RESPOSTA_API;

  return contatosRestantes * TEMPO_POR_ENVIO;
}

export function formatarTempoEstimado(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}m ${segundos}s`;
  }
  if (minutos > 0) {
    return `${minutos}m ${segundos}s`;
  }
  return `${segundos}s`;
}