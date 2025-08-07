import { useRouter } from 'next/router';
import { useEffect, useState, ChangeEvent, useRef } from 'react';
import { FiPaperclip, FiX, FiPlus, FiPhone, FiExternalLink, FiMessageSquare } from 'react-icons/fi';
import { MdPhotoLibrary, MdSmartButton } from 'react-icons/md';
import { withZCampanhaAuth } from '@/components/zcampanha/withZCampanhaAuth';

type Mensagem = {
  de: 'usuario' | 'contato';
  texto?: string;
  imagem?: string;
  legenda?: string;
  real?: boolean;
  botoes?: ButtonAction[];
};

type Contato = { id: string; nome: string; numero: string };

type ButtonAction = {
  id: string;
  label: string;
};

const mensagemInicial: Mensagem = {
  de: 'contato',
  texto: 'Olá! Aqui você pode enviar quantas mensagens quiser como simulação. Caso queira fazer um teste real, selecione um contato acima e envie a mensagem desejada no botão azul.'
};

const SimuladorPage = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };
  const [mensagens, setMensagens] = useState<Mensagem[]>([mensagemInicial]);
  const [input, setInput] = useState('');
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tokenInstancia, setTokenInstancia] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busca, setBusca] = useState('');
  
  // Estados para imagem
  const [imagemSelecionada, setImagemSelecionada] = useState<string>('');
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuClipOpen, setMenuClipOpen] = useState(false);

  // Estados para sistema de variáveis
  const [mostrarVariaveis, setMostrarVariaveis] = useState(false);

  // Estados para botões de ação
  const [mostrarBotoes, setMostrarBotoes] = useState(false);
  const [botoesAcao, setBotoesAcao] = useState<ButtonAction[]>([]);
  const [modalBotoes, setModalBotoes] = useState(false);

  // Timer para auto-hide do feedback
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide feedback após 5 segundos
  useEffect(() => {
    if (feedback) {
      // Limpar timer anterior se existir
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      
      // Criar novo timer
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }

    // Cleanup: limpar timer quando feedback mudar ou componente desmontar
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [feedback]);

  // Função para fechar feedback manualmente
  const fecharFeedback = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(null);
  };

  // Busca contatos da agenda
  useEffect(() => {
    if (cliente && idInstancia) {
      fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`)
        .then(res => res.json())
        .then(data => setContatos(data.contatos || []));
    }
  }, [cliente, idInstancia]);

  // Busca token da instância e client-token
  useEffect(() => {
    if (cliente && idInstancia) {
      fetch(`/api/zcampanha/${cliente}/instancias`)
        .then(res => res.json())
        .then(data => {
          const inst = (data.instancias || []).find((i: any) => i.idInstancia === idInstancia);
          if (inst) setTokenInstancia(inst.tokenInstancia);
        });
      fetch(`/api/zcampanha/${cliente}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.doc && data.doc['Client-Token']) {
            setClientToken(data.doc['Client-Token']);
          }
        });
    }
  }, [cliente, idInstancia]);

  // Função para lidar com seleção de arquivo
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é imagem
    if (!file.type.startsWith('image/')) {
      setFeedback('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagemSelecionada(result);
      setNomeArquivo(file.name);
      setFeedback(null);
    };
    reader.readAsDataURL(file);
    setMenuClipOpen(false);

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para remover imagem selecionada
  const removerImagem = () => {
    setImagemSelecionada('');
    setNomeArquivo('');
    setFeedback(null);
  };

  // Função para processar variáveis na mensagem
  const processarVariaveis = (texto: string, contato: Contato | null): string => {
    if (!contato) return texto;
    
    // Extrair primeiro nome
    const primeiroNome = contato.nome.split(' ')[0];
    
    return texto
      .replace(/\$nome/gi, contato.nome)
      .replace(/\$primeiroNome/gi, primeiroNome)
      .replace(/\$numero/gi, contato.numero)
      .replace(/\$telefone/gi, contato.numero);
  };

  // Função para processar quebras de linha
  const processarQuebrasLinha = (texto: string): string => {
    return texto.replace(/\n/g, '\n');
  };

  // Função para inserir variável no input
  const inserirVariavel = (variavel: string) => {
    const textarea = document.querySelector('.text-input') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const textoAntes = input.substring(0, start);
      const textoDepois = input.substring(end);
      const novoTexto = textoAntes + variavel + textoDepois;
      
      setInput(novoTexto);
      
      // Focar no input e posicionar cursor após a variável
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variavel.length, start + variavel.length);
      }, 0);
    }
    setMostrarVariaveis(false);
  };

  // Função para obter preview da mensagem personalizada
  const getPreviewMensagem = (): string => {
    if (!contatoSelecionado) return input;
    return processarVariaveis(input, contatoSelecionado);
  };

  // Função para adicionar botão de ação
  const adicionarBotao = () => {
    const novoBotao: ButtonAction = {
      id: (botoesAcao.length + 1).toString(),
      label: ''
    };
    setBotoesAcao([...botoesAcao, novoBotao]);
  };

  // Função para remover botão de ação
  const removerBotao = (index: number) => {
    setBotoesAcao(botoesAcao.filter((_, i) => i !== index));
  };

  // Função para atualizar botão de ação
  const atualizarBotao = (index: number, campo: keyof ButtonAction, valor: string) => {
    const novosBotoes = [...botoesAcao];
    novosBotoes[index] = { ...novosBotoes[index], [campo]: valor };
    setBotoesAcao(novosBotoes);
  };

  // Função para limpar botões
  const limparBotoes = () => {
    setBotoesAcao([]);
  };

  // Função para validar botões
  const validarBotoes = (): boolean => {
    for (const botao of botoesAcao) {
      if (!botao.label.trim()) {
        setFeedback('Todos os botões devem ter um texto.');
        return false;
      }
    }
    return true;
  };

  // Enviar texto com botões (simulação)
  const enviarTextoComBotoesSimulacao = () => {
    if (!input.trim()) {
      setFeedback('Digite uma mensagem.');
      return;
    }
    if (botoesAcao.length === 0) {
      setFeedback('Adicione pelo menos um botão.');
      return;
    }
    if (!validarBotoes()) return;

    let textoProcessado = contatoSelecionado ? processarVariaveis(input, contatoSelecionado) : input;
    textoProcessado = processarQuebrasLinha(textoProcessado);
    
    setMensagens(prev => [...prev, { 
      de: 'usuario', 
      texto: textoProcessado,
      botoes: [...botoesAcao],
      imagem: imagemSelecionada || undefined
    }]);
    setInput('');
    setBotoesAcao([]);
    setImagemSelecionada('');
    setNomeArquivo('');
    setFeedback(null);
  };

  // Enviar texto com botões real para WhatsApp
  const enviarTextoComBotoesReal = async () => {
    if (!contatoSelecionado) {
      setFeedback('Selecione um contato.');
      return;
    }
    if (!input.trim()) {
      setFeedback('Digite uma mensagem.');
      return;
    }
    if (botoesAcao.length === 0) {
      setFeedback('Adicione pelo menos um botão.');
      return;
    }
    if (!validarBotoes()) return;
    if (!tokenInstancia || !clientToken) {
      setFeedback('Token da instância ou client-token não encontrado.');
      return;
    }

    let mensagemProcessada = processarVariaveis(input, contatoSelecionado);
    mensagemProcessada = processarQuebrasLinha(mensagemProcessada);

    setEnviando(true);
    try {
      const payload: any = {
        phone: contatoSelecionado.numero,
        message: mensagemProcessada,
        buttonList: {
          buttons: botoesAcao.map(botao => ({
            label: botao.label
          }))
        }
      };

      // Adicionar imagem se selecionada
      if (imagemSelecionada) {
        payload.buttonList.image = imagemSelecionada;
      }

      const response = await fetch(`https://api.z-api.io/instances/${idInstancia}/token/${tokenInstancia}/send-button-list`, {
        method: 'POST',
        headers: {
          'client-token': clientToken,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        setFeedback('Mensagem com botões enviada com sucesso!');
        setMensagens(prev => [...prev, { 
          de: 'usuario', 
          texto: mensagemProcessada, 
          botoes: [...botoesAcao],
          imagem: imagemSelecionada || undefined,
          real: true 
        }]);
        setInput('');
        setBotoesAcao([]);
        setImagemSelecionada('');
        setNomeArquivo('');
      } else {
        setFeedback(`Erro: ${data?.error || 'Falha ao enviar mensagem com botões'}`);
      }
    } catch (error) {
      setFeedback('Erro de conexão ao enviar mensagem com botões.');
      console.error('Erro ao enviar botões:', error);
    }
    setEnviando(false);
  };

  // Enviar apenas texto (simulação)
  const enviarTextoSimulacao = () => {
    if (!input.trim()) return;
    
    // Processar variáveis e quebras de linha mesmo na simulação
    let textoProcessado = contatoSelecionado ? processarVariaveis(input, contatoSelecionado) : input;
    textoProcessado = processarQuebrasLinha(textoProcessado);
    
    setMensagens(prev => [...prev, { de: 'usuario', texto: textoProcessado }]);
    setInput('');
    setFeedback(null);
  };

  // Enviar texto real para WhatsApp
  const enviarTextoReal = async () => {
    if (!contatoSelecionado) {
      setFeedback('Selecione um contato.');
      return;
    }
    if (!input.trim()) {
      setFeedback('Digite uma mensagem.');
      return;
    }
    if (!tokenInstancia || !clientToken) {
      setFeedback('Token da instância ou client-token não encontrado.');
      return;
    }

    // Processar variáveis e quebras de linha antes de enviar
    let mensagemProcessada = processarVariaveis(input, contatoSelecionado);
    mensagemProcessada = processarQuebrasLinha(mensagemProcessada);

    setEnviando(true);
    try {
      const response = await fetch(`https://api.z-api.io/instances/${idInstancia}/token/${tokenInstancia}/send-text`, {
        method: 'POST',
        headers: {
          'client-token': clientToken,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          phone: contatoSelecionado.numero,
          message: mensagemProcessada
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setFeedback('Mensagem enviada com sucesso!');
        // Adicionar na simulação com a mensagem processada
        setMensagens(prev => [...prev, { de: 'usuario', texto: mensagemProcessada, real: true }]);
        setInput('');
      } else {
        setFeedback(`Erro: ${data?.error || 'Falha ao enviar mensagem'}`);
      }
    } catch (error) {
      setFeedback('Erro de conexão ao enviar mensagem.');
      console.error('Erro ao enviar texto:', error);
    }
    setEnviando(false);
  };

  // Enviar imagem (simulação)
  const enviarImagemSimulacao = () => {
    if (!imagemSelecionada) {
      setFeedback('Selecione uma imagem.');
      return;
    }

    // Processar variáveis e quebras de linha na legenda mesmo na simulação
    let legendaProcessada: string;
    if (input.trim() && contatoSelecionado) {
      legendaProcessada = processarVariaveis(input, contatoSelecionado);
      legendaProcessada = processarQuebrasLinha(legendaProcessada);
    } else if (input.trim()) {
      legendaProcessada = processarQuebrasLinha(input);
    }
    
    setMensagens(prev => [...prev, { 
      de: 'usuario', 
      imagem: imagemSelecionada, 
      legenda: legendaProcessada
    }]);
    
    setImagemSelecionada('');
    setNomeArquivo('');
    setInput('');
    setFeedback(null);
  };

  // Enviar imagem real para WhatsApp
  const enviarImagemReal = async () => {
    if (!contatoSelecionado) {
      setFeedback('Selecione um contato.');
      return;
    }
    if (!imagemSelecionada) {
      setFeedback('Selecione uma imagem.');
      return;
    }
    if (!tokenInstancia || !clientToken) {
      setFeedback('Token da instância ou client-token não encontrado.');
      return;
    }

    setEnviando(true);
    try {
      // Processar variáveis e quebras de linha na legenda antes de enviar
      let legendaProcessada: string | undefined = undefined;
      if (input.trim()) {
        legendaProcessada = processarVariaveis(input, contatoSelecionado);
        legendaProcessada = processarQuebrasLinha(legendaProcessada);
      }
      
      const response = await fetch(`https://api.z-api.io/instances/${idInstancia}/token/${tokenInstancia}/send-image`, {
        method: 'POST',
        headers: {
          'client-token': clientToken,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          phone: contatoSelecionado.numero,
          image: imagemSelecionada,
          caption: legendaProcessada,
          viewOnce: false
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setFeedback('Imagem enviada com sucesso!');
        // Adicionar na simulação com a legenda processada
        setMensagens(prev => [...prev, { 
          de: 'usuario', 
          imagem: imagemSelecionada, 
          legenda: legendaProcessada,
          real: true
        }]);
        setImagemSelecionada('');
        setNomeArquivo('');
        setInput('');
      } else {
        setFeedback(`Erro: ${data?.error || 'Falha ao enviar imagem'}`);
      }
    } catch (error) {
      setFeedback('Erro de conexão ao enviar imagem.');
      console.error('Erro ao enviar imagem:', error);
    }
    setEnviando(false);
  };

  const limpar = () => setMensagens([mensagemInicial]);

  // Modal de seleção de contato
  const contatosFiltrados = contatos.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.numero.includes(busca)
  );

  return (
    <div className="dashboard-bg">
      <button className="voltar-btn" onClick={() => router.push(`/zcampanha/${cliente}/instancias/${idInstancia}`)}>&larr; Voltar</button>
      
      <div style={{ width: 600, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="limpar-btn" onClick={limpar} title="Limpar conversa">
          Limpar conversa
        </button>
      </div>

      <div className="celular-sim">
        <div className="celular-topo">
          <span className="celular-nome">Simulador de Conversa</span>
        </div>

        {/* Área de seleção de contato */}
        <div className="contato-area">
          <button
            className="contato-btn-topo"
            onClick={() => setModalOpen(true)}
            title={contatoSelecionado ? `Contato: ${contatoSelecionado.nome}` : 'Selecionar contato'}
          >
            {contatoSelecionado ? (
              <>
                <span className="contato-nome-selecionado">{contatoSelecionado.nome}</span>
                <span className="contato-numero-selecionado">({contatoSelecionado.numero})</span>
              </>
            ) : (
              'Clique para selecionar um contato'
            )}
          </button>

          {contatoSelecionado && (
            <button
              className="remover-contato-btn-topo"
              onClick={() => setContatoSelecionado(null)}
              title="Remover contato selecionado"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="tela">
          {mensagens.map((msg, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {msg.imagem && (
                <div className={
                  msg.de === 'usuario' 
                    ? (msg.real ? 'msg-usuario-imagem-real' : 'msg-usuario-imagem') 
                    : 'msg-contato-imagem'
                }>
                  <img
                    src={msg.imagem}
                    alt={msg.legenda || 'imagem'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                      display: 'block',
                      objectFit: 'cover'
                    }}
                  />
                  {msg.legenda && (
                    <div style={{
                      color: '#fff',
                      fontSize: '0.9rem',
                      marginTop: 4,
                      padding: '4px 8px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.legenda}
                    </div>
                  )}
                </div>
              )}
              {msg.texto && (
                <div className={
                  msg.de === 'usuario' 
                    ? (msg.real ? 'msg-usuario-real' : 'msg-usuario') 
                    : 'msg-contato'
                }>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.texto}</div>
                  {msg.botoes && msg.botoes.length > 0 && (
                    <div className="botoes-container">
                      {msg.botoes.map((botao, idx) => (
                        <div key={idx} className="botao-preview">
                          <div className="botao-icon">
                            <FiMessageSquare size={14} />
                          </div>
                          <span>{botao.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview da mensagem personalizada */}
        {contatoSelecionado && input.includes('$') && (
          <div className="preview-personalizada">
            <div className="preview-titulo">Preview personalizado:</div>
            <div className="preview-texto">"{getPreviewMensagem()}"</div>
          </div>
        )}

        {/* Preview da imagem selecionada */}
        {imagemSelecionada && (
          <div className="preview-imagem">
            <img src={imagemSelecionada} alt="Preview" className="preview-thumb" />
            <div className="preview-info">
              <div className="preview-nome">{nomeArquivo}</div>
              <div className="preview-status">Pronto para enviar</div>
            </div>
            <button onClick={removerImagem} className="preview-remover" title="Remover imagem">
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Preview de botões quando estão sendo criados */}
        {botoesAcao.length > 0 && (
          <div className="preview-botoes">
            <div className="preview-titulo">
              Botões que serão enviados{imagemSelecionada ? ' (com imagem)' : ''}:
            </div>
            <div className="botoes-preview-list">
              {botoesAcao.map((botao, idx) => (
                <div key={idx} className="botao-preview-item">
                  <div className="botao-icon">
                    <FiMessageSquare size={12} />
                  </div>
                  <span>{botao.label || 'Sem texto'}</span>
                </div>
              ))}
            </div>
            <button onClick={limparBotoes} className="limpar-botoes-btn">
              Limpar botões
            </button>
          </div>
        )}

        <div className="input-area">
          {/* Botão de anexo */}
          <div style={{ position: 'relative' }}>
            <button
              className="clip-btn"
              onClick={() => setMenuClipOpen(!menuClipOpen)}
              title="Anexar arquivo"
            >
              <FiPaperclip size={20} />
            </button>
            
            {menuClipOpen && (
              <div className="clip-menu">
                <button
                  className="clip-menu-item"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setMenuClipOpen(false);
                  }}
                >
                  <MdPhotoLibrary size={18} />
                  <span>Anexar Foto</span>
                </button>
                <button
                  className="clip-menu-item"
                  onClick={() => {
                    setModalBotoes(true);
                    setMenuClipOpen(false);
                  }}
                >
                  <MdSmartButton size={18} />
                  <span>Criar Botões</span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Botão de variáveis */}
          <div style={{ position: 'relative' }}>
            <button
              className="variaveis-btn"
              onClick={() => setMostrarVariaveis(!mostrarVariaveis)}
              title="Inserir variáveis"
            >
              @
            </button>
            
            {mostrarVariaveis && (
              <div className="variaveis-menu">
                <div className="variaveis-titulo">Variáveis disponíveis:</div>
                <button
                  className="variavel-item"
                  onClick={() => inserirVariavel('$nome')}
                >
                  <span className="variavel-codigo">$nome</span>
                  <span className="variavel-desc">Nome completo do contato</span>
                </button>
                <button
                  className="variavel-item"
                  onClick={() => inserirVariavel('$primeiroNome')}
                >
                  <span className="variavel-codigo">$primeiroNome</span>
                  <span className="variavel-desc">Primeiro nome do contato</span>
                </button>
              </div>
            )}
          </div>

          {/* Input de texto */}
          <textarea
            className="text-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              botoesAcao.length > 0 
                ? "Texto da mensagem com botões..." 
                : imagemSelecionada 
                  ? "Legenda (opcional)..." 
                  : "Digite sua mensagem..."
            }
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !enviando) {
                e.preventDefault();
                if (botoesAcao.length > 0) {
                  contatoSelecionado ? enviarTextoComBotoesReal() : enviarTextoComBotoesSimulacao();
                } else if (imagemSelecionada) {
                  contatoSelecionado ? enviarImagemReal() : enviarImagemSimulacao();
                } else {
                  contatoSelecionado ? enviarTextoReal() : enviarTextoSimulacao();
                }
              }
            }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />

          {/* Botão de enviar */}
          {botoesAcao.length > 0 ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={enviarTextoComBotoesSimulacao}
                disabled={enviando || !input.trim()}
                className="btn-simular"
                title="Simular envio de mensagem com botões"
              >
                Simular
              </button>
              {contatoSelecionado && (
                <button
                  onClick={enviarTextoComBotoesReal}
                  disabled={enviando || !input.trim()}
                  className="btn-real"
                  title="Enviar mensagem com botões real"
                >
                  {enviando ? 'Enviando...' : 'Enviar WhatsApp'}
                </button>
              )}
            </div>
          ) : imagemSelecionada ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={enviarImagemSimulacao}
                disabled={enviando}
                className="btn-simular"
                title="Simular envio de imagem"
              >
                Simular
              </button>
              {contatoSelecionado && (
                <button
                  onClick={enviarImagemReal}
                  disabled={enviando}
                  className="btn-real"
                  title="Enviar imagem real"
                >
                  {enviando ? 'Enviando...' : 'Enviar WhatsApp'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={enviarTextoSimulacao}
                disabled={enviando || !input.trim()}
                className="btn-simular"
                title="Simular mensagem"
              >
                Simular
              </button>
              {contatoSelecionado && (
                <button
                  onClick={enviarTextoReal}
                  disabled={enviando || !input.trim()}
                  className="btn-real"
                  title="Enviar mensagem real"
                >
                  {enviando ? 'Enviando...' : 'Enviar WhatsApp'}
                </button>
              )}
            </div>
          )}
        </div>

        {feedback && (
          <div className="feedback">
            <span>{feedback}</span>
            <button 
              onClick={fecharFeedback}
              className="feedback-close"
              title="Fechar"
            >
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal de criação de botões */}
      {modalBotoes && (
        <div className="modal-overlay" onClick={() => setModalBotoes(false)}>
          <div className="modal-content modal-botoes" onClick={e => e.stopPropagation()}>
            <h3>Criar Botões de Ação</h3>
            <p style={{ color: '#bfc7d5', fontSize: '0.9rem', marginBottom: '16px' }}>
              Adicione quantos botões quiser à sua mensagem
            </p>
            
            <div className="botoes-editor">
              {botoesAcao.map((botao, index) => (
                <div key={index} className="botao-editor-item">
                  <div className="botao-header">
                    <span>Botão {index + 1}</span>
                    <button onClick={() => removerBotao(index)} className="btn-remover-botao">
                      <FiX size={16} />
                    </button>
                  </div>
                  
                  <div className="botao-fields">
                    <input
                      type="text"
                      value={botao.label}
                      onChange={e => atualizarBotao(index, 'label', e.target.value)}
                      placeholder="Texto do botão"
                      className="botao-input"
                    />
                  </div>
                </div>
              ))}
              
              <button onClick={adicionarBotao} className="btn-adicionar-botao">
                <FiPlus size={16} />
                Adicionar Botão
              </button>
            </div>

            {/* Mostrar preview da imagem se selecionada junto com botões */}
            {imagemSelecionada && (
              <div className="modal-image-preview">
                <div className="preview-titulo">Imagem selecionada:</div>
                <div className="preview-imagem-modal">
                  <img src={imagemSelecionada} alt="Preview" className="preview-thumb-modal" />
                  <div className="preview-info-modal">
                    <div className="preview-nome-modal">{nomeArquivo}</div>
                    <div className="preview-status-modal">Será enviada junto com os botões</div>
                  </div>
                  <button onClick={removerImagem} className="preview-remover-modal" title="Remover imagem">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={() => setModalBotoes(false)} className="btn-confirmar-botoes">
                Confirmar Botões
              </button>
              <button onClick={() => { limparBotoes(); setModalBotoes(false); }} className="btn-cancelar-botoes">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de contatos */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Selecionar Contato</h3>
            <input
              autoFocus
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou número..."
              className="busca-input"
            />
            <div className="contatos-lista">
              {contatosFiltrados.length === 0 ? (
                <div className="sem-contatos">Nenhum contato encontrado</div>
              ) : (
                contatosFiltrados.map(contato => (
                  <button
                    key={contato.id}
                    className="contato-item"
                    onClick={() => {
                      setContatoSelecionado(contato);
                      setModalOpen(false);
                      setBusca('');
                    }}
                  >
                    <div className="contato-nome">{contato.nome}</div>
                    <div className="contato-numero">{contato.numero}</div>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setModalOpen(false)} className="btn-fechar">
              Fechar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-bg {
          min-height: 100vh;
          background: #18181b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 20px;
          color: #fff;
        }

        .voltar-btn {
          background: #23232b;
          color: #7dd3fc;
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 24px;
          transition: background 0.2s;
        }

        .voltar-btn:hover {
          background: #2d2d38;
        }

        .limpar-btn {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .limpar-btn:hover {
          background: #dc2626;
        }

        .celular-sim {
          width: 600px;
          height: 750px;
          background: #222e35;
          border-radius: 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 4px solid #23232b;
          position: relative;
        }

        .celular-topo {
          background: #075e54;
          color: #fff;
          padding: 16px;
          text-align: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .contato-area {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #1e2328;
          border-bottom: 1px solid #23232b;
          flex-shrink: 0;
        }

        .contato-btn-topo {
          flex: 1;
          background: #23232b;
          color: #7dd3fc;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-height: 48px;
          justify-content: center;
        }

        .contato-btn-topo:hover {
          background: #2d2d38;
        }

        .contato-nome-selecionado {
          font-weight: 600;
          color: #fff;
          font-size: 1rem;
        }

        .contato-numero-selecionado {
          font-size: 0.85rem;
          color: #7dd3fc;
          font-weight: 400;
        }

        .remover-contato-btn-topo {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .remover-contato-btn-topo:hover {
          background: #dc2626;
        }

        .tela {
          flex: 1;
          background: #111b21;
          padding: 18px 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .msg-usuario {
          justify-self: flex-end;
          background: #005c4b;
          color: #fff;
          padding: 10px 16px;
          border-radius: 18px 18px 4px 18px;
          max-width: 75%;
          font-size: 1rem;
          word-break: break-word;
        }

        .msg-usuario-real {
          justify-self: flex-end;
          background: #2563eb;
          color: #fff;
          padding: 10px 16px;
          border-radius: 18px 18px 4px 18px;
          max-width: 75%;
          font-size: 1rem;
          word-break: break-word;
        }

        .msg-contato {
          align-self: flex-start;
          background: #202c33;
          color: #fff;
          padding: 10px 16px;
          border-radius: 18px 18px 18px 4px;
          max-width: 75%;
          font-size: 1rem;
          word-break: break-word;
        }

        .msg-usuario-imagem {
          justify-self: flex-end;
          background: #005c4b;
          padding: 8px;
          border-radius: 18px 18px 4px 18px;
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .msg-usuario-imagem-real {
          justify-self: flex-end;
          background: #2563eb;
          padding: 8px;
          border-radius: 18px 18px 4px 18px;
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .msg-contato-imagem {
          align-self: flex-start;
          background: #202c33;
          padding: 8px;
          border-radius: 18px 18px 18px 4px;
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .botoes-container {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .botao-preview {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.9rem;
          text-align: center;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .botao-preview-item {
          background: rgba(147, 51, 234, 0.2);
          border: 1px solid #9333ea;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 0.8rem;
          color: #fff;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .botao-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-imagem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #2d2d38;
          border-top: 1px solid #31313d;
          margin: 0 10px;
        }

        .preview-thumb {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #31313d;
        }

        .preview-info {
          flex: 1;
        }

        .preview-nome {
          font-size: 0.9rem;
          color: #7dd3fc;
          font-weight: 500;
        }

        .preview-status {
          font-size: 0.8rem;
          color: #22c55e;
        }

        .preview-remover {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-botoes {
          padding: 8px 12px;
          margin: 0 10px;
          background: #2d2d38;
          border: 1px solid #9333ea;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .modal-image-preview {
          margin: 16px 0;
          padding: 12px;
          background: #18181b;
          border-radius: 8px;
          border: 1px solid #31313d;
        }

        .preview-imagem-modal {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .preview-thumb-modal {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #31313d;
        }

        .preview-info-modal {
          flex: 1;
        }

        .preview-nome-modal {
          font-size: 0.9rem;
          color: #7dd3fc;
          font-weight: 500;
        }

        .preview-status-modal {
          font-size: 0.8rem;
          color: #22c55e;
        }

        .preview-remover-modal {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-area {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 10px;
          background: #232d35;
          border-top: 1px solid #23232b;
        }

        .clip-btn {
          background: none;
          border: none;
          color: #7dd3fc;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          position: relative;
        }

        .clip-btn:hover {
          background: #2d2d38;
        }

        .clip-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: #23232b;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          padding: 8px 0;
          margin-bottom: 8px;
          min-width: 120px;
          z-index: 10;
        }

        .clip-menu-item {
          background: none;
          border: none;
          color: #7dd3fc;
          padding: 8px 16px;
          width: max-content;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .clip-menu-item:hover {
          background: #2d2d38;
        }

        .text-input {
          flex: 1;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 10px 12px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          resize: none;
          min-height: 40px;
          max-height: 120px;
          overflow-y: auto;
          font-family: inherit;
          line-height: 1.4;
        }

        .text-input::placeholder {
          color: #71717a;
        }

        .btn-simular {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-simular:hover:not(:disabled) {
          background: #16a34a;
        }

        .btn-simular:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-real {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-real:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-real:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .feedback {
          padding: 8px 16px;
          margin: 0 10px 10px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          background: ${feedback?.includes('sucesso') ? '#16a34a' : '#ef4444'};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .feedback-close {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          opacity: 0.8;
        }

        .feedback-close:hover {
          background: rgba(255, 255, 255, 0.2);
          opacity: 1;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #23232b;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .modal-content h3 {
          color: #7dd3fc;
          margin-bottom: 16px;
          font-size: 1.2rem;
        }

        .busca-input {
          width: 100%;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 10px;
          color: #fff;
          font-size: 1rem;
          margin-bottom: 16px;
          outline: none;
        }

        .contatos-lista {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .contato-item {
          background: #18181b;
          border: none;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .contato-item:hover {
          background: #2d2d38;
        }

        .contato-nome {
          color: #fff;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .contato-numero {
          color: #7dd3fc;
          font-size: 0.9rem;
        }

        .sem-contatos {
          text-align: center;
          color: #71717a;
          padding: 24px;
        }

        .btn-fechar {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }

        .preview-personalizada {
          padding: 8px 12px;
          margin: 0 10px;
          background: #2d2d38;
          border: 1px solid #7dd3fc;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .preview-titulo {
          color: #7dd3fc;
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 0.8rem;
        }

        .preview-texto {
          color: #fff;
          font-style: italic;
        }

        .variaveis-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          min-width: 40px;
        }

        .variaveis-btn:hover {
          background: #6d28d9;
        }

        .variaveis-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: #23232b;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          padding: 8px 0;
          margin-bottom: 8px;
          min-width: 200px;
          z-index: 10;
          border: 1px solid #31313d;
        }

        .variaveis-titulo {
          color: #7dd3fc;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 12px 8px;
          border-bottom: 1px solid #31313d;
          margin-bottom: 4px;
        }

        .variavel-item {
          background: none;
          border: none;
          color: #fff;
          padding: 8px 12px;
          width: 100%;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: background 0.2s;
        }

        .variavel-item:hover {
          background: #2d2d38;
        }

        .variavel-codigo {
          color: #7c3aed;
          font-weight: 600;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .variavel-desc {
          color: #bfc7d5;
          font-size: 0.8rem;
        }

        .modal-botoes {
          min-width: 500px;
          max-width: 600px;
        }

        .botoes-editor {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .botao-editor-item {
          background: #18181b;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #31313d;
        }

        .botao-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          color: #7dd3fc;
          font-weight: 500;
        }

        .btn-remover-botao {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .botao-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .botao-select, .botao-input {
          background: #23232b;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px 10px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
        }

        .botao-select:focus, .botao-input:focus {
          border-color: #7dd3fc;
        }

        .btn-adicionar-botao {
          background: #9333ea;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-adicionar-botao:hover {
          background: #7c3aed;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-confirmar-botoes {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
        }

        .btn-cancelar-botoes {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default withZCampanhaAuth(SimuladorPage);
