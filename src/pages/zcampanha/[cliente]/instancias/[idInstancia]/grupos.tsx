import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUsers, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Erro from '@/components/Erro';
import Aviso from '@/components/Aviso';
import Confirmacao from '@/components/Confirmacao';
import { withZCampanhaAuth } from '@/components/zcampanha/withZCampanhaAuth';

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
  const [expandirTodos, setExpandirTodos] = useState(false);

  // Buscar grupos
  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos?incluirContatos=true`);
      const data = await response.json();
      setGrupos(data.grupos || []);
    } catch (error) {
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
    if (!isFormValid) {
      setErro('Nome e pelo menos um contato são obrigatórios');
      return;
    }

    const dadosGrupo = {
      id: grupoEmEdicao?.id,
      nome: nome.trim(),
      descricao: descricao.trim(),
      contatos: contatosSelecionados,
      cor: corSelecionada
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

      if (response.ok) {
        setModalCriar(false);
        limparFormulario();
        fetchGrupos();
        setAviso(`Grupo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        setErro('');
      } else {
        const data = await response.json();
        setErro(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} grupo`);
      }
    } catch (error) {
      setErro(`Erro de conexão ao ${isEditing ? 'atualizar' : 'criar'} grupo`);
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
    try {
      await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/grupos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchGrupos();
      setAviso('Grupo deletado com sucesso!');
    } catch (error) {
      setErro('Erro ao deletar grupo');
    }
  };

  // Iniciar edição
  const iniciarEdicao = (grupo: GrupoContatos) => {
    setGrupoEmEdicao(grupo);
    setNome(grupo.nome);
    setDescricao(grupo.descricao || '');
    setCorSelecionada(grupo.cor || '#3b82f6');
    setContatosSelecionados(grupo.contatos);
    setModalCriar(true);
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
                      onClick={() => setModalDetalhes(grupo)}
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
                    >
                      <FiTrash2 size={16} />
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
            </div>
            
            <div className="modal-actions">
              <button onClick={salvarGrupo} className="btn-criar" disabled={!isFormValid}>
                {grupoEmEdicao ? <FiCheck size={16} /> : <FiPlus size={16} />}
                {grupoEmEdicao ? 'Salvar Alterações' : 'Criar Grupo'}
              </button>
              <button onClick={() => { setModalCriar(false); limparFormulario(); }} className="btn-cancelar">
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

            <div className="controles-selecao">
              <div className="info-selecao">
                <span>{contatosFiltradosOrdenados.length} contatos disponíveis</span>
                <span>{contatosSelecionados.length} selecionados</span>
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
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .grupos-bg {
          min-height: 100vh;
          background: #18181b;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #fff;
        }

        .voltar-btn {
          background: #23232b;
          color: #7dd3fc;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 32px;
          transition: background 0.2s;
          align-self: flex-start;
        }

        .voltar-btn:hover {
          background: #2d2d38;
        }

        .grupos-container {
          background: #23232b;
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 1200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border: 2px solid #31313d;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        h2 {
          color: #7dd3fc;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .btn-criar-grupo {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-criar-grupo:hover {
          background: #16a34a;
        }

        .controles-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #1e2328;
          border-radius: 12px;
          border: 1px solid #31313d;
        }

        .busca-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .busca-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #71717a;
          z-index: 1;
        }

        .busca-input {
          width: 100%;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px 12px 40px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .busca-input:focus {
          border-color: #7dd3fc;
        }

        .busca-input::placeholder {
          color: #71717a;
        }

        .info-resultados {
          color: #bfc7d5;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .status-message {
          text-align: center;
          padding: 32px;
          font-size: 1.1rem;
          border-radius: 12px;
          margin-top: 20px;
        }

        .status-message.loading {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .status-message.error {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .status-message.empty {
          color: #7dd3fc;
          background: rgba(125, 211, 252, 0.1);
          border: 1px solid rgba(125, 211, 252, 0.2);
        }

        .grupos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .grupo-card {
          background: #1e2328;
          border-radius: 12px;
          border: 1px solid #31313d;
          padding: 20px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .grupo-card:hover {
          border-color: #7dd3fc;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(125, 211, 252, 0.1);
        }

        .grupo-header {
          margin-bottom: 16px;
        }

        .grupo-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .grupo-cor {
          width: 8px;
          height: 40px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .grupo-info h3 {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .grupo-descricao {
          color: #bfc7d5;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        .grupo-stats {
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7dd3fc;
          font-size: 0.9rem;
        }

        .grupo-info-bottom {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
          font-size: 0.8rem;
          color: #71717a;
        }

        .grupo-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-acao {
          background: #2d2d38;
          color: #bfc7d5;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-acao:hover {
          background: #3d3d48;
          border-color: #7dd3fc;
        }

        .btn-acao.ver {
          color: #7dd3fc;
        }

        .btn-acao.editar {
          color: #8b5cf6;
        }

        .btn-acao.deletar {
          color: #ef4444;
        }

        .paginacao {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .btn-pagina {
          background: #23232b;
          color: #7dd3fc;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .btn-pagina:hover:not(:disabled) {
          background: #2d2d38;
          border-color: #7dd3fc;
        }

        .btn-pagina:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-pagina {
          color: #bfc7d5;
          font-size: 0.9rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #23232b;
          border-radius: 16px;
          border: 2px solid #31313d;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
        }

        .modal-criar {
          max-width: 600px;
        }

        .modal-contatos {
          max-width: 500px;
        }

        .modal-detalhes {
          max-width: 700px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid #31313d;
          padding-bottom: 16px;
        }

        .modal-header h3 {
          color: #7dd3fc;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .btn-fechar-modal {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-fechar-modal:hover {
          background: #31313d;
          color: #bfc7d5;
        }

        .form-grupo {
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: #bfc7d5;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .required-asterisk {
          color: #ef4444;
          margin-left: 4px;
        }

        .form-input, .form-textarea {
          background: #1e2328;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: #7dd3fc;
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #71717a;
        }

        .cores-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cor-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: white;
        }

        .cor-btn:hover {
          border-color: #fff;
          transform: scale(1.1);
        }

        .cor-btn.ativa {
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .btn-selecionar-contatos {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .btn-selecionar-contatos:hover {
          background: #6d28d9;
        }

        .contatos-selecionados {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .contato-tag {
          background: #31313d;
          color: #bfc7d5;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .modal-actions {
          padding: 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          border-top: 1px solid #31313d;
          margin-top: 24px;
        }

        .btn-criar {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .btn-criar:hover:not(:disabled) {
          background: #16a34a;
        }

        .btn-criar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancelar {
          background: #6b7280;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-cancelar:hover {
          background: #4b5563;
        }

        .busca-contatos-container {
          padding: 0 24px;
          margin-bottom: 16px;
        }

        .busca-contatos-wrapper {
          position: relative;
        }

        .busca-contatos-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #71717a;
          z-index: 1;
        }

        .busca-contatos-input {
          width: 100%;
          background: #1e2328;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px 12px 40px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .busca-contatos-input:focus {
          border-color: #7dd3fc;
        }

        .busca-contatos-input::placeholder {
          color: #71717a;
        }

        .controles-selecao {
          padding: 0 24px;
          margin-bottom: 16px;
        }

        .info-selecao {
          display: flex;
          justify-content: space-between;
          color: #bfc7d5;
          font-size: 0.9rem;
        }

        .contatos-lista {
          max-height: 300px;
          overflow-y: auto;
          padding: 0 24px;
          margin-bottom: 16px;
        }

        .sem-contatos {
          text-align: center;
          color: #71717a;
          padding: 32px;
          font-style: italic;
        }

        .contato-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .contato-checkbox:hover {
          background: #31313d;
        }

        .contato-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #7dd3fc;
        }

        .contato-nome {
          flex: 1;
          font-weight: 500;
          color: #fff;
        }

        .contato-numero {
          color: #7dd3fc;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .btn-confirmar {
          background: #7dd3fc;
          color: #18181b;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
        }

        .btn-confirmar:hover {
          background: #38bdf8;
        }

        .detalhes-content {
          padding: 0 24px 24px 24px;
        }

        .grupo-info-detalhes {
          margin-bottom: 24px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #31313d;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item strong {
          color: #7dd3fc;
          font-weight: 600;
        }

        .info-item span {
          color: #bfc7d5;
        }

        .contatos-grupo h4 {
          color: #7dd3fc;
          font-size: 1.1rem;
          margin-bottom: 16px;
        }

        .lista-contatos-detalhes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .contato-item-detalhes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #1e2328;
          border-radius: 6px;
          border: 1px solid #31313d;
        }

        .contato-nome-detalhes {
          color: #fff;
          font-weight: 500;
        }

        .contato-numero-detalhes {
          color: #7dd3fc;
          font-family: monospace;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .grupos-container {
            padding: 20px;
          }

          .header-container {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .controles-container {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .busca-container {
            max-width: none;
          }

          .grupos-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            max-width: 95vw;
            margin: 10px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default withZCampanhaAuth(GruposPage);
