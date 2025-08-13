const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CONFIG_ENVIO = {
    TAMANHO_LOTE: IS_PRODUCTION ? 10 : 15, // Ainda menor em produção
    DELAY_ENTRE_LOTES: IS_PRODUCTION ? 15000 : 20000, // 15s em produção
    DELAY_MINIMO_MENSAGEM: IS_PRODUCTION ? 1000 : 1500, // 1s em produção
    DELAY_MAXIMO_MENSAGEM: IS_PRODUCTION ? 3000 : 4000, // 3s em produção
    MAX_TENTATIVAS_CONTATO: 3,
    TIMEOUT_REQUISICAO: IS_PRODUCTION ? 8000 : 100000, // 8s em produção
    TIMEOUT_TOTAL_FUNCAO: IS_PRODUCTION ? 55000 : 90000, // 55s em produção (margem de 5s)
    MAX_CONTATOS_POR_EXECUCAO: IS_PRODUCTION ? 25 : 50, // Máximo 25 em produção
};

export function calcularTempoEstimadoTotal(totalContatos: number): number {
    // Use delays reais do ambiente
    const delayMedioMensagem = (CONFIG_ENVIO.DELAY_MINIMO_MENSAGEM + CONFIG_ENVIO.DELAY_MAXIMO_MENSAGEM) / 2;
    const tempoMensagens = totalContatos * delayMedioMensagem;
    const numeroLotes = Math.ceil(totalContatos / CONFIG_ENVIO.TAMANHO_LOTE);
    const tempoLotes = (numeroLotes - 1) * CONFIG_ENVIO.DELAY_ENTRE_LOTES;
    return tempoMensagens + tempoLotes;
}

export function formatarTempoEstimado(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const horas = Math.floor(totalSec / 3600);
    const minutos = Math.floor((totalSec % 3600) / 60);
    return `${horas}h${minutos.toString().padStart(2, '0')}m`;
}
  
