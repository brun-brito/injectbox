import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUsers, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Erro from '@/components/Erro';
import Aviso from '@/components/Aviso';
import Confirmacao from '@/components/Confirmacao';
import { withZCampanhaAuth } from '@/components/zcampanha/withZCampanhaAuth';
import { grupoStyle } from '@/styles/grupo-style';

type SubgrupoContatos = {
  id?: string;
  nome: string;
  contatos: string[];
  cor?: string;
  dataCriacao: number;
  dataAtualizacao: number;
  totalContatos: number;
};

type GrupoContatos = {
  id?: string;
  nome: string;
  descricao?: string;
  contatos: string[];
  cor?: string;
  dataCriacao: number;
  dataAtualizacao: number;
  criadoPor: string;
  totalContatos: number;
  contatosDetalhados?: Array<{ id: string; nome: string; numero: string }>;
};

type Contato = { id: string; nome: string; numero: string };

const cores = [
  { valor: '#3b82f6', nome: 'Azul' },
  { valor: '#10b981', nome: 'Verde' },
  { valor: '#f59e0b', nome: 'Amarelo' },
  { valor: '#ef4444', nome: 'Vermelho' },
  { valor: '#8b5cf6', nome: 'Roxo' },
  { valor: '#06b6d4', nome: 'Ciano' },
  { valor: '#f97316', nome: 'Laranja' },
  { valor: '#84cc16', nome: 'Lima' },
];

