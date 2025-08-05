import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import * as Icons from 'react-icons/fi';
import ImportarContatos from '@/components/ImportarContatos';

type Contato = { id: string; nome: string; numero: string };

const AgendaPage = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  
  // Estados para edição inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdit, setNomeEdit] = useState('');
  const [numeroEdit, setNumeroEdit] = useState('');

  // Estados para busca e paginação
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estado para mostrar/ocultar formulário
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estado para o modal de importação
  const [mostrarImportacao, setMostrarImportacao] = useState(false);

  const fetchContatos = () => {
    setLoading(true);
    fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`)
      .then(res => res.json())
      .then(data => {
        setContatos(data.contatos || []);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao buscar contatos');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (cliente && idInstancia) fetchContatos();
  }, [cliente, idInstancia]);

  // Filtrar contatos baseado na busca
  const contatosFiltrados = useMemo(() => {
    let resultado = contatos;
    
    // Filtrar por busca se houver termo
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = contatos.filter(contato => 
        contato.nome.toLowerCase().includes(termoBusca) ||
        contato.numero.includes(termoBusca)
      );
    }
    
    // Ordenar alfabeticamente por nome
    return resultado.sort((a, b) => 
      a.nome.toLowerCase().localeCompare(b.nome.toLowerCase())
    );
  }, [contatos, busca]);

  // Calcular paginação
  const totalPaginas = Math.ceil(contatosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const contatosPaginados = contatosFiltrados.slice(indiceInicio, indiceFim);

  // Reset página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const adicionarContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !numero.trim()) return;
    
    await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, numero }),
    });
    
    setNome('');
    setNumero('');
    setMostrarFormulario(false); // Fechar formulário após adicionar
    fetchContatos();
  };

  const cancelarAdicao = () => {
    setNome('');
    setNumero('');
    setMostrarFormulario(false);
  };

  const iniciarEdicao = (contato: Contato) => {
    setEditandoId(contato.id);
    setNomeEdit(contato.nome);
    setNumeroEdit(contato.numero);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNomeEdit('');
    setNumeroEdit('');
  };

  const salvarEdicao = async (id: string) => {
    if (!nomeEdit.trim() || !numeroEdit.trim()) return;
    
    await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nome: nomeEdit, numero: numeroEdit }),
    });
    
    setEditandoId(null);
    setNomeEdit('');
    setNumeroEdit('');
    fetchContatos();
  };

  const removerContato = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este contato?')) return;
    
    await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchContatos();
  };

  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  const gerarNumerosPaginas = () => {
    const numeros = [];
    const maxPaginas = 5; // Máximo de números de página para mostrar
    const metade = Math.floor(maxPaginas / 2);
    
    let inicio = Math.max(1, paginaAtual - metade);
    let fim = Math.min(totalPaginas, inicio + maxPaginas - 1);
    
    // Ajustar início se estiver muito próximo do fim
    if (fim - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fim - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fim; i++) {
      numeros.push(i);
    }
    
    return numeros;
  };

  return (
    <div className="agenda-bg">
      <button className="voltar-btn" onClick={() => router.push(`/zcampanha/${cliente}/instancias/${idInstancia}`)}>
        &larr; Voltar
      </button>
      
      <div className="agenda-container">
        <div className="header-container">
          <h2>Agenda da Instância</h2>
          
          <div className="header-actions">
            {!mostrarFormulario && (
              <>
                <button 
                  onClick={() => setMostrarImportacao(true)}
                  className="btn-importar"
                >
                  <Icons.FiUpload size={18} />
                  Importar Contatos
                </button>
                
                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="btn-mostrar-formulario"
                >
                  <Icons.FiPlus size={18} />
                  Adicionar Contato
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Formulário de adicionar contato (condicional) */}
        {mostrarFormulario && (
          <form onSubmit={adicionarContato} className="agenda-form">
            <div className="form-header">
              <h3>Novo Contato</h3>
              <button 
                type="button" 
                onClick={cancelarAdicao}
                className="btn-fechar-form"
                title="Cancelar"
              >
                <Icons.FiX size={18} />
              </button>
            </div>
            
            <div className="form-inputs">
              <input
                placeholder="Nome do contato"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                className="form-input"
                autoFocus
              />
              <input
                placeholder="Número (ex: 5511999999999)"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-adicionar">
                <Icons.FiPlus size={16} />
                Adicionar Contato
              </button>
              <button type="button" onClick={cancelarAdicao} className="btn-cancelar-form">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Barra de busca e controles */}
        <div className="controles-container">
          <div className="busca-container">
            <Icons.FiSearch className="busca-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="busca-input"
            />
          </div>
          
          <div className="itens-por-pagina">
            <label>Mostrar:</label>
            <select
              value={itensPorPagina}
              onChange={e => setItensPorPagina(Number(e.target.value))}
              className="select-itens"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>por página</span>
          </div>
        </div>

        {/* Informações dos resultados */}
        {!loading && (
          <div className="info-resultados">
            {busca ? (
              <span>
                Mostrando {contatosFiltrados.length} de {contatos.length} contatos
                {contatosFiltrados.length > 0 && ` (página ${paginaAtual} de ${totalPaginas})`}
              </span>
            ) : (
              <span>
                Total: {contatos.length} contatos
                {contatos.length > 0 && ` (página ${paginaAtual} de ${totalPaginas})`}
              </span>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="status-message loading">Carregando contatos...</div>
        ) : erro ? (
          <div className="status-message error">{erro}</div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="status-message empty">
            {busca ? (
              <>Nenhum contato encontrado para "{busca}"</>
            ) : (
              <>Nenhum contato na agenda. Adicione o primeiro contato acima!</>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="agenda-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Número</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contatosPaginados.map(contato => (
                    <tr key={contato.id} className={editandoId === contato.id ? 'editando' : ''}>
                      <td>
                        {editandoId === contato.id ? (
                          <input
                            value={nomeEdit}
                            onChange={e => setNomeEdit(e.target.value)}
                            className="edit-input"
                            autoFocus
                          />
                        ) : (
                          <span className="contato-nome">{contato.nome}</span>
                        )}
                      </td>
                      <td>
                        {editandoId === contato.id ? (
                          <input
                            value={numeroEdit}
                            onChange={e => setNumeroEdit(e.target.value)}
                            className="edit-input"
                          />
                        ) : (
                          <span className="contato-numero">{contato.numero}</span>
                        )}
                      </td>
                      <td>
                        {editandoId === contato.id ? (
                          <div className="edit-actions">
                            <button
                              onClick={() => salvarEdicao(contato.id)}
                              className="btn-salvar"
                              title="Salvar alterações"
                            >
                              <Icons.FiCheck size={16} />
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              className="btn-cancelar"
                              title="Cancelar edição"
                            >
                              <Icons.FiX size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="row-actions">
                            <button
                              onClick={() => iniciarEdicao(contato)}
                              className="btn-editar"
                              title="Editar contato"
                            >
                              <Icons.FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => removerContato(contato.id)}
                              className="btn-remover"
                              title="Remover contato"
                            >
                              <Icons.FiTrash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="paginacao">
                <button
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="btn-pagina btn-anterior"
                >
                  <Icons.FiChevronLeft size={16} />
                  Anterior
                </button>

                <div className="numeros-pagina">
                  {paginaAtual > 1 && (
                    <button
                      onClick={() => irParaPagina(1)}
                      className="btn-numero"
                    >
                      1
                    </button>
                  )}
                  
                  {paginaAtual > 3 && <span className="reticencias">...</span>}
                  
                  {gerarNumerosPaginas().map(numero => (
                    <button
                      key={numero}
                      onClick={() => irParaPagina(numero)}
                      className={`btn-numero ${numero === paginaAtual ? 'ativo' : ''}`}
                    >
                      {numero}
                    </button>
                  ))}
                  
                  {paginaAtual < totalPaginas - 2 && <span className="reticencias">...</span>}
                  
                  {paginaAtual < totalPaginas && (
                    <button
                      onClick={() => irParaPagina(totalPaginas)}
                      className="btn-numero"
                    >
                      {totalPaginas}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="btn-pagina btn-proximo"
                >
                  Próximo
                  <Icons.FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de importação */}
      {mostrarImportacao && (
        <ImportarContatos
          cliente={cliente}
          idInstancia={idInstancia}
          onSucesso={() => {
            fetchContatos();
            setMostrarImportacao(false);
          }}
          onFechar={() => setMostrarImportacao(false)}
        />
      )}
      
      <style jsx>{`
        .agenda-bg {
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

        .agenda-container {
          background: #23232b;
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 1000px;
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

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-importar {
          background: #7c3aed;
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

        .btn-importar:hover {
          background: #6d28d9;
        }

        .btn-mostrar-formulario {
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

        .btn-mostrar-formulario:hover {
          background: #16a34a;
        }

        .agenda-form {
          background: #1e2328;
          border-radius: 12px;
          border: 1px solid #31313d;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .form-header h3 {
          color: #7dd3fc;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .btn-fechar-form {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-fechar-form:hover {
          background: #dc2626;
        }

        .form-inputs {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-input {
          flex: 1;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #7dd3fc;
        }

        .form-input::placeholder {
          color: #71717a;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .btn-adicionar {
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

        .btn-adicionar:hover {
          background: #16a34a;
        }

        .btn-cancelar-form {
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

        .btn-cancelar-form:hover {
          background: #4b5563;
        }

        .controles-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
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

        .itens-por-pagina {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #bfc7d5;
          white-space: nowrap;
        }

        .select-itens {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px 12px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }

        .select-itens:focus {
          border-color: #7dd3fc;
        }

        .info-resultados {
          margin-bottom: 16px;
          color: #bfc7d5;
          font-size: 0.9rem;
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

        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #31313d;
          margin-bottom: 24px;
        }

        .agenda-table {
          width: 100%;
          border-collapse: collapse;
          background: #1e2328;
        }

        .agenda-table th {
          background: #2d2d38;
          color: #7dd3fc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          font-size: 1rem;
          border-bottom: 2px solid #31313d;
        }

        .agenda-table td {
          padding: 16px;
          border-bottom: 1px solid #31313d;
          vertical-align: middle;
        }

        .agenda-table tr:hover {
          background: #252a30;
        }

        .agenda-table tr.editando {
          background: rgba(125, 211, 252, 0.05);
          border: 1px solid rgba(125, 211, 252, 0.2);
        }

        .contato-nome {
          font-weight: 500;
          color: #fff;
        }

        .contato-numero {
          color: #7dd3fc;
          font-family: monospace;
        }

        .edit-input {
          background: #18181b;
          border: 2px solid #7dd3fc;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.95rem;
          color: #fff;
          outline: none;
          width: 100%;
        }

        .edit-input:focus {
          border-color: #22c55e;
        }

        .row-actions, .edit-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-editar {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-editar:hover {
          background: #6d28d9;
        }

        .btn-remover {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-remover:hover {
          background: #dc2626;
        }

        .btn-salvar {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-salvar:hover {
          background: #16a34a;
        }

        .btn-cancelar {
          background: #6b7280;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-cancelar:hover {
          background: #4b5563;
        }

        .paginacao {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
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

        .numeros-pagina {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0 16px;
        }

        .btn-numero {
          background: #23232b;
          color: #bfc7d5;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 40px;
        }

        .btn-numero:hover {
          background: #2d2d38;
          color: #7dd3fc;
        }

        .btn-numero.ativo {
          background: #7dd3fc;
          color: #18181b;
          border-color: #7dd3fc;
        }

        .reticencias {
          color: #71717a;
          padding: 0 8px;
        }

        @media (max-width: 768px) {
          .agenda-container {
            padding: 20px;
          }

          .header-container {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .form-inputs {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .controles-container {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .busca-container {
            max-width: none;
          }

          .paginacao {
            flex-wrap: wrap;
            gap: 4px;
          }

          .numeros-pagina {
            margin: 0 8px;
          }

          .btn-pagina {
            padding: 6px 12px;
            font-size: 0.8rem;
          }

          .btn-numero {
            padding: 6px 10px;
            font-size: 0.8rem;
            min-width: 36px;
          }

          .agenda-table th,
          .agenda-table td {
            padding: 12px 8px;
            font-size: 0.9rem;
          }

          .row-actions, .edit-actions {
            flex-direction: column;
            gap: 4px;
          }

          .header-actions {
            justify-content: stretch;
          }

          .btn-importar,
          .btn-mostrar-formulario {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AgendaPage;
