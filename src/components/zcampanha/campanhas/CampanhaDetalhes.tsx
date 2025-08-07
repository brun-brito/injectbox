import React from 'react';
import * as Icons from 'react-icons/fi';
import * as Type from '@/types/Campanha';
import Image from 'next/image';

interface CampanhaDetalhesProps {
  campanha: {
    id: string;
    nome: string;
    status: Type.StatusCampanha;
    conteudo: {
      tipo: 'texto' | 'imagem' | 'botoes';
      texto?: string;
      imagem?: string;
      legenda?: string;
      botoes?: { label: string }[];
    };
    estatisticas: {
      totalContatos: number;
      sucessos: number;
      erros: number;
      percentualSucesso: number;
    };
    logs?: {
      contatoId?: string;
      nomeContato: string;
      numeroContato: string;
      status: 'sucesso' | 'erro' | 'pendente' | 'enviando';
      mensagemErro?: string;
      variacaoUsada?: { indice: number; conteudo: string };
      tentativas: number;
      codigoResposta?: number;
      tempoResposta?: number;
      ultimaTentativa?: number;
    }[];
    dataCriacao: number;
    dataInicio?: number;
    dataConclusao?: number;
  } | null;
  onFechar: () => void;
  buscaLog: string;
  setBuscaLog: (busca: string) => void;
  filtroStatusLog: 'sucesso' | 'erro' | '';
  setFiltroStatusLog: (filtro: 'sucesso' | 'erro' | '') => void;
  getCorStatus: (status: Type.StatusCampanha) => string;
  traduzirStatus: (status: Type.StatusCampanha) => string;
  renderizarTextoComVariaveis: (texto: string) => string;
  formatarData: (timestamp: number) => string;
  logsFiltrados: {
    contatoId?: string;
    nomeContato: string;
    numeroContato: string;
    status: 'sucesso' | 'erro' | 'pendente' | 'enviando';
    mensagemErro?: string;
    variacaoUsada?: { indice: number; conteudo: string };
    tentativas: number;
    codigoResposta?: number;
    tempoResposta?: number;
    ultimaTentativa?: number;
  }[];
}

const CampanhaDetalhes: React.FC<CampanhaDetalhesProps> = ({
  campanha,
  onFechar,
  buscaLog,
  setBuscaLog,
  filtroStatusLog,
  setFiltroStatusLog,
  getCorStatus,
  traduzirStatus,
  renderizarTextoComVariaveis,
  formatarData,
  logsFiltrados
}) => {
  if (!campanha) return null;

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-content modal-detalhes" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{campanha.nome}</h3>
          <button onClick={onFechar} className="btn-fechar-modal">
            <Icons.FiX size={20} />
          </button>
        </div>
        
        <div className="detalhes-content">
          <div className="detalhes-info">
            <div className="info-item">
              <strong>Status:</strong>
              <span 
                className="status-badge"
                style={{ backgroundColor: getCorStatus(campanha.status) }}
              >
                {traduzirStatus(campanha.status)}
              </span>
            </div>
            
            <div className="info-item">
              <strong>Mensagem:</strong>
              <div className="mensagem-preview">
                {campanha.conteudo.tipo === 'texto' && (
                  <div 
                    className="preview-texto"
                    dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(campanha.conteudo.texto || '') }}
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                )}
                
                {campanha.conteudo.tipo === 'imagem' && (
                  <div className="preview-imagem">
                    {campanha.conteudo.imagem && (
                      <div className="imagem-container">
                        <Image 
                          src={campanha.conteudo.imagem} 
                          alt="Imagem da campanha" 
                          width={200} 
                          height={150} 
                          className="preview-img-detalhes"
                        />
                      </div>
                    )}
                    {campanha.conteudo.legenda && (
                      <div className="legenda-container">
                        <strong>Legenda:</strong>
                        <div 
                          className="legenda-texto"
                          dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(campanha.conteudo.legenda) }}
                          style={{ whiteSpace: 'pre-wrap' }}
                        />
                      </div>
                    )}
                    {!campanha.conteudo.legenda && (
                      <div className="sem-legenda">
                        <em>Imagem sem legenda</em>
                      </div>
                    )}
                  </div>
                )}
                
                {campanha.conteudo.tipo === 'botoes' && (
                  <div className="preview-botoes">
                    <div className="texto-botoes">
                      <div 
                        className="texto-principal"
                        dangerouslySetInnerHTML={{ __html: renderizarTextoComVariaveis(campanha.conteudo.texto || '') }}
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                    </div>
                    
                    {campanha.conteudo.botoes && campanha.conteudo.botoes.length > 0 && (
                      <div className="botoes-container">
                        <strong>Botões:</strong>
                        <div className="botoes-lista">
                          {campanha.conteudo.botoes.map((botao, index) => (
                            <div key={index} className="botao-preview">
                              <div className="botao-info">
                                <span className="botao-label">{botao.label}</span>
                                <span className="botao-tipo">
                                  <Icons.FiMessageCircle size={12} />
                                  Resposta
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
                <div>Total: {campanha.estatisticas.totalContatos}</div>
                <div>Sucessos: {campanha.estatisticas.sucessos}</div>
                <div>Erros: {campanha.estatisticas.erros}</div>
                <div>Taxa de sucesso: {campanha.estatisticas.percentualSucesso.toFixed(1)}%</div>
              </div>
            </div>

            {/* Mostrar logs detalhados para campanhas concluídas */}
            {['concluida', 'pausada', 'cancelada'].includes(campanha.status) && campanha.logs && campanha.logs.length > 0 && (
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
                    onChange={e => setFiltroStatusLog(e.target.value as 'sucesso' | 'erro' | '')}
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
                <div>Criada em: {formatarData(campanha.dataCriacao)}</div>
                {campanha.dataInicio && (
                  <div>Iniciada em: {formatarData(campanha.dataInicio)}</div>
                )}
                {campanha.dataConclusao && (
                  <div>Concluída em: {formatarData(campanha.dataConclusao)}</div>
                )}
                {campanha.dataInicio && campanha.dataConclusao && (
                  <div>
                  {(() => {
                    const duracaoMs = campanha.dataConclusao - campanha.dataInicio;
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
  );
};

export default CampanhaDetalhes;
