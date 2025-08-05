import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import ContentEditable from 'react-contenteditable';
import exemploBotoes from '@/assets/fotos/zcampanha/exemplo-botoes.jpeg';
import { campanhaStyle } from './campanha-style';
import * as Icons from 'react-icons/fi';
import Erro from '@/components/Erro';
import Aviso from '@/components/Aviso';
import Confirmacao from '@/components/Confirmacao';
import { usePollingCampanha } from '@/hooks/usePollingCampanha';

// Tipos importados (mesmos do backend)
type StatusCampanha = 'rascunho' | 'agendada' | 'enviando' | 'pausada' | 'concluida' | 'cancelada';
type TipoMensagem = 'texto' | 'imagem' | 'botoes';

type ButtonAction = {
  id: string;
  type: 'CALL' | 'URL' | 'REPLY';
  label: string;
  phone?: string;
  url?: string;
};

type ConteudoMensagem = {
  tipo: TipoMensagem;
  texto?: string;
  imagem?: string;
  legenda?: string;
  botoes?: ButtonAction[];
  variacoes?: string[];
};

type ContatoSelecionado = {
  id: string;
  nome: string;
  numero: string;
};

type LogEnvio = {
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

type EstatisticasCampanha = {
  totalContatos: number;
  pendentes: number;
  enviados: number;
  sucessos: number;
  erros: number;
  percentualSucesso: number;
};

type Campanha = {
  id?: string;
  nome: string;
  descricao?: string;
  conteudo: ConteudoMensagem;
  contatos: ContatoSelecionado[];
  status: StatusCampanha;
  dataAgendamento?: number;
  dataCriacao: number;
  dataInicio?: number;
  dataConclusao?: number;
  criadoPor: string;
  estatisticas: EstatisticasCampanha;
  logs: LogEnvio[];
};

type Contato = { id: string; nome: string; numero: string };

const CampanhasPage = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };

  // Estados principais
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmacao, setConfirmacao] = useState<{
    mostrar: boolean;
    titulo: string;
    mensagem: string;
    onConfirmar: () => void;
    tipo?: 'warning' | 'danger' | 'info';
    textoConfirmar?: string;
  }>({
    mostrar: false,
    titulo: '',
    mensagem: '',
    onConfirmar: () => {}
  });

  // Estados para busca e paginação
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusCampanha | ''>('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  // Estados para modais
  const [modalCriar, setModalCriar] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState<Campanha | null>(null);
  const [modalContatos, setModalContatos] = useState(false);
  const [campanhaEmEdicao, setCampanhaEmEdicao] = useState<Campanha | null>(null);

  // Estados do formulário de criação expandidos
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>('texto');
  const [textoMensagem, setTextoMensagem] = useState('');
  const [imagemBase64, setImagemBase64] = useState('');
  const [legendaImagem, setLegendaImagem] = useState('');
  const [botoesAcao, setBotoesAcao] = useState<ButtonAction[]>([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<ContatoSelecionado[]>([]);

  // Estados para controle de envio
  const [enviandoCampanha, setEnviandoCampanha] = useState<string | null>(null);

  // Estados para o modal de contatos
  const [buscaContatos, setBuscaContatos] = useState('');

  // Estados para o modal de detalhes (logs)
  const [buscaLog, setBuscaLog] = useState('');
  const [filtroStatusLog, setFiltroStatusLog] = useState<'sucesso' | 'erro' | ''>('');

  // Estados para sistema de variáveis
  const [mostrarVariaveisTexto, setMostrarVariaveisTexto] = useState(false);
  const [mostrarVariaveisLegenda, setMostrarVariaveisLegenda] = useState(false);
  const [mostrarVariaveisBotoes, setMostrarVariaveisBotoes] = useState(false);

  // Remover WebSocket e usar Polling
  const { status: statusPolling, isPolling, startPolling, stopPolling } = usePollingCampanha((newStatus) => {
    // Callback quando status muda
    if (newStatus.status === 'concluida') {
      setAviso(`Campanha finalizada!\n\nSucessos: ${newStatus.estatisticas.sucessos}\nErros: ${newStatus.estatisticas.erros}\nTaxa de sucesso: ${newStatus.estatisticas.percentualSucesso.toFixed(1)}%`);
      fetchCampanhas(); // Recarregar lista
    } else if (newStatus.status === 'cancelada') {
      setErro('Campanha foi cancelada devido a um erro');
      fetchCampanhas(); // Recarregar lista
    }
  });

  // Estado para campanhas sendo acompanhadas (modificado para ter mais controle)
  const [campanhaAcompanhada, setCampanhaAcompanhada] = useState<string | null>(null);
  const [mostrarModalProgresso, setMostrarModalProgresso] = useState(false);

  // Validação do formulário para habilitar/desabilitar o botão de salvar
  const isFormValid = useMemo(() => {
    if (!nome.trim() || contatosSelecionados.length === 0) {
      return false;
    }

    switch (tipoMensagem) {
      case 'texto':
        return textoMensagem.trim() !== '';
      case 'imagem':
        return imagemBase64.trim() !== '';
      case 'botoes':
        return textoMensagem.trim() !== '' && botoesAcao.length > 0 && botoesAcao.every(b => b.label.trim() !== '');
      default:
        return false;
    }
  }, [nome, contatosSelecionados, tipoMensagem, textoMensagem, imagemBase64, botoesAcao]);

  // Lista de variáveis válidas
  const variaveisValidas = ['$nome', '$primeiroNome'];

  // Função genérica para inserir variável em um ContentEditable
  const inserirVariavel = (
    variavel: string, 
    elementId: string, 
    stateSetter: React.Dispatch<React.SetStateAction<string>>,
    closeMenu: () => void
  ) => {
    const editor = document.getElementById(elementId);
    if (!editor) return;

    editor.focus();

    // Usar a API de Seleção para inserir o texto na posição do cursor
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents(); // Remove o texto selecionado, se houver
      const node = document.createTextNode(variavel);
      range.insertNode(node);

      // Move o cursor para depois do texto inserido
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback se a seleção não for encontrada
      editor.innerHTML += variavel;
    }

    // Atualiza o estado do React com o novo conteúdo (removendo o HTML)
    stateSetter(editor.innerText);
    
    closeMenu();
  };

  // Buscar campanhas
  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas`);
      const data = await response.json();
      setCampanhas(data.campanhas || []);
    } catch (error) {
      setErro('Erro ao carregar campanhas');
    }
    setLoading(false);
  };

  // Buscar contatos
  const fetchContatos = async () => {
    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`);
      const data = await response.json();
      setContatos(data.contatos || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Adicionar estado para grupos
  const [grupos, setGrupos] = useState<Array<{
    id: string;
    nome: string;
    cor: string;
    totalContatos: number;
    contatos: string[];
  }>>([]);
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [modalGrupos, setModalGrupos] = useState(false);

  // Buscar grupos
  const fetchGrupos = async () => {
    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos`);
      const data = await response.json();
      setGrupos(data.grupos || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  useEffect(() => {
    if (cliente && idInstancia) {
      fetchCampanhas();
      fetchContatos();
      fetchGrupos(); // Adicionar chamada para buscar grupos
    }
  }, [cliente, idInstancia]);

  // Função para aplicar seleção de grupos
  const aplicarSelecaoGrupos = () => {
    const contatosDeGrupos = gruposSelecionados.flatMap(gId => {
      const grupo = grupos.find(g => g.id === gId);
      return grupo ? grupo.contatos : [];
    });

    // IDs de todos os contatos individuais e de grupos
    const idsUnicos = new Set([
      ...contatosSelecionados.map(c => c.id),
      ...contatosDeGrupos
    ]);

    const todosContatos = contatos.filter(contato => idsUnicos.has(contato.id));

    setContatosSelecionados(todosContatos);
    setModalGrupos(false);
  };

  useEffect(() => {
    if (cliente && idInstancia) {
      fetchCampanhas();
      fetchContatos();
    }
  }, [cliente, idInstancia]);

  // Filtrar campanhas
  const campanhasFiltradas = useMemo(() => {
    let resultado = campanhas;
    
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = resultado.filter(campanha => 
        campanha.nome.toLowerCase().includes(termoBusca) ||
        campanha.descricao?.toLowerCase().includes(termoBusca)
      );
    }
    
    if (filtroStatus) {
      resultado = resultado.filter(campanha => campanha.status === filtroStatus);
    }
    
    return resultado.sort((a, b) => b.dataCriacao - a.dataCriacao);
  }, [campanhas, busca, filtroStatus]);

  // Paginação
  const totalPaginas = Math.ceil(campanhasFiltradas.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const campanhasPaginadas = campanhasFiltradas.slice(indiceInicio, indiceInicio + itensPorPagina);

  // Função para lidar com upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagemBase64(result);
      setErro('');
    };
    reader.readAsDataURL(file);
  };

  // Função para adicionar botão
  const adicionarBotao = () => {
    if (botoesAcao.length >= 3) {
      setErro('Máximo de 3 botões permitidos.');
      return;
    }
    const novoBotao: ButtonAction = {
      id: (botoesAcao.length + 1).toString(),
      type: 'REPLY',
      label: ''
    };
    setBotoesAcao([...botoesAcao, novoBotao]);
  };

  // Função para remover botão
  const removerBotao = (index: number) => {
    setBotoesAcao(botoesAcao.filter((_, i) => i !== index));
  };

  // Função para atualizar botão
  const atualizarBotao = (index: number, campo: keyof ButtonAction, valor: string) => {
    const novosBotoes = [...botoesAcao];
    novosBotoes[index] = { ...novosBotoes[index], [campo]: valor };
    setBotoesAcao(novosBotoes);
  };

  // Criar ou atualizar campanha
  const salvarCampanha = async () => {
    if (!nome.trim() || contatosSelecionados.length === 0) {
      setErro('Nome e pelo menos um contato são obrigatórios');
      return;
    }

    // Validação por tipo de mensagem
    let conteudo: ConteudoMensagem;
    
    switch (tipoMensagem) {
      case 'texto':
        if (!textoMensagem.trim()) {
          setErro('Digite a mensagem de texto');
          return;
        }
        conteudo = { tipo: 'texto', texto: textoMensagem };
        break;
        
      case 'imagem':
        if (!imagemBase64) {
          setErro('Selecione uma imagem');
          return;
        }
        conteudo = { 
          tipo: 'imagem', 
          imagem: imagemBase64
        };
        // Adicionar legenda apenas se não estiver vazia
        if (legendaImagem.trim()) {
          conteudo.legenda = legendaImagem.trim();
        }
        break;
        
      case 'botoes':
        if (!textoMensagem.trim()) {
          setErro('Digite a mensagem para os botões');
          return;
        }
        if (botoesAcao.length === 0) {
          setErro('Adicione pelo menos um botão');
          return;
        }
        // Validar botões
        for (const botao of botoesAcao) {
          if (!botao.label.trim()) {
            setErro('Todos os botões devem ter um texto');
            return;
          }
          if (botao.type === 'CALL' && !botao.phone?.trim()) {
            setErro('Botões de ligação devem ter um número de telefone');
            return;
          }
          if (botao.type === 'URL' && !botao.url?.trim()) {
            setErro('Botões de link devem ter uma URL');
            return;
          }
        }
        conteudo = { 
          tipo: 'botoes', 
          texto: textoMensagem,
          botoes: botoesAcao
        };
        break;
        
      default:
        setErro('Tipo de mensagem inválido');
        return;
    }

    // Construir objeto da campanha
    const dadosCampanha: any = {
      id: campanhaEmEdicao?.id, // Inclui o ID se estiver editando
      nome,
      conteudo,
      contatos: contatosSelecionados,
      criadoPor: 'usuário'
    };

    // Adicionar descrição apenas se não estiver vazia
    if (descricao.trim()) {
      dadosCampanha.descricao = descricao;
    }

    const isEditing = !!campanhaEmEdicao;
    const url = `/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCampanha)
      });

      if (response.ok) {
        fecharModalCriar();
        fetchCampanhas();
        setErro('');
      } else {
        const data = await response.json();
        setErro(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} campanha`);
      }
    } catch (error) {
      setErro(`Erro de conexão ao ${isEditing ? 'atualizar' : 'criar'} campanha`);
    }
  };

  // Limpar formulário atualizado
  const limparFormulario = () => {
    setNome('');
    setDescricao('');
    setTipoMensagem('texto');
    setTextoMensagem('');
    setImagemBase64('');
    setLegendaImagem('');
    setBotoesAcao([]);
    setContatosSelecionados([]);
    setGruposSelecionados([]); // CORREÇÃO: Limpar grupos selecionados
    setCampanhaEmEdicao(null); // Limpa o estado de edição
    setErro('');
  };

  // Deletar campanha - também usar componente de confirmação
  const deletarCampanha = async (id: string) => {
    setConfirmacao({
      mostrar: true,
      titulo: 'Deletar Campanha',
      mensagem: 'Tem certeza que deseja deletar esta campanha?\n\nEsta ação não pode ser desfeita.',
      tipo: 'danger',
      textoConfirmar: 'Deletar',
      onConfirmar: () => {
        setConfirmacao(prev => ({ ...prev, mostrar: false }));
        executarDelecaoCampanha(id);
      }
    });
  };

  const executarDelecaoCampanha = async (id: string) => {
    try {
      await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchCampanhas();
    } catch (error) {
      setErro('Erro ao deletar campanha');
    }
  };

  // Iniciar edição da campanha
  const iniciarEdicao = (campanha: Campanha) => {
    setCampanhaEmEdicao(campanha);
    setNome(campanha.nome);
    setDescricao(campanha.descricao || '');
    setTipoMensagem(campanha.conteudo.tipo);
    setTextoMensagem(campanha.conteudo.texto || '');
    setImagemBase64(campanha.conteudo.imagem || '');
    setLegendaImagem(campanha.conteudo.legenda || '');
    setBotoesAcao(campanha.conteudo.botoes || []);
    setContatosSelecionados(campanha.contatos);
    setGruposSelecionados([]); // CORREÇÃO: Garantir que grupos começam vazios na edição
    setModalCriar(true);
  };

  // CORREÇÃO: Função para abrir modal de criar campanha
  const abrirModalCriar = () => {
    limparFormulario(); // Garantir que tudo esteja limpo
    setModalCriar(true);
  };

  // CORREÇÃO: Função para fechar modal e limpar tudo
  const fecharModalCriar = () => {
    setModalCriar(false);
    limparFormulario();
  };

  // Iniciar envio da campanha - VERSÃO COM COMPONENTE DE CONFIRMAÇÃO
  const iniciarEnvioCampanha = async (campanhaId: string) => {
    setConfirmacao({
      mostrar: true,
      titulo: 'Iniciar Envio da Campanha',
      mensagem: 'Tem certeza que deseja iniciar o envio desta campanha?\n\nO processo será executado automaticamente no servidor e pode levar alguns minutos para ser concluído.',
      tipo: 'warning',
      textoConfirmar: 'Iniciar Envio',
      onConfirmar: () => {
        setConfirmacao(prev => ({ ...prev, mostrar: false }));
        executarEnvioCampanha(campanhaId);
      }
    });
  };

  const executarEnvioCampanha = async (campanhaId: string) => {
    setEnviandoCampanha(campanhaId);
    setErro('');

    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas/${campanhaId}/iniciar-envio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setErro(''); // Limpar qualquer erro anterior
        
        // Atualizar a campanha na lista local
        setCampanhas(prev => prev.map(campanha => 
          campanha.id === campanhaId 
            ? { ...campanha, status: 'enviando' as StatusCampanha, dataInicio: Date.now() }
            : campanha
        ));

        // Iniciar acompanhamento via polling
        startPolling(campanhaId, cliente, idInstancia);
        setCampanhaAcompanhada(campanhaId);
        setMostrarModalProgresso(true); // Mostrar modal automaticamente

        // Mostrar feedback de sucesso
        setAviso(`Envio iniciado com sucesso!\n\nTotal: ${data.totalContatos} contatos\nLotes: ${data.totalLotes}\n\nVocê pode acompanhar o progresso em tempo real.`);
        
      } else {
        setErro(data.error || 'Erro ao iniciar envio da campanha');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão ao iniciar envio da campanha';
      setErro(errorMessage);
      console.error('Erro ao iniciar envio:', error);
    } finally {
      setEnviandoCampanha(null);
    }
  };

  // Função para ver detalhes da campanha (modificada para detectar campanhas em envio)
  const verDetalhesCampanha = (campanha: Campanha) => {
    // Se a campanha estiver sendo enviada, mostrar o progresso ao invés dos detalhes normais
    if (campanha.status === 'enviando') {
      // Definir qual campanha está sendo acompanhada
      setCampanhaAcompanhada(campanha.id!);
      
      // Iniciar polling se não estiver ativo ou for campanha diferente
      if (!isPolling || statusPolling?.id !== campanha.id) {
        startPolling(campanha.id!, cliente, idInstancia);
      }
      
      // Mostrar modal de progresso
      setMostrarModalProgresso(true);
      
      return;
    }
    
    // Para campanhas com outros status, abrir modal de detalhes normal
    setModalDetalhes(campanha);
  };

  // Função para formatar data
  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Função para obter cor do status
  const getCorStatus = (status: StatusCampanha) => {
    switch (status) {
      case 'rascunho': return '#6b7280';
      case 'agendada': return '#f59e0b';
      case 'enviando': return '#3b82f6';
      case 'pausada': return '#ef4444';
      case 'concluida': return '#10b981';
      case 'cancelada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Função para traduzir status
  const traduzirStatus = (status: StatusCampanha) => {
    switch (status) {
      case 'rascunho': return 'Rascunho';
      case 'agendada': return 'Agendada';
      case 'enviando': return 'Enviando';
      case 'pausada': return 'Pausada';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  // Filtrar e ordenar contatos no modal
  const contatosFiltradosOrdenados = useMemo(() => {
    let resultado = [...contatos];
    
    // Filtrar por busca se houver termo
    if (buscaContatos.trim()) {
      const termoBusca = buscaContatos.toLowerCase().trim();
      resultado = resultado.filter(contato => 
        contato.nome.toLowerCase().includes(termoBusca) ||
        contato.numero.includes(termoBusca)
      );
    }
    
    // Ordenar alfabeticamente por nome
    return resultado.sort((a, b) => 
      a.nome.toLowerCase().localeCompare(b.nome.toLowerCase())
    );
  }, [contatos, buscaContatos]);

  // Verificar se todos os contatos filtrados estão selecionados
  const todosSelecionados = useMemo(() => {
    if (contatosFiltradosOrdenados.length === 0) return false;
    return contatosFiltradosOrdenados.every(contato => 
      contatosSelecionados.some(selecionado => selecionado.id === contato.id)
    );
  }, [contatosFiltradosOrdenados, contatosSelecionados]);

  // Verificar se alguns contatos filtrados estão selecionados
  const algunsSelecionados = useMemo(() => {
    return contatosFiltradosOrdenados.some(contato => 
      contatosSelecionados.some(selecionado => selecionado.id === contato.id)
    );
  }, [contatosFiltradosOrdenados, contatosSelecionados]);

  // Função para marcar/desmarcar todos os contatos filtrados
  const toggleTodosContatos = () => {
    if (todosSelecionados) {
      // Desmarcar todos os contatos filtrados
      const idsParaRemover = new Set(contatosFiltradosOrdenados.map(c => c.id));
      setContatosSelecionados(prev => 
        prev.filter(contato => !idsParaRemover.has(contato.id))
      );
    } else {
      // Marcar todos os contatos filtrados que ainda não estão selecionados
      const novosContatos = contatosFiltradosOrdenados.filter(contato =>
        !contatosSelecionados.some(selecionado => selecionado.id === contato.id)
      );
      setContatosSelecionados(prev => [...prev, ...novosContatos]);
    }
  };

  // Função para limpar busca quando modal for fechado
  const fecharModalContatos = () => {
    setModalContatos(false);
    setBuscaContatos('');
  };

  // Função para inserir variável no campo de texto principal
  const inserirVariavelTexto = (variavel: string) => {
    inserirVariavel(variavel, 'texto-mensagem', setTextoMensagem, () => setMostrarVariaveisTexto(false));
  };

  // Função para inserir variável no campo de legenda
  const inserirVariavelLegenda = (variavel: string) => {
    inserirVariavel(variavel, 'legenda-imagem', setLegendaImagem, () => setMostrarVariaveisLegenda(false));
  };

  // Função para inserir variável no campo de botões
  const inserirVariavelBotoes = (variavel: string) => {
    inserirVariavel(variavel, 'texto-botoes', setTextoMensagem, () => setMostrarVariaveisBotoes(false));
  };

  // Função para renderizar texto com variáveis destacadas como string HTML
  const renderizarTextoComVariaveis = (texto: string) => {
    if (!texto) return '';
    
    // Escapar HTML para segurança e substituir quebras de linha por <br>
    const textoSeguro = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');

    // Regex para encontrar palavras que parecem variáveis (começam com $)
    const regexVariaveis = /(\$[a-zA-Z0-9_]+)/g;
    
    return textoSeguro.replace(regexVariaveis, (match) => {
      if (variaveisValidas.includes(match)) {
        // Variável válida: aplica o estilo de destaque
        return `<span class="variavel-destacada">${match}</span>`;
      } else {
        // Variável inválida: aplica o estilo de erro
        return `<span class="variavel-invalida">${match}</span>`;
      }
    });
  };

  // Componente de menu de variáveis reutilizável
  const MenuVariaveis = ({ mostrar, onInserir, onFechar }: { 
    mostrar: boolean, 
    onInserir: (variavel: string) => void,
    onFechar: () => void 
  }) => {
    if (!mostrar) return null;
    
    return (
      <div className="variaveis-menu">
        <div className="variaveis-header">
          <span className="variaveis-titulo">Inserir Variável</span>
          <span className="variaveis-subtitulo">Clique para adicionar</span>
        </div>
        <div className="variaveis-lista">
          <button
            type="button"
            className="variavel-item"
            onClick={() => onInserir('$nome')}
          >
            <div className="variavel-preview">
              <span className="variavel-tag">$nome</span>
              <span className="variavel-exemplo">João Silva</span>
            </div>
            <span className="variavel-desc">Nome completo do contato</span>
          </button>
          <button
            type="button"
            className="variavel-item"
            onClick={() => onInserir('$primeiroNome')}
          >
            <div className="variavel-preview">
              <span className="variavel-tag">$primeiroNome</span>
              <span className="variavel-exemplo">João</span>
            </div>
            <span className="variavel-desc">Primeiro nome do contato</span>
          </button>
        </div>
        <div className="variaveis-overlay" onClick={onFechar}></div>
      </div>
    );
  };

  // Filtrar logs no modal de detalhes
  const logsFiltrados = useMemo(() => {
    if (!modalDetalhes || !modalDetalhes.logs) return [];

    let resultado = modalDetalhes.logs;

    if (filtroStatusLog) {
      resultado = resultado.filter(log => log.status === filtroStatusLog);
    }

    if (buscaLog.trim()) {
      const termoBusca = buscaLog.toLowerCase().trim();
      resultado = resultado.filter(log => 
        log.nomeContato.toLowerCase().includes(termoBusca) ||
        log.numeroContato.includes(termoBusca)
      );
    }

    return resultado;
  }, [modalDetalhes, buscaLog, filtroStatusLog]);

  // Função para fechar o modal de progresso
  const fecharModalProgresso = () => {
    setMostrarModalProgresso(false);
    // NÃO parar o polling nem limpar campanhaAcompanhada
    // Apenas fechar o modal, o processo continua em background
  };

  // Função para parar completamente o acompanhamento
  const pararAcompanhamento = () => {
    stopPolling();
    setCampanhaAcompanhada(null);
    setMostrarModalProgresso(false);
  };

  // Componente de progresso simplificado (atualizado)
  const ProgressoEnvio = () => {
    // Só mostrar se o modal estiver explicitamente aberto E houver campanha acompanhada
    if (!mostrarModalProgresso || !campanhaAcompanhada) {
      return null;
    }

    // Buscar dados da campanha atual
    const campanhaAtual = campanhas.find(c => c.id === campanhaAcompanhada);
    if (!campanhaAtual) {
      return null;
    }

    // Calcular progresso
    let percentual = 0;
    let dadosProgresso: any = null;

    if (campanhaAtual.estatisticas.totalContatos > 0) {
      percentual = (campanhaAtual.estatisticas.enviados / campanhaAtual.estatisticas.totalContatos) * 100;
    }

    // Se tem polling ativo, usar dados do polling
    if (statusPolling && statusPolling.id === campanhaAcompanhada) {
      percentual = statusPolling.estatisticas.totalContatos > 0 
        ? (statusPolling.estatisticas.enviados / statusPolling.estatisticas.totalContatos) * 100 
        : 0;
      dadosProgresso = statusPolling;
    } else {
      // Usar dados da campanha local
      dadosProgresso = {
        id: campanhaAtual.id,
        status: campanhaAtual.status,
        estatisticas: campanhaAtual.estatisticas,
        ultimaAtualizacao: Date.now()
      };
    }

    // Verificação de segurança adicional
    if (!dadosProgresso) {
      return null;
    }

    return (
      <div className="progresso-envio-overlay">
        <div className="progresso-envio-modal">
          <div className="progresso-header">
            <h3>Acompanhando Envio da Campanha</h3>
            <div className="status-conexao">
              <div className={`conexao-indicator ${isPolling && statusPolling?.id === campanhaAcompanhada ? 'conectado' : 'carregando'}`}></div>
              <span>
                {isPolling && statusPolling?.id === campanhaAcompanhada ? 'Monitorando ao vivo' : 'Dados locais'}
              </span>
            </div>
          </div>

          <div className="progresso-content">
            <div className="progresso-barra-container">
              <div className="progresso-barra">
                <div 
                  className="progresso-preenchimento"
                  style={{ width: `${percentual}%` }}
                ></div>
              </div>
              <span className="progresso-texto">
                {percentual.toFixed(1)}%
              </span>
            </div>

            <div className="progresso-stats">
              <div className="stat">
                <span className="stat-label">Status:</span>
                <span className="stat-value">{traduzirStatus(dadosProgresso.status)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{dadosProgresso.estatisticas.totalContatos}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Enviados:</span>
                <span className="stat-value">{dadosProgresso.estatisticas.enviados}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Sucessos:</span>
                <span className="stat-value" style={{ color: 'green' }}>{dadosProgresso.estatisticas.sucessos}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Erros:</span>
                <span className="stat-value" style={{ color: 'red' }}>{dadosProgresso.estatisticas.erros}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Taxa de Sucesso:</span>
                <span className="stat-value">{dadosProgresso.estatisticas.percentualSucesso.toFixed(1)}%</span>
              </div>
            </div>

            {/* Status visual baseado na situação */}
            {dadosProgresso.status === 'enviando' && (
              <div className="status-info">
                <div className="loading-spinner-small"></div>
                <span>
                  {isPolling && statusPolling?.id === campanhaAcompanhada 
                    ? 'Atualizando em tempo real...' 
                    : 'Processo ativo - Dados atualizados via polling'
                  }
                </span>
              </div>
            )}

            {dadosProgresso.status === 'concluida' && (
              <div className="status-info concluida">
                <Icons.FiCheck size={16} />
                <span>Campanha finalizada com sucesso!</span>
              </div>
            )}

            <div className="info-atualizacao">
              <small>
                Última atualização: {new Date(dadosProgresso.ultimaAtualizacao || Date.now()).toLocaleTimeString('pt-BR')}
              </small>
            </div>
          </div>

          <div className="progresso-actions">
            <button 
              onClick={fecharModalProgresso}
              className="btn-fechar-progresso"
            >
              Fechar (continua em background)
            </button>
            
            {dadosProgresso.status === 'concluida' && (
              <button 
                onClick={pararAcompanhamento}
                className="btn-parar-acompanhamento"
              >
                Parar Acompanhamento
              </button>
            )}
          </div>
        </div>

        <style jsx>{campanhaStyle}</style>
      </div>
    );
  };

  // Renderizar seção de seleção de contatos e grupos (reformulado)
  const renderizarSelecaoContatos = () => {
    const contatosDeGrupos = gruposSelecionados.flatMap(gId => {
      const grupo = grupos.find(g => g.id === gId);
      return grupo ? grupo.contatos : [];
    });

    // IDs de todos os contatos individuais e de grupos
    const idsUnicos = new Set([
      ...contatosSelecionados.map(c => c.id),
      ...contatosDeGrupos
    ]);

    const totalGeral = idsUnicos.size;

    return (
      <div className="form-group">
        <label>Destinatários da Campanha ({totalGeral})<span className="required-asterisk">*</span></label>
        
        {/* Container principal de seleção */}
        <div className="destinatarios-container">
          {/* Card de Contatos Individuais */}
          <div className="destinatario-card">
            <div className="card-header">
            <div className="card-icon individual">
              <Icons.FiUser size={20} />
            </div>
              <div className="card-info">
                <h4>Contatos Individuais</h4>
                <span className="card-count">{contatosSelecionados.length} selecionados</span>
              </div>
            </div>
            
            <div className="card-content">
              {contatosSelecionados.length > 0 ? (
                <div className="preview-contatos">
                  {contatosSelecionados.slice(0, 3).map(contato => (
                    <div key={contato.id} className="contato-preview">
                      <div className="contato-avatar">
                        {contato.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="contato-nome-preview">{contato.nome}</span>
                    </div>
                  ))}
                  {contatosSelecionados.length > 3 && (
                    <div className="contato-preview mais">
                      <div className="contato-avatar">+{contatosSelecionados.length - 3}</div>
                      <span className="contato-nome-preview">mais</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <span>Nenhum contato selecionado</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalContatos(true)}
              className="card-action-btn individual"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              {contatosSelecionados.length > 0 ? 'Gerenciar Contatos' : 'Selecionar Contatos'}
            </button>
          </div>

          {/* Card de Grupos */}
          <div className="destinatario-card">
            <div className="card-header">
            <div className="card-icon grupos">
              <Icons.FiUsers size={20} />
            </div>
              <div className="card-info">
                <h4>Grupos</h4>
                <span className="card-count">{gruposSelecionados.length} grupos • {contatosDeGrupos.length} contatos</span>
              </div>
            </div>

            <div className="card-content">
              {gruposSelecionados.length > 0 ? (
                <div className="preview-grupos">
                  {gruposSelecionados.slice(0, 2).map(grupoId => {
                    const grupo = grupos.find(g => g.id === grupoId);
                    return grupo ? (
                      <div key={grupo.id} className="grupo-preview">
                        <div 
                          className="grupo-badge" 
                          style={{ backgroundColor: grupo.cor }}
                        >
                          <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <div className="grupo-info-preview">
                          <span className="grupo-nome-preview">{grupo.nome} </span>
                          <span className="grupo-total-preview">({grupo.totalContatos} contatos)</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {gruposSelecionados.length > 2 && (
                    <div className="grupo-preview mais">
                      <div className="grupo-badge mais-badge">
                        +{gruposSelecionados.length - 2}
                      </div>
                      <div className="grupo-info-preview">
                        <span className="grupo-nome-preview">mais grupos</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <span>Nenhum grupo selecionado</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalGrupos(true)}
              className="card-action-btn grupos"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              {gruposSelecionados.length > 0 ? 'Gerenciar Grupos' : 'Selecionar Grupos'}
            </button>
          </div>
        </div>

        {/* Resumo Total */}
        {totalGeral > 0 && (
          <div className="resumo-destinatarios">
            <div className="resumo-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="resumo-text">
              <strong>Total: {totalGeral} destinatários </strong>
              <span>
                {contatosSelecionados.length > 0 && `${contatosSelecionados.length} contatos individuais`}
                {contatosSelecionados.length > 0 && gruposSelecionados.length > 0 && ' + '}
                {gruposSelecionados.length > 0 && `${gruposSelecionados.length} grupos (${contatosDeGrupos.length} contatos)`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="campanhas-bg">
      <Erro mensagem={erro} onClose={() => setErro('')} />
      <Aviso mensagem={aviso} onClose={() => setAviso('')} />
      
      {confirmacao.mostrar && (
        <Confirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          onConfirmar={confirmacao.onConfirmar}
          onCancelar={() => setConfirmacao(prev => ({ ...prev, mostrar: false }))}
          tipo={confirmacao.tipo}
          textoConfirmar={confirmacao.textoConfirmar}
        />
      )}

      <button className="voltar-btn" onClick={() => router.push(`/zcampanha/${cliente}/instancias/${idInstancia}`)}>
        &larr; Voltar
      </button>
      
      <div className="campanhas-container">
        <div className="header-container">
          <h2>Campanhas de Envio</h2>
          <button 
            onClick={abrirModalCriar}
            className="btn-criar-campanha"
          >
            <Icons.FiPlus size={18} />
            Nova Campanha
          </button>
        </div>

        {/* Controles de busca e filtro */}
        <div className="controles-container">
          <div className="busca-container">
            <Icons.FiSearch className="busca-icon" />
            <input
              type="text"
              placeholder="Buscar campanhas..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="busca-input"
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value as StatusCampanha | '')}
            className="filtro-status"
          >
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            {/* <option value="agendada">Agendada</option> */}
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Lista de campanhas */}
        {loading ? (
          <div className="status-message loading">Carregando campanhas...</div>
        ) : erro ? (
          <div className="status-message error">{erro}</div>
        ) : campanhasFiltradas.length === 0 ? (
          <div className="status-message empty">
            {busca || filtroStatus ? 'Nenhuma campanha encontrada com os filtros aplicados' : 'Nenhuma campanha criada ainda. Crie sua primeira campanha!'}
          </div>
        ) : (
          <>
            <div className="campanhas-grid">
              {campanhasPaginadas.map(campanhaItem => (
                <div key={campanhaItem.id} className="campanha-card">
                  <div className="campanha-header">
                    <h3>{campanhaItem.nome}</h3>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getCorStatus(campanhaItem.status) }}
                    >
                      {traduzirStatus(campanhaItem.status)}
                    </div>
                  </div>
                  
                  {campanhaItem.descricao && (
                    <p className="campanha-descricao">{campanhaItem.descricao}</p>
                  )}
                  
                  <div className="campanha-stats">
                    <div className="stat-item">
                      <Icons.FiUsers size={16} />
                      <span>{campanhaItem.estatisticas.totalContatos} contatos</span>
                    </div>
                    <div className="stat-item">
                      <Icons.FiCheck size={16} style={{ color: "green" }}/>
                      <span>{campanhaItem.estatisticas.sucessos} sucessos</span>
                    </div>
                    <div className="stat-item">
                      <Icons.FiX size={16} style={{ color: "red" }}/>
                      <span>{campanhaItem.estatisticas.erros} erros</span>
                    </div>
                  </div>
                  
                  <div className="campanha-info">
                    <small>Criada em: {formatarData(campanhaItem.dataCriacao)}</small>
                    {campanhaItem.dataInicio && (
                      <small>Iniciada em: {formatarData(campanhaItem.dataInicio)}</small>
                    )}
                  </div>
                  
                  <div className="campanha-actions">
                    <button
                      onClick={() => verDetalhesCampanha(campanhaItem)}
                      className="btn-acao ver"
                      title={campanhaItem.status === 'enviando' ? 'Acompanhar progresso' : 'Ver detalhes'}
                    >
                      <Icons.FiEye size={16} />
                    </button>
                    
                    {campanhaItem.status === 'rascunho' && (
                      <button
                        onClick={() => iniciarEdicao(campanhaItem)}
                        className="btn-acao editar"
                        title="Editar campanha"
                      >
                        <Icons.FiEdit2 size={16} />
                      </button>
                    )}
                    
                    {['rascunho', 'pausada'].includes(campanhaItem.status) && (
                      <button
                        onClick={() => iniciarEnvioCampanha(campanhaItem.id!)}
                        disabled={enviandoCampanha === campanhaItem.id}
                        className="btn-acao iniciar"
                        title="Iniciar campanha"
                      >
                        {enviandoCampanha === campanhaItem.id ? (
                          <div className="loading-spinner" />
                        ) : (
                          <Icons.FiPlay size={16} />
                        )}
                      </button>
                    )}
                    
                    {campanhaItem.status === 'enviando' && (
                      <button
                        className="btn-acao pausar"
                        title="Pausar campanha"
                      >
                        <Icons.FiPause size={16} />
                      </button>
                    )}
                    
                    {['rascunho', 'pausada', 'cancelada'].includes(campanhaItem.status) && (
                      <button
                        onClick={() => deletarCampanha(campanhaItem.id!)}
                        className="btn-acao deletar"
                        title="Deletar campanha"
                      >
                        <Icons.FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="paginacao">
                <button
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="btn-pagina"
                >
                  <Icons.FiChevronLeft size={16} />
                  Anterior
                </button>
                
                <span className="info-pagina">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="btn-pagina"
                >
                  Próximo
                  <Icons.FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de criar/editar campanha */}
      {modalCriar && (
        <div className="modal-overlay" onClick={fecharModalCriar}>
          <div className="modal-content modal-criar" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{campanhaEmEdicao ? 'Editar Campanha' : 'Nova Campanha'}</h3>
              <button onClick={fecharModalCriar} className="btn-fechar-modal">
                <Icons.FiX size={20} />
              </button>
            </div>
            
            <div className="form-campanha">
              <div className="form-group">
                <label>Nome da Campanha<span className="required-asterisk">*</span></label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Promoção Black Friday"
                  className="form-input"
                />
              </div>

              {/* Seletor de tipo de mensagem */}
              <div className="form-group">
                <label>Tipo de Mensagem<span className="required-asterisk">*</span></label>
                <div className="tipo-mensagem-selector">
                  <button
                    type="button"
                    className={`tipo-btn ${tipoMensagem === 'texto' ? 'ativo' : ''}`}
                    onClick={() => setTipoMensagem('texto')}
                  >
                    <Icons.FiFileText size={18} />
                    <span>Texto</span>
                  </button>
                  <button
                    type="button"
                    className={`tipo-btn ${tipoMensagem === 'imagem' ? 'ativo' : ''}`}
                    onClick={() => setTipoMensagem('imagem')}
                  >
                    <Icons.FiImage size={18} />
                    <span>Imagem</span>
                  </button>
                  <button
                    type="button"
                    className={`tipo-btn ${tipoMensagem === 'botoes' ? 'ativo' : ''}`}
                    onClick={() => setTipoMensagem('botoes')}
                  >
                    <Icons.FiMessageSquare size={18} />
                    <span>Botões</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo baseado no tipo */}
              {tipoMensagem === 'texto' && (
                <div className="form-group">
                  <label>Mensagem de Texto<span className="required-asterisk">*</span></label>
                  <div className="input-with-variables">
                    <ContentEditable
                      id="texto-mensagem"
                      className="form-textarea editor-highlight"
                      html={renderizarTextoComVariaveis(textoMensagem)}
                      onChange={e => setTextoMensagem(e.target.value.replace(/<[^>]*>?/gm, ''))}
                      placeholder="Digite a mensagem que será enviada..."
                    />
                    <div className="variables-button-container">
                      <button
                        type="button"
                        className="variaveis-btn"
                        onClick={() => setMostrarVariaveisTexto(!mostrarVariaveisTexto)}
                        title="Inserir variáveis"
                      >
                        <span className="variaveis-btn-icon">@</span>
                      </button>
                      <MenuVariaveis 
                        mostrar={mostrarVariaveisTexto}
                        onInserir={inserirVariavelTexto}
                        onFechar={() => setMostrarVariaveisTexto(false)}
                      />
                    </div>
                  </div>
                  <small className="form-hint">
                    Use variáveis: $nome, $primeiroNome
                  </small>
                </div>
              )}

              {tipoMensagem === 'imagem' && (
                <>
                  <div className="form-group">
                    <label>Imagem<span className="required-asterisk">*</span></label>
                    {!imagemBase64 ? (
                      <div className="image-selector">
                        <label htmlFor="image-upload" className="image-upload-btn">
                          <Icons.FiImage size={32} className="upload-icon" />
                          <div className="upload-text">
                            <span className="upload-title">Clique para selecionar uma imagem</span>
                            <span className="upload-subtitle">JPG, PNG, GIF até 10MB</span>
                          </div>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file-input-hidden"
                          id="image-upload"
                        />
                      </div>
                    ) : (
                      <div className="image-preview-container">
                        <div className="image-preview">
                          <img src={imagemBase64} alt="Preview" className="preview-img" />
                          <button
                            type="button"
                            onClick={() => setImagemBase64('')}
                            className="remove-image-btn"
                            title="Remover imagem"
                          >
                            <Icons.FiX size={16} />
                          </button>
                        </div>
                        <div className="image-actions">
                          <label htmlFor="image-upload" className="change-image-btn">
                            <Icons.FiImage size={16} />
                            Trocar imagem
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file-input-hidden"
                            id="image-upload"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Legenda (opcional)</label>
                    <div className="input-with-variables">
                       <ContentEditable
                        id="legenda-imagem"
                        className="form-textarea editor-highlight"
                        html={renderizarTextoComVariaveis(legendaImagem)}
                        onChange={e => setLegendaImagem(e.target.value.replace(/<[^>]*>?/gm, ''))}
                        placeholder="Legenda da imagem..."
                      />
                      <div className="variables-button-container">
                        <button
                          type="button"
                          className="variaveis-btn"
                          onClick={() => setMostrarVariaveisLegenda(!mostrarVariaveisLegenda)}
                          title="Inserir variáveis"
                        >
                          @
                        </button>
                        <MenuVariaveis 
                          mostrar={mostrarVariaveisLegenda}
                          onInserir={inserirVariavelLegenda}
                          onFechar={() => setMostrarVariaveisLegenda(false)}
                        />
                      </div>
                    </div>
                    <small className="form-hint">
                      Use variáveis: $nome, $primeiroNome
                    </small>
                  </div>
                </>
              )}

              {tipoMensagem === 'botoes' && (
                <>
                  <div className="form-group">
                    <label>Mensagem de Texto<span className="required-asterisk">*</span></label>
                    <div className="input-with-variables">
                      <ContentEditable
                        id="texto-botoes"
                        className="form-textarea editor-highlight"
                        html={renderizarTextoComVariaveis(textoMensagem)}
                        onChange={e => setTextoMensagem(e.target.value.replace(/<[^>]*>?/gm, ''))}
                        placeholder="Digite a mensagem que acompanha os botões..."
                      />
                      <div className="variables-button-container">
                        <button
                          type="button"
                          className="variaveis-btn"
                          onClick={() => setMostrarVariaveisBotoes(!mostrarVariaveisBotoes)}
                          title="Inserir variáveis"
                        >
                          @
                        </button>
                        <MenuVariaveis 
                          mostrar={mostrarVariaveisBotoes}
                          onInserir={inserirVariavelBotoes}
                          onFechar={() => setMostrarVariaveisBotoes(false)}
                        />
                      </div>
                    </div>
                    <small className="form-hint">
                      Use variáveis: $nome, $primeiroNome
                    </small>
                  </div>

                  {/* Seção de exemplos de botões */}
                  <div className="form-group">

                    {/* Imagem de exemplo */}
                    <div className="exemplo-imagem-container">
                      <div className="exemplo-imagem-header">
                        <span>📱 Exemplo de como aparece cada um no WhatsApp:</span>
                      </div>
                      <div className="exemplo-imagem-wrapper">
                        <img 
                          src={exemploBotoes.src} 
                          alt="Exemplo de botões no WhatsApp"
                          className="exemplo-imagem"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Botões de Ação (máximo 3)<span className="required-asterisk">*</span></label>
                    <div className="botoes-editor">
                      {botoesAcao.map((botao, index) => (
                        <div key={index} className="botao-item">
                          <div className="botao-header">
                            <span>Botão {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removerBotao(index)}
                              className="btn-remover-botao"
                            >
                              <Icons.FiX size={14} />
                            </button>
                          </div>
                          
                          <div className="botao-fields">
                            <select
                              value={botao.type}
                              onChange={e => atualizarBotao(index, 'type', e.target.value)}
                              className="botao-select"
                            >
                              <option value="REPLY">Resposta Rápida</option>
                              <option value="CALL">Fazer Ligação</option>
                              <option value="URL">Abrir Link</option>
                            </select>
                            
                            <input
                              type="text"
                              value={botao.label}
                              onChange={e => atualizarBotao(index, 'label', e.target.value)}
                              placeholder="Texto do botão"
                              className="botao-input"
                            />
                            
                            {botao.type === 'CALL' && (
                              <input
                                type="text"
                                value={botao.phone || ''}
                                onChange={e => atualizarBotao(index, 'phone', e.target.value)}
                                placeholder="Número para ligação (ex: 5511999999999)"
                                className="botao-input"
                              />
                            )}
                            
                            {botao.type === 'URL' && (
                              <input
                                type="text"
                                value={botao.url || ''}
                                onChange={e => atualizarBotao(index, 'url', e.target.value)}
                                placeholder="URL do link (ex: https://exemplo.com)"
                                className="botao-input"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {botoesAcao.length < 3 && (
                        <button
                          type="button"
                          onClick={adicionarBotao}
                          className="btn-adicionar-botao"
                        >
                          <Icons.FiPlus size={16} />
                          Adicionar Botão
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {renderizarSelecaoContatos()}
            </div>
            
            <div className="modal-actions">
              <button onClick={salvarCampanha} className="btn-criar" disabled={!isFormValid}>
                {campanhaEmEdicao ? <Icons.FiCheck size={16} /> : <Icons.FiPlus size={16} />}
                {campanhaEmEdicao ? 'Salvar Alterações' : 'Criar Campanha'}
              </button>
              <button onClick={fecharModalCriar} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seleção de contatos */}
      {modalContatos && (
        <div className="modal-overlay" onClick={fecharModalContatos}>
          <div className="modal-content modal-contatos" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Contatos</h3>
              <button onClick={fecharModalContatos} className="btn-fechar-modal">
                <Icons.FiX size={20} />
              </button>
            </div>

            {/* Barra de busca */}
            <div className="busca-contatos-container">
              <div className="busca-contatos-wrapper">
                <Icons.FiSearch className="busca-contatos-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou número..."
                  value={buscaContatos}
                  onChange={e => setBuscaContatos(e.target.value)}
                  className="busca-contatos-input"
                />
                {buscaContatos && (
                  <button 
                    onClick={() => setBuscaContatos('')}
                    className="limpar-busca-btn"
                    title="Limpar busca"
                  >
                    <Icons.FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Controles de seleção */}
            <div className="controles-selecao">
              <div className="info-selecao">
                <span className="total-contatos">
                  {contatosFiltradosOrdenados.length} contatos
                  {buscaContatos && ` encontrados`}
                </span>
                <span className="contatos-selecionados-info">
                  {contatosSelecionados.length} selecionados
                </span>
              </div>
              
              {contatosFiltradosOrdenados.length > 0 && (
                <div className="acoes-selecao">
                  <label className="checkbox-todos">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      ref={input => {
                        if (input) input.indeterminate = !todosSelecionados && algunsSelecionados;
                      }}
                      onChange={toggleTodosContatos}
                    />
                    <span className="checkbox-label">
                      {todosSelecionados ? 'Desmarcar todos' : 'Marcar todos'}
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="contatos-lista">
              {contatosFiltradosOrdenados.length === 0 ? (
                <div className="sem-contatos">
                  {buscaContatos ? (
                    <>
                      Nenhum contato encontrado para "{buscaContatos}"
                      <button 
                        onClick={() => setBuscaContatos('')}
                        className="btn-limpar-busca-sem-resultados"
                      >
                        Limpar busca
                      </button>
                    </>
                  ) : (
                    'Nenhum contato disponível na agenda'
                  )}
                </div>
              ) : (
                contatosFiltradosOrdenados.map(contato => {
                  const jaSelecionado = contatosSelecionados.some(c => c.id === contato.id);
                  return (
                    <label key={contato.id} className="contato-checkbox">
                      <input
                        type="checkbox"
                        checked={jaSelecionado}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContatosSelecionados([...contatosSelecionados, contato]);
                          } else {
                            setContatosSelecionados(contatosSelecionados.filter(c => c.id !== contato.id));
                          }
                        }}
                      />
                      <span className="contato-nome">{contato.nome}</span>
                      <span className="contato-numero">{contato.numero}</span>
                    </label>
                  );
                })
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={fecharModalContatos} className="btn-confirmar">
                Confirmar Seleção ({contatosSelecionados.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seleção de grupos */}
      {modalGrupos && (
        <div className="modal-overlay" onClick={() => setModalGrupos(false)}>
          <div className="modal-content modal-grupos" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Grupos</h3>
              <button onClick={() => setModalGrupos(false)} className="btn-fechar-modal">
                <Icons.FiX size={20} />
              </button>
            </div>

            <div className="grupos-lista">
              {grupos.length === 0 ? (
                <div className="sem-grupos">
                  <div className="empty-icon">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" opacity="0.3">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h1v5h2z"/>
                    </svg>
                  </div>
                  <h4>Nenhum grupo disponível</h4>
                  <p>Crie grupos na seção "Grupos de Usuários" para organizá-los aqui.</p>
                </div>
              ) : (
                grupos.map(grupo => {
                  const jaSelecionado = gruposSelecionados.includes(grupo.id);
                  return (
                    <label key={grupo.id} className={`grupo-checkbox ${jaSelecionado ? 'selecionado' : ''}`}>
                      <input
                        type="checkbox"
                        checked={jaSelecionado}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGruposSelecionados(prev => [...prev, grupo.id]);
                          } else {
                            setGruposSelecionados(prev => prev.filter(gId => gId !== grupo.id));
                          }
                        }}
                      />
                      <div className="grupo-item">
                        <div 
                          className="grupo-cor-indicator" 
                          style={{ backgroundColor: grupo.cor }}
                        ></div>
                        <div className="grupo-details">
                          <span className="grupo-nome">{grupo.nome}</span>
                          <span className="grupo-total">{grupo.totalContatos} contatos</span>
                        </div>
                        <div className="checkbox-custom">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={aplicarSelecaoGrupos} className="btn-confirmar" disabled={grupos.length === 0}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Confirmar Seleção ({gruposSelecionados.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes da campanha */}
      {modalDetalhes && (
        <div className="modal-overlay" onClick={() => setModalDetalhes(null)}>
          <div className="modal-content modal-detalhes" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalDetalhes.nome}</h3>
              <button onClick={() => setModalDetalhes(null)} className="btn-fechar-modal">
                <Icons.FiX size={20} />
              </button>
            </div>
            
            <div className="detalhes-content">
              <div className="detalhes-info">
                <div className="info-item">
                  <strong>Status:</strong>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getCorStatus(modalDetalhes.status) }}
                  >
                    {traduzirStatus(modalDetalhes.status)}
                  </span>
                </div>
                
                <div className="info-item">
                  <strong>Mensagem:</strong>
                  <div className="mensagem-preview">
                    {modalDetalhes.conteudo.tipo === 'texto' && (
                      <div 
                        className="preview-texto"
                        dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(modalDetalhes.conteudo.texto || '') }}
                      />
                    )}
                    
                    {modalDetalhes.conteudo.tipo === 'imagem' && (
                      <div className="preview-imagem">
                        {modalDetalhes.conteudo.imagem && (
                          <div className="imagem-container">
                            <img 
                              src={modalDetalhes.conteudo.imagem} 
                              alt="Imagem da campanha" 
                              className="preview-img-detalhes"
                            />
                          </div>
                        )}
                        {modalDetalhes.conteudo.legenda && (
                          <div className="legenda-container">
                            <strong>Legenda:</strong>
                            <div 
                              className="legenda-texto"
                              dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(modalDetalhes.conteudo.legenda) }}
                            />
                          </div>
                        )}
                        {!modalDetalhes.conteudo.legenda && (
                          <div className="sem-legenda">
                            <em>Imagem sem legenda</em>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {modalDetalhes.conteudo.tipo === 'botoes' && (
                      <div className="preview-botoes">
                        <div className="texto-botoes">
                          <div 
                            className="texto-principal"
                            dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(modalDetalhes.conteudo.texto || '') }}
                          />
                        </div>
                        
                        {modalDetalhes.conteudo.botoes && modalDetalhes.conteudo.botoes.length > 0 && (
                          <div className="botoes-container">
                            <strong>Botões:</strong>
                            <div className="botoes-lista">
                              {modalDetalhes.conteudo.botoes.map((botao, index) => (
                                <div key={index} className="botao-preview">
                                  <div className="botao-info">
                                    <span className="botao-label">{botao.label}</span>
                                    <span className="botao-tipo">
                                      {botao.type === 'REPLY' && (
                                        <>
                                          <Icons.FiMessageCircle size={12} />
                                          Resposta
                                        </>
                                      )}
                                      {botao.type === 'CALL' && (
                                        <>
                                          <Icons.FiPhone size={12} />
                                          Ligar: {botao.phone}
                                        </>
                                      )}
                                      {botao.type === 'URL' && (
                                        <>
                                          <Icons.FiExternalLink size={12} />
                                          Link: {botao.url}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="info-item">
                  <strong>Estatísticas:</strong>
                  <div className="stats-detalhes">
                    <div>Total: {modalDetalhes.estatisticas.totalContatos}</div>
                    <div>Sucessos: {modalDetalhes.estatisticas.sucessos}</div>
                    <div>Erros: {modalDetalhes.estatisticas.erros}</div>
                    <div>Taxa de sucesso: {modalDetalhes.estatisticas.percentualSucesso.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Mostrar logs detalhados para campanhas concluídas */}
                {['concluida', 'pausada', 'cancelada'].includes(modalDetalhes.status) && modalDetalhes.logs && modalDetalhes.logs.length > 0 && (
                  <div className="info-item">
                    <strong>Logs de Envio ({logsFiltrados.length}):</strong>
                    
                    {/* Controles de filtro de logs */}
                    <div className="logs-controles">
                      <div className="busca-container">
                        <Icons.FiSearch className="busca-icon" />
                        <input
                          type="text"
                          placeholder="Buscar por nome ou número..."
                          value={buscaLog}
                          onChange={e => setBuscaLog(e.target.value)}
                          className="busca-input"
                        />
                      </div>
                      <select
                        value={filtroStatusLog}
                        onChange={e => setFiltroStatusLog(e.target.value as any)}
                        className="filtro-status"
                      >
                        <option value="">Todos os Status</option>
                        <option value="sucesso">Sucesso</option>
                        <option value="erro">Erro</option>
                      </select>
                    </div>

                    <div className="logs-container">
                      <div className="logs-header">
                        <div className="log-col">Contato</div>
                        <div className="log-col">Status</div>
                        <div className="log-col">Variação</div>
                        <div className="log-col">Tentativas</div>
                        <div className="log-col">Tempo Resposta</div>
                        <div className="log-col">Última Tentativa</div>
                      </div>
                      <div className="logs-body">
                        {logsFiltrados.map((log, index) => (
                          <div key={log.contatoId || index} className="log-row">
                            <div className="log-col contato-info">
                              <div className="contato-nome-log">{log.nomeContato}</div>
                              <div className="contato-numero-log">{log.numeroContato}</div>
                            </div>
                            <div className="log-col">
                              <span className={`status-log status-${log.status}`}>
                                {log.status === 'sucesso' && <Icons.FiCheck size={14} />}
                                {log.status === 'erro' && <Icons.FiX size={14} />}
                                {log.status === 'pendente' && <Icons.FiClock size={14} />}
                                {log.status === 'enviando' && <Icons.FiSend size={14} />}
                                <span>{log.status}</span>
                              </span>
                              {log.status === 'erro' && log.mensagemErro && (
                                <div className="erro-detalhes" title={log.mensagemErro}>
                                  {log.mensagemErro.length > 30 
                                    ? `${log.mensagemErro.substring(0, 30)}...` 
                                    : log.mensagemErro
                                  }
                                </div>
                              )}
                            </div>
                            <div className="log-col">
                              {log.variacaoUsada ? (
                                <div className="variacao-info">
                                  <div className="variacao-badge">
                                    #{log.variacaoUsada.indice}
                                  </div>
                                  <div 
                                    className="variacao-preview" 
                                    title={log.variacaoUsada.conteudo}
                                  >
                                    {log.variacaoUsada.conteudo.length > 25 
                                      ? `${log.variacaoUsada.conteudo.substring(0, 25)}...` 
                                      : log.variacaoUsada.conteudo
                                    }
                                  </div>
                                </div>
                              ) : (
                                <span className="sem-variacao">Original</span>
                              )}
                            </div>
                            <div className="log-col">
                              <span className="tentativas-count">{log.tentativas}</span>
                              {log.codigoResposta && (
                                <div className="codigo-resposta">
                                  HTTP {log.codigoResposta}
                                </div>
                              )}
                            </div>
                            <div className="log-col">
                              {log.tempoResposta && (
                                <span className="tempo-resposta">
                                  {log.tempoResposta < 1000 
                                    ? `${log.tempoResposta}ms` 
                                    : `${(log.tempoResposta / 1000).toFixed(1)}s`
                                  }
                                </span>
                              )}
                            </div>
                            <div className="log-col">
                              {log.ultimaTentativa && (
                                <span className="data-tentativa">
                                  {new Date(log.ultimaTentativa).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações de timing da campanha */}
                <div className="info-item">
                  <strong>Informações de Execução:</strong>
                  <div className="timing-info">
                    <div>Criada em: {formatarData(modalDetalhes.dataCriacao)}</div>
                    {modalDetalhes.dataInicio && (
                      <div>Iniciada em: {formatarData(modalDetalhes.dataInicio)}</div>
                    )}
                    {modalDetalhes.dataConclusao && (
                      <div>Concluída em: {formatarData(modalDetalhes.dataConclusao)}</div>
                    )}
                    {modalDetalhes.dataInicio && modalDetalhes.dataConclusao && (
                      <div>
                      {(() => {
                        const duracaoMs = modalDetalhes.dataConclusao - modalDetalhes.dataInicio;
                        const minutos = Math.floor(duracaoMs / 1000 / 60);
                        const segundos = Math.floor((duracaoMs / 1000) % 60);
                        return `Duração: ${minutos}m ${segundos}s`;
                      })()}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de progresso em tempo real */}
      <ProgressoEnvio />

      <style jsx>{campanhaStyle}</style>
    </div>
  );
};

export default CampanhasPage;
