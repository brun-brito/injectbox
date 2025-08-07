import React, { useMemo } from 'react';
import * as Icons from 'react-icons/fi';
import * as Type from "@/types/Campanha";

interface Grupo {
  id: string;
  nome: string;
  cor: string;
  totalContatos: number;
  contatos: string[];
}

interface ModaisSelecaoProps {
  // Modal de contatos
  modalContatos: boolean;
  setModalContatos: (aberto: boolean) => void;
  contatos: Type.Contato[];
  contatosSelecionados: Type.ContatoSelecionado[];
  setContatosSelecionados: (contatos: Type.ContatoSelecionado[]) => void;
  buscaContatos: string;
  setBuscaContatos: (busca: string) => void;
  
  // Modal de grupos
  modalGrupos: boolean;
  setModalGrupos: (aberto: boolean) => void;
  grupos: Grupo[];
  gruposSelecionados: string[];
  setGruposSelecionados: (grupos: string[]) => void;
  aplicarSelecaoGrupos: () => void;
}

const ModaisSelecao: React.FC<ModaisSelecaoProps> = ({
  modalContatos,
  setModalContatos,
  contatos,
  contatosSelecionados,
  setContatosSelecionados,
  buscaContatos,
  setBuscaContatos,
  modalGrupos,
  setModalGrupos,
  grupos,
  gruposSelecionados,
  setGruposSelecionados,
  aplicarSelecaoGrupos,
}) => {
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
      setContatosSelecionados(
        contatosSelecionados.filter(contato => !idsParaRemover.has(contato.id))
      );
    } else {
      // Marcar todos os contatos filtrados que ainda não estão selecionados
      const novosContatos = contatosFiltradosOrdenados.filter(contato =>
        !contatosSelecionados.some(selecionado => selecionado.id === contato.id)
      );
      setContatosSelecionados([...contatosSelecionados, ...novosContatos]);
    }
  };

  // Função para limpar busca quando modal for fechado
  const fecharModalContatos = () => {
    setModalContatos(false);
    setBuscaContatos('');
  };

  return (
    <>
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
                      Nenhum contato encontrado para &quot;{buscaContatos}&quot;
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
                  <p>Crie grupos na seção &quot;Grupos de Usuários&quot; para organizá-los aqui.</p>
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
                            setGruposSelecionados([...gruposSelecionados, grupo.id]);
                          } else {
                            setGruposSelecionados(gruposSelecionados.filter((gId: string) => gId !== grupo.id));
                          }
                        }}
                      />
                      <div className="grupo-item">
                        <div 
                          className="grupo-cor-indicator" 
                          style={{ backgroundColor: grupo.cor }}
                        ></div>
                        <div className="grupo-details">
                          <span className="grupo-nome">Grupo &quot;{grupo.nome}&quot;</span>
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
    </>
  );
};

export default ModaisSelecao;