const GruposPage = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };

  // Estados principais
  const [grupos, setGrupos] = useState<GrupoContatos[]>([]);
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
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(12);

  // Estados para modais
  const [modalCriar, setModalCriar] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState<GrupoContatos | null>(null);
  const [modalContatos, setModalContatos] = useState(false);
  const [grupoEmEdicao, setGrupoEmEdicao] = useState<GrupoContatos | null>(null);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [corSelecionada, setCorSelecionada] = useState('#3b82f6');
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);

  // Estados para o modal de contatos
  const [buscaContatos, setBuscaContatos] = useState('');

  // Estados para seleção rápida
  const [quantidadeSelecaoRapida, setQuantidadeSelecaoRapida] = useState<number>(0);

  // Estados para loading de operações
  const [loadingGrupo, setLoadingGrupo] = useState(false);
  const [loadingDelecao, setLoadingDelecao] = useState(false);

  // Estados para subgrupos (local, não salva no banco até confirmação)
  const [subgrupos, setSubgrupos] = useState<SubgrupoContatos[]>([]);
  const [subgruposRemover, setSubgruposRemover] = useState<string[]>([]); // IDs para remover no modo edição
  const [modalSubgrupo, setModalSubgrupo] = useState(false);
  const [nomeSubgrupo, setNomeSubgrupo] = useState('');
  const [corSubgrupo, setCorSubgrupo] = useState('#3b82f6');
  const [contatosSubgrupo, setContatosSubgrupo] = useState<string[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string | null>(null);

  // Estados para edição de subgrupo
  const [subgrupoEmEdicao, setSubgrupoEmEdicao] = useState<SubgrupoContatos | null>(null);

  // Estados para seleção de contatos do subgrupo
  const [modalContatosSubgrupo, setModalContatosSubgrupo] = useState(false);
  const [buscaContatosSubgrupo, setBuscaContatosSubgrupo] = useState('');

  // Contatos disponíveis para subgrupo: apenas os do grupo pai
  const contatosDoGrupoPai = useMemo(() => {
    return contatos.filter(c => contatosSelecionados.includes(c.id));
  }, [contatos, contatosSelecionados]);

  const contatosFiltradosSubgrupo = useMemo(() => {
    let resultado = [...contatosDoGrupoPai];
    if (buscaContatosSubgrupo.trim()) {
      const termoBusca = buscaContatosSubgrupo.toLowerCase().trim();
      resultado = resultado.filter(contato =>
        contato.nome.toLowerCase().includes(termoBusca) ||
        contato.numero.includes(termoBusca)
      );
    }
    return resultado.sort((a, b) =>
      a.nome.toLowerCase().localeCompare(b.nome.toLowerCase())
    );
  }, [contatosDoGrupoPai, buscaContatosSubgrupo]);

  // Buscar grupos
  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos?incluirContatos=true`);
      const data = await response.json();
      setGrupos(data.grupos || []);
    } catch {
      setErro('Erro ao carregar grupos');
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

  // Buscar subgrupos do grupo selecionado
  const fetchSubgrupos = async (grupoId: string) => {
    const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos/${grupoId}/subgrupos`);
    const data = await response.json();
    setSubgrupos(data.subgrupos || []);
  };

  useEffect(() => {
    if (cliente && idInstancia) {
      fetchGrupos();
      fetchContatos();
    }
  }, [cliente, idInstancia]);

  // Filtrar grupos
  const gruposFiltrados = useMemo(() => {
    let resultado = grupos;
    
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = resultado.filter(grupo => 
        grupo.nome.toLowerCase().includes(termoBusca) ||
        grupo.descricao?.toLowerCase().includes(termoBusca)
      );
    }
    
    return resultado.sort((a, b) => b.dataCriacao - a.dataCriacao);
  }, [grupos, busca]);

  // Paginação
  const totalPaginas = Math.ceil(gruposFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const gruposPaginados = gruposFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina);

  // Validação do formulário
  const isFormValid = useMemo(() => {
    return nome.trim() && contatosSelecionados.length > 0;
  }, [nome, contatosSelecionados]);

  // Criar ou atualizar grupo
  const salvarGrupo = async () => {
    if (!isFormValid || loadingGrupo) return;
    setLoadingGrupo(true);
    setErro('');

    const dadosGrupo = {
      id: grupoEmEdicao?.id,
      nome: nome.trim(),
      descricao: descricao.trim(),
      contatos: contatosSelecionados,
      cor: corSelecionada,
      subgrupos
    };

    const isEditing = !!grupoEmEdicao;
    const url = `/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosGrupo)
      });

      const data = await response.json();

      if (response.ok) {
        // Após salvar grupo, salve subgrupos no banco (criação/edição)
        if (subgrupos.length > 0) {
          const grupoId = isEditing ? grupoEmEdicao?.id : data.id;
          const subColUrl = `/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos/${grupoId}/subgrupos`;
          for (const sub of subgrupos) {
            if (!sub.id || (isEditing && typeof sub.id === 'string' && sub.id.length < 20)) {
              // Criar subgrupo (id gerado localmente, não existe no banco)
              await fetch(subColUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sub, id: undefined })
              });
            } else {
              // Editar subgrupo (id do banco)
              await fetch(subColUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
              });
            }
          }
        }
        // Remover subgrupos marcados para remoção
        if (isEditing && subgruposRemover.length > 0) {
          const grupoId = grupoEmEdicao?.id;
          const subColUrl = `/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos/${grupoId}/subgrupos`;
          for (const subId of subgruposRemover) {
            await fetch(subColUrl, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: subId })
            });
          }
        }
        setModalCriar(false);
        limparFormulario();
        fetchGrupos();
        setAviso(isEditing ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!');
        setErro('');
      } else {
        setErro(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} grupo`);
      }
    } catch {
      setErro(`Erro de conexão ao ${isEditing ? 'atualizar' : 'criar'} grupo`);
    } finally {
      setLoadingGrupo(false);
    }
  };

  // Limpar formulário
  const limparFormulario = () => {
    setNome('');
    setDescricao('');
    setCorSelecionada('#3b82f6');
    setContatosSelecionados([]);
    setGrupoEmEdicao(null);
    setErro('');
    setSubgrupos([]);
    setGrupoSelecionadoId(null);
  };

  // Deletar grupo
  const deletarGrupo = async (id: string, nomeGrupo: string) => {
    setConfirmacao({
      mostrar: true,
      titulo: 'Deletar Grupo',
      mensagem: `Tem certeza que deseja deletar o grupo "${nomeGrupo}"?\n\nEsta ação não pode ser desfeita.`,
      tipo: 'danger',
      textoConfirmar: 'Deletar',
      onConfirmar: () => {
        setConfirmacao(prev => ({ ...prev, mostrar: false }));
        executarDelecaoGrupo(id);
      }
    });
  };

  const executarDelecaoGrupo = async (id: string) => {
    setLoadingDelecao(true);
    try {
      await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchGrupos();
      setAviso('Grupo deletado com sucesso!');
    } catch {
      setErro('Erro ao deletar grupo');
    } finally {
      setLoadingDelecao(false);
    }
  };

  // Função para apagar subgrupo
  const apagarSubgrupo = async (subgrupoId: string) => {
    if (!grupoSelecionadoId || !subgrupoId) return;
    if (!window.confirm('Tem certeza que deseja apagar este subgrupo?')) return;
    const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos/${grupoSelecionadoId}/subgrupos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subgrupoId })
    });
    if (response.ok) {
      fetchSubgrupos(grupoSelecionadoId);
      setAviso('Subgrupo apagado com sucesso!');
    } else {
      const data = await response.json();
      setErro(data.error || 'Erro ao apagar subgrupo');
    }
  };

  // Iniciar edição
  const iniciarEdicao = async (grupo: GrupoContatos) => {
    setGrupoEmEdicao(grupo);
    setNome(grupo.nome);
    setDescricao(grupo.descricao || '');
    setCorSelecionada(grupo.cor || '#3b82f6');
    setContatosSelecionados(grupo.contatos);
    setGrupoSelecionadoId(grupo.id || null);
    // Carregue subgrupos do banco
    const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos/${grupo.id}/subgrupos`);
    const data = await response.json();
    setSubgrupos(data.subgrupos || []);
    setSubgruposRemover([]);
    setModalCriar(true);
  };

  const abrirDetalhesGrupo = (grupo: GrupoContatos) => {
    setModalDetalhes(grupo);
    setGrupoSelecionadoId(grupo.id || null);
    fetchSubgrupos(grupo.id!);
  };

  // Filtrar e ordenar contatos no modal
  const contatosFiltradosOrdenados = useMemo(() => {
    let resultado = [...contatos];
    
    if (buscaContatos.trim()) {
      const termoBusca = buscaContatos.toLowerCase().trim();
      resultado = resultado.filter(contato => 
        contato.nome.toLowerCase().includes(termoBusca) ||
        contato.numero.includes(termoBusca)
      );
    }
    
    return resultado.sort((a, b) => 
      a.nome.toLowerCase().localeCompare(b.nome.toLowerCase())
    );
  }, [contatos, buscaContatos]);

  // Funções de seleção rápida
  const marcarTodosContatos = () => {
    setContatosSelecionados(contatosFiltradosOrdenados.map(c => c.id));
  };

  const desmarcarTodosContatos = () => {
    setContatosSelecionados([]);
  };

  const selecionarPrimeirosContatos = (quantidade: number) => {
    setContatosSelecionados(contatosFiltradosOrdenados.slice(0, quantidade).map(c => c.id));
  };

  const selecionarUltimosContatos = (quantidade: number) => {
    setContatosSelecionados(contatosFiltradosOrdenados.slice(-quantidade).map(c => c.id));
  };

  // Funções de seleção rápida para subgrupo
  const marcarTodosContatosSubgrupo = () => {
    setContatosSubgrupo(contatosFiltradosSubgrupo.map(c => c.id));
  };

  const desmarcarTodosContatosSubgrupo = () => {
    setContatosSubgrupo([]);
  };

  const selecionarPrimeirosContatosSubgrupo = (quantidade: number) => {
    setContatosSubgrupo(contatosFiltradosSubgrupo.slice(0, quantidade).map(c => c.id));
  };

  const selecionarUltimosContatosSubgrupo = (quantidade: number) => {
    setContatosSubgrupo(contatosFiltradosSubgrupo.slice(-quantidade).map(c => c.id));
  };

  // Função para abrir modal de edição de subgrupo local
  const editarSubgrupoLocal = (sub: SubgrupoContatos) => {
    setSubgrupoEmEdicao(sub);
    setNomeSubgrupo(sub.nome);
    setCorSubgrupo(sub.cor || '#3b82f6');
    setContatosSubgrupo(sub.contatos);
    setModalSubgrupo(true);
  };

  // Função para salvar subgrupo localmente
  const salvarSubgrupoLocal = () => {
    if (!nomeSubgrupo.trim() || contatosSubgrupo.length === 0) return;
    if (subgrupoEmEdicao && subgrupoEmEdicao.id) {
      setSubgrupos(subgrupos.map(s =>
        s.id === subgrupoEmEdicao.id
          ? { ...s, nome: nomeSubgrupo.trim(), contatos: contatosSubgrupo, cor: corSubgrupo, totalContatos: contatosSubgrupo.length, dataAtualizacao: Date.now() }
          : s
      ));
    } else {
      setSubgrupos([
        ...subgrupos,
        {
          id: Math.random().toString(36).slice(2),
          nome: nomeSubgrupo.trim(),
          contatos: contatosSubgrupo,
          cor: corSubgrupo,
          dataCriacao: Date.now(),
          dataAtualizacao: Date.now(),
          totalContatos: contatosSubgrupo.length
        }
      ]);
    }
    setModalSubgrupo(false);
    setNomeSubgrupo('');
    setCorSubgrupo('#3b82f6');
    setContatosSubgrupo([]);
    setSubgrupoEmEdicao(null);
  };

  // Função para marcar subgrupo para remoção (no modo edição)
  const marcarRemoverSubgrupo = (subId: string) => {
    setSubgruposRemover([...subgruposRemover, subId]);
    setSubgrupos(subgrupos.filter(s => s.id !== subId));
  };

  // Função para formatar data
  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="grupos-bg">
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
      
      <div className="grupos-container">
        <div className="header-container">
          <h2>Grupos de Contatos</h2>
          <button 
            onClick={() => setModalCriar(true)}
            className="btn-criar-grupo"
          >
            <FiPlus size={18} />
            Novo Grupo
          </button>
        </div>

        {/* Controles de busca */}
        <div className="controles-container">
          <div className="busca-container">
            <FiSearch className="busca-icon" />
            <input
              type="text"
              placeholder="Buscar grupos..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="busca-input"
            />
          </div>
          
          <div className="info-resultados">
            <span>
              {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} • {contatos.length} contato{contatos.length !== 1 ? 's' : ''} total
            </span>
          </div>
        </div>

        {/* Lista de grupos */}
        {loading ? (
          <div className="status-message loading">Carregando grupos...</div>
        ) : erro ? (
          <div className="status-message error">{erro}</div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="status-message empty">
            {busca ? 'Nenhum grupo encontrado com os filtros aplicados' : 'Nenhum grupo criado ainda. Crie seu primeiro grupo!'}
          </div>
        ) : (
          <>
            <div className="grupos-grid">
              {gruposPaginados.map(grupo => (
                <div key={grupo.id} className="grupo-card">
                  <div className="grupo-header">
                    <div className="grupo-info">
                      <div 
                        className="grupo-cor"
                        style={{ backgroundColor: grupo.cor }}
                      ></div>
                      <div>
                        <h3>{grupo.nome}</h3>
                        {grupo.descricao && (
                          <p className="grupo-descricao">{grupo.descricao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grupo-stats">
                    <div className="stat-item">
                      <FiUsers size={16} />
                      <span>{grupo.totalContatos} contato{grupo.totalContatos !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="grupo-info-bottom">
                    <small>Criado em: {formatarData(grupo.dataCriacao)}</small>
                    {grupo.dataAtualizacao !== grupo.dataCriacao && (
                      <small>Atualizado em: {formatarData(grupo.dataAtualizacao)}</small>
                    )}
                  </div>
                  
                  <div className="grupo-actions">
                    <button
                      onClick={() => abrirDetalhesGrupo(grupo)}
                      className="btn-acao ver"
                      title="Ver detalhes"
                    >
                      <FiUsers size={16} />
                    </button>
                    
                    <button
                      onClick={() => iniciarEdicao(grupo)}
                      className="btn-acao editar"
                      title="Editar grupo"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    
                    <button
                      onClick={() => deletarGrupo(grupo.id!, grupo.nome)}
                      className="btn-acao deletar"
                      title="Deletar grupo"
                      disabled={loadingDelecao}
                    >
                      {loadingDelecao ? <span className="loading-spinner" /> : <FiTrash2 size={16} />}
                    </button>
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
                  <FiChevronLeft size={16} />
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
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de criar/editar grupo */}
      {modalCriar && (
        <div className="modal-overlay" onClick={() => { setModalCriar(false); limparFormulario(); }}>
          <div className="modal-content modal-criar" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{grupoEmEdicao ? 'Editar Grupo' : 'Novo Grupo'}</h3>
              <button onClick={() => { setModalCriar(false); limparFormulario(); }} className="btn-fechar-modal">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="form-grupo">
              <div className="form-group">
                <label>Nome do Grupo<span className="required-asterisk">*</span></label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Clientes VIP"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descrição do grupo..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Cor do Grupo</label>
                <div className="cores-container">
                  {cores.map(cor => (
                    <button
                      key={cor.valor}
                      type="button"
                      className={`cor-btn ${corSelecionada === cor.valor ? 'ativa' : ''}`}
                      style={{ backgroundColor: cor.valor }}
                      onClick={() => setCorSelecionada(cor.valor)}
                      title={cor.nome}
                    >
                      {corSelecionada === cor.valor && <FiCheck size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Contatos Selecionados ({contatosSelecionados.length})<span className="required-asterisk">*</span></label>
                <button
                  type="button"
                  onClick={() => setModalContatos(true)}
                  className="btn-selecionar-contatos"
                >
                  <FiUsers size={16} />
                  Selecionar Contatos
                </button>
                {contatosSelecionados.length > 0 && (
                  <div className="contatos-selecionados">
                    {contatosSelecionados.slice(0, 5).map(contatoId => {
                      const contato = contatos.find(c => c.id === contatoId);
                      return contato ? (
                        <span key={contato.id} className="contato-tag">
                          {contato.nome}
                        </span>
                      ) : null;
                    })}
                    {contatosSelecionados.length > 5 && (
                      <span className="contato-tag">+{contatosSelecionados.length - 5} mais</span>
                    )}
                  </div>
                )}
              </div>

              {/* Subgrupos: manipulação local, só salva no banco ao confirmar grupo */}
              <div className="form-group">
                <label>Subgrupos</label>
                <button
                  type="button"
                  onClick={() => setModalSubgrupo(true)}
                  className="btn-criar-subgrupo"
                >
                  <FiPlus size={16} /> Adicionar Subgrupo
                </button>
                {subgrupos.length > 0 && (
                  <div className="subgrupos-lista">
                    {subgrupos.map(sub => (
                      <div key={sub.id} className="subgrupo-tag" style={{ backgroundColor: sub.cor }}>
                        {sub.nome} ({sub.totalContatos})
                        <button
                          className="btn-editar-subgrupo"
                          style={{
                            marginLeft: 8,
                            background: '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '2px 8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => editarSubgrupoLocal(sub)}
                          title="Editar subgrupo"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          className="btn-apagar-subgrupo"
                          style={{
                            marginLeft: 4,
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '2px 8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => marcarRemoverSubgrupo(sub.id!)}
                          title="Apagar subgrupo"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={salvarGrupo} 
                className="btn-criar"
                disabled={!isFormValid || loadingGrupo}
              >
                {loadingGrupo ? (
                  <span className="loading-spinner" />
                ) : grupoEmEdicao ? <FiCheck size={16} /> : <FiPlus size={16} />}
                {grupoEmEdicao ? 'Salvar Alterações' : 'Criar Grupo'}
              </button>
              <button 
                onClick={() => { setModalCriar(false); limparFormulario(); }} 
                className="btn-cancelar"
                disabled={loadingGrupo}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seleção de contatos */}
      {modalContatos && (
        <div className="modal-overlay" onClick={() => setModalContatos(false)}>
          <div className="modal-content modal-contatos" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Contatos para o Grupo</h3>
              <button onClick={() => setModalContatos(false)} className="btn-fechar-modal">
                <FiX size={20} />
              </button>
            </div>

            <div className="busca-contatos-container">
              <div className="busca-contatos-wrapper">
                <FiSearch className="busca-contatos-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou número..."
                  value={buscaContatos}
                  onChange={e => setBuscaContatos(e.target.value)}
                  className="busca-contatos-input"
                />
              </div>
            </div>

            {/* Seleção rápida */}
            <div className="controles-selecao">
              <div className="info-selecao">
                <span>{contatosFiltradosOrdenados.length} contatos disponíveis</span>
                <span>{contatosSelecionados.length} selecionados</span>
              </div>
              <div className="selecao-rapida">
                <button type="button" onClick={marcarTodosContatos} className="btn-selecao-rapida">
                  Marcar todos
                </button>
                <button type="button" onClick={desmarcarTodosContatos} className="btn-selecao-rapida">
                  Desmarcar todos
                </button>
                <input
                  type="number"
                  min={1}
                  max={contatosFiltradosOrdenados.length}
                  value={quantidadeSelecaoRapida > 0 ? quantidadeSelecaoRapida : ''}
                  onChange={e => setQuantidadeSelecaoRapida(Number(e.target.value))}
                  placeholder="Qtd"
                  className="input-qtd-selecao"
                  style={{ width: 70, marginLeft: 8 }}
                />
                <button
                  type="button"
                  onClick={() => selecionarPrimeirosContatos(quantidadeSelecaoRapida)}
                  disabled={!quantidadeSelecaoRapida || quantidadeSelecaoRapida < 1}
                  className="btn-selecao-rapida"
                >
                  Selecionar primeiros
                </button>
                <button
                  type="button"
                  onClick={() => selecionarUltimosContatos(quantidadeSelecaoRapida)}
                  disabled={!quantidadeSelecaoRapida || quantidadeSelecaoRapida < 1}
                  className="btn-selecao-rapida"
                >
                  Selecionar últimos
                </button>
              </div>
            </div>
            
            <div className="contatos-lista">
              {contatosFiltradosOrdenados.length === 0 ? (
                <div className="sem-contatos">
                  {buscaContatos ? `Nenhum contato encontrado para "${buscaContatos}"` : 'Nenhum contato disponível'}
                </div>
              ) : (
                contatosFiltradosOrdenados.map(contato => (
                  <label key={contato.id} className="contato-checkbox">
                    <input
                      type="checkbox"
                      checked={contatosSelecionados.includes(contato.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setContatosSelecionados([...contatosSelecionados, contato.id]);
                        } else {
                          setContatosSelecionados(contatosSelecionados.filter(id => id !== contato.id));
                        }
                      }}
                    />
                    <span className="contato-nome">{contato.nome}</span>
                    <span className="contato-numero">{contato.numero}</span>
                  </label>
                ))
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setModalContatos(false)} className="btn-confirmar">
                Confirmar Seleção ({contatosSelecionados.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes do grupo */}
      {modalDetalhes && (
        <div className="modal-overlay" onClick={() => setModalDetalhes(null)}>
          <div className="modal-content modal-detalhes" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalDetalhes.nome}</h3>
              <button onClick={() => setModalDetalhes(null)} className="btn-fechar-modal">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="detalhes-content">
              <div className="grupo-info-detalhes">
                <div className="info-item">
                  <strong>Descrição:</strong>
                  <span>{modalDetalhes.descricao || 'Sem descrição'}</span>
                </div>
                
                <div className="info-item">
                  <strong>Total de Contatos:</strong>
                  <span>{modalDetalhes.totalContatos}</span>
                </div>
                
                <div className="info-item">
                  <strong>Criado em:</strong>
                  <span>{formatarData(modalDetalhes.dataCriacao)}</span>
                </div>
                
                {modalDetalhes.dataAtualizacao !== modalDetalhes.dataCriacao && (
                  <div className="info-item">
                    <strong>Última atualização:</strong>
                    <span>{formatarData(modalDetalhes.dataAtualizacao)}</span>
                  </div>
                )}
              </div>

              {modalDetalhes.contatosDetalhados && modalDetalhes.contatosDetalhados.length > 0 && (
                <div className="contatos-grupo">
                  <h4>Contatos do Grupo:</h4>
                  <div className="lista-contatos-detalhes">
                    {modalDetalhes.contatosDetalhados.map(contato => (
                      <div key={contato.id} className="contato-item-detalhes">
                        <span className="contato-nome-detalhes">{contato.nome}</span>
                        <span className="contato-numero-detalhes">{contato.numero}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subgrupos.length > 0 && (
                <div className="subgrupos-detalhes">
                  <h4>Subgrupos:</h4>
                  <div className="subgrupos-lista">
                    {subgrupos.map(sub => (
                      <div key={sub.id} className="subgrupo-tag" style={{ backgroundColor: sub.cor }}>
                        {sub.nome} ({sub.totalContatos})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de criar/editar subgrupo */}
      {modalSubgrupo && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => { setModalSubgrupo(false); setSubgrupoEmEdicao(null); }}>
          <div className="modal-content modal-criar" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{subgrupoEmEdicao ? 'Editar Subgrupo' : 'Novo Subgrupo'}</h3>
              <button onClick={() => { setModalSubgrupo(false); setSubgrupoEmEdicao(null); }} className="btn-fechar-modal">
                <FiX size={20} />
              </button>
            </div>
            <div className="form-grupo">
              <div className="form-group">
                <label>Nome do Subgrupo<span className="required-asterisk">*</span></label>
                <input
                  type="text"
                  value={nomeSubgrupo}
                  onChange={e => setNomeSubgrupo(e.target.value)}
                  placeholder="Ex: Belo Horizonte"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Cor do Subgrupo</label>
                <div className="cores-container">
                  {cores.map(cor => (
                    <button
                      key={cor.valor}
                      type="button"
                      className={`cor-btn ${corSubgrupo === cor.valor ? 'ativa' : ''}`}
                      style={{ backgroundColor: cor.valor }}
                      onClick={() => setCorSubgrupo(cor.valor)}
                      title={cor.nome}
                    >
                      {corSubgrupo === cor.valor && <FiCheck size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Contatos do Subgrupo<span className="required-asterisk">*</span></label>
                <button
                  type="button"
                  onClick={() => setModalContatosSubgrupo(true)}
                  className="btn-selecionar-contatos"
                >
                  <FiUsers size={16} />
                  Selecionar Contatos
                </button>
                {contatosSubgrupo.length > 0 && (
                  <div className="contatos-selecionados">
                    {contatosSubgrupo.slice(0, 5).map(contatoId => {
                      const contato = contatos.find(c => c.id === contatoId);
                      return contato ? (
                        <span key={contato.id} className="contato-tag">
                          {contato.nome}
                        </span>
                      ) : null;
                    })}
                    {contatosSubgrupo.length > 5 && (
                      <span className="contato-tag">+{contatosSubgrupo.length - 5} mais</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={salvarSubgrupoLocal} 
                className="btn-criar"
                disabled={!nomeSubgrupo.trim() || contatosSubgrupo.length === 0}
              >
                <FiPlus size={16} /> {subgrupoEmEdicao ? 'Salvar Subgrupo' : 'Criar Subgrupo'}
              </button>
              <button 
                onClick={() => { setModalSubgrupo(false); setSubgrupoEmEdicao(null); }} 
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
          {/* Modal de seleção de contatos do subgrupo, sobreposto */}
          {modalContatosSubgrupo && (
            <div className="modal-overlay" style={{ zIndex: 1300 }} onClick={() => setModalContatosSubgrupo(false)}>
              <div className="modal-content modal-contatos" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Selecionar Contatos do Subgrupo</h3>
                  <button onClick={() => setModalContatosSubgrupo(false)} className="btn-fechar-modal">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="busca-contatos-container">
                  <div className="busca-contatos-wrapper">
                    <FiSearch className="busca-contatos-icon" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou número..."
                      value={buscaContatosSubgrupo}
                      onChange={e => setBuscaContatosSubgrupo(e.target.value)}
                      className="busca-contatos-input"
                    />
                  </div>
                </div>

                {/* Seleção rápida */}
                <div className="controles-selecao">
                  <div className="info-selecao">
                    <span>{contatosFiltradosSubgrupo.length} contatos disponíveis</span>
                    <span>{contatosSubgrupo.length} selecionados</span>
                  </div>
                  <div className="selecao-rapida">
                    <button type="button" onClick={marcarTodosContatosSubgrupo} className="btn-selecao-rapida">
                      Marcar todos
                    </button>
                    <button type="button" onClick={desmarcarTodosContatosSubgrupo} className="btn-selecao-rapida">
                      Desmarcar todos
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={contatosFiltradosSubgrupo.length}
                      value={quantidadeSelecaoRapida > 0 ? quantidadeSelecaoRapida : ''}
                      onChange={e => setQuantidadeSelecaoRapida(Number(e.target.value))}
                      placeholder="Qtd"
                      className="input-qtd-selecao"
                      style={{ width: 70, marginLeft: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => selecionarPrimeirosContatosSubgrupo(quantidadeSelecaoRapida)}
                      disabled={!quantidadeSelecaoRapida || quantidadeSelecaoRapida < 1}
                      className="btn-selecao-rapida"
                    >
                      Selecionar primeiros
                    </button>
                    <button
                      type="button"
                      onClick={() => selecionarUltimosContatosSubgrupo(quantidadeSelecaoRapida)}
                      disabled={!quantidadeSelecaoRapida || quantidadeSelecaoRapida < 1}
                      className="btn-selecao-rapida"
                    >
                      Selecionar últimos
                    </button>
                  </div>
                </div>

                <div className="contatos-lista">
                  {contatosFiltradosSubgrupo.length === 0 ? (
                    <div className="sem-contatos">
                      {buscaContatosSubgrupo ? `Nenhum contato encontrado para "${buscaContatosSubgrupo}"` : 'Nenhum contato disponível ainda. Adicione no grupo principal.'}
                    </div>
                  ) : (
                    contatosFiltradosSubgrupo.map(contato => (
                      <label key={contato.id} className="contato-checkbox">
                        <input
                          type="checkbox"
                          checked={contatosSubgrupo.includes(contato.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setContatosSubgrupo([...contatosSubgrupo, contato.id]);
                            } else {
                              setContatosSubgrupo(contatosSubgrupo.filter(id => id !== contato.id));
                            }
                          }}
                        />
                        <span className="contato-nome">{contato.nome}</span>
                        <span className="contato-numero">{contato.numero}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="modal-actions">
                  <button onClick={() => setModalContatosSubgrupo(false)} className="btn-confirmar">
                    Confirmar Seleção ({contatosSubgrupo.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{grupoStyle}</style>
    </div>
  );
};

export default withZCampanhaAuth(GruposPage);
