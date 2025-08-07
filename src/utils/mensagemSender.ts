import { ConteudoMensagem, LogEnvio } from '@/pages/api/zcampanha/[cliente]/instancias/[idInstancia]/campanhas';

export interface ConfiguracaoEnvio {
  tokenInstancia: string;
  clientToken: string;
  idInstancia: string;
  timeout?: number;
}

export class MensagemSender {
  private config: ConfiguracaoEnvio;
  private baseUrl: string;

  constructor(config: ConfiguracaoEnvio) {
    this.config = config;
    this.baseUrl = `https://api.z-api.io/instances/${config.idInstancia}/token/${config.tokenInstancia}`;
  }

  /**
   * Envia mensagem baseada no tipo de conteúdo
   */
  async enviarMensagem(
    contato: LogEnvio,
    conteudo: ConteudoMensagem
  ): Promise<{ sucesso: boolean; erro?: string; codigoResposta?: number }> {
    try {
      switch (conteudo.tipo) {
        case 'texto':
          return await this.enviarTexto(contato, conteudo);
        case 'imagem':
          return await this.enviarImagem(contato, conteudo);
        case 'botoes':
          return await this.enviarBotoes(contato, conteudo);
        default:
          return {
            sucesso: false,
            erro: `Tipo de mensagem não suportado: ${(conteudo as any).tipo}`
          };
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia mensagem de texto
   */
  private async enviarTexto(
    contato: LogEnvio,
    conteudo: ConteudoMensagem
  ): Promise<{ sucesso: boolean; erro?: string; codigoResposta?: number }> {
    if (!conteudo.texto?.trim()) {
      return { sucesso: false, erro: 'Texto da mensagem não pode estar vazio' };
    }

    let mensagemProcessada = this.processarVariaveis(conteudo.texto, contato);
    mensagemProcessada = this.processarQuebrasLinha(mensagemProcessada);

    const payload = {
      phone: contato.numeroContato,
      message: mensagemProcessada
    };

    return await this.fazerRequisicao('send-text', payload);
  }

  /**
   * Envia imagem com legenda opcional
   */
  private async enviarImagem(
    contato: LogEnvio,
    conteudo: ConteudoMensagem
  ): Promise<{ sucesso: boolean; erro?: string; codigoResposta?: number }> {
    if (!conteudo.imagem) {
      return { sucesso: false, erro: 'Imagem não pode estar vazia' };
    }

    const payload: any = {
      phone: contato.numeroContato,
      image: conteudo.imagem,
      viewOnce: false
    };

    // Adicionar legenda se fornecida
    if (conteudo.legenda?.trim()) {
      let legendaProcessada = this.processarVariaveis(conteudo.legenda, contato);
      legendaProcessada = this.processarQuebrasLinha(legendaProcessada);
      payload.caption = legendaProcessada;
    }

    return await this.fazerRequisicao('send-image', payload);
  }

  /**
   * Envia mensagem com botões de ação
   */
  private async enviarBotoes(
    contato: LogEnvio,
    conteudo: ConteudoMensagem
  ): Promise<{ sucesso: boolean; erro?: string; codigoResposta?: number }> {
    if (!conteudo.texto?.trim()) {
      return { sucesso: false, erro: 'Texto da mensagem não pode estar vazio' };
    }

    if (!conteudo.botoes || conteudo.botoes.length === 0) {
      return { sucesso: false, erro: 'Pelo menos um botão deve ser fornecido' };
    }

    // Validar botões
    for (const botao of conteudo.botoes) {
      if (!botao.label?.trim()) {
        return { sucesso: false, erro: 'Todos os botões devem ter um texto' };
      }
    }

    let mensagemProcessada = this.processarVariaveis(conteudo.texto, contato);
    mensagemProcessada = this.processarQuebrasLinha(mensagemProcessada);

    const payload: any = {
      phone: contato.numeroContato,
      message: mensagemProcessada,
      buttonList: {
        buttons: conteudo.botoes.map(botao => ({
          label: botao.label
        }))
      }
    };

    // Adicionar imagem se fornecida
    if (conteudo.imagem) {
      payload.buttonList.image = conteudo.imagem;
    }

    return await this.fazerRequisicao('send-button-list', payload);
  }

  /**
   * Faz a requisição HTTP para a API do Z-API
   */
  private async fazerRequisicao(
    endpoint: string,
    payload: any
  ): Promise<{ sucesso: boolean; erro?: string; codigoResposta?: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'client-token': this.config.clientToken,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        return { sucesso: true, codigoResposta: response.status };
      } else {
        return {
          sucesso: false,
          erro: data?.error || `HTTP ${response.status}`,
          codigoResposta: response.status
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { sucesso: false, erro: 'Timeout na requisição' };
        }
        return { sucesso: false, erro: error.message };
      }
      return { sucesso: false, erro: 'Erro desconhecido na requisição' };
    }
  }

  /**
   * Processa variáveis na mensagem
   */
  private processarVariaveis(texto: string, contato: LogEnvio): string {
    const primeiroNome = contato.nomeContato.split(' ')[0];
    
    return texto
      .replace(/\$nome/gi, contato.nomeContato)
      .replace(/\$primeiroNome/gi, primeiroNome)
      .replace(/\$numero/gi, contato.numeroContato)
      .replace(/\$telefone/gi, contato.numeroContato);
  }

  /**
   * Processa quebras de linha
   */
  private processarQuebrasLinha(texto: string): string {
    return texto.replace(/\n/g, '\n');
  }

  /**
   * Valida se o conteúdo da mensagem está correto
   */
  static validarConteudo(conteudo: ConteudoMensagem): { valido: boolean; erro?: string } {
    switch (conteudo.tipo) {
      case 'texto':
        if (!conteudo.texto?.trim()) {
          return { valido: false, erro: 'Texto da mensagem é obrigatório' };
        }
        break;

      case 'imagem':
        if (!conteudo.imagem) {
          return { valido: false, erro: 'Imagem é obrigatória' };
        }
        break;

      case 'botoes':
        if (!conteudo.texto?.trim()) {
          return { valido: false, erro: 'Texto da mensagem com botões é obrigatório' };
        }
        if (!conteudo.botoes || conteudo.botoes.length === 0) {
          return { valido: false, erro: 'Pelo menos um botão é obrigatório' };
        }
        for (const botao of conteudo.botoes) {
          if (!botao.label?.trim()) {
            return { valido: false, erro: 'Todos os botões devem ter um texto' };
          }
        }
        break;

      default:
        return { valido: false, erro: 'Tipo de mensagem não suportado' };
    }

    return { valido: true };
  }
}

export default MensagemSender;
