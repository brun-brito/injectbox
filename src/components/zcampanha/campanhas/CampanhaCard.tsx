import React from 'react';
import * as Icons from 'react-icons/fi';
import { Campanha, StatusCampanha } from '@/types/Campanha';

type CampanhaCardProps = {
  campanha: Campanha;
  onVerDetalhes: (campanha: Campanha) => void;
  onEditar?: (campanha: Campanha) => void;
  onIniciarEnvio?: (id: string) => void;
  onRetomar?: (id: string) => void;
  onPausar?: (id: string) => void;
  onCancelar?: (id: string) => void;
  onDeletar?: (id: string) => void;
  enviandoCampanha?: string | null;
  pausandoCampanha?: string | null;
  cancelandoCampanha?: string | null;
  getCorStatus: (status: StatusCampanha) => string;
  traduzirStatus: (status: StatusCampanha) => string;
};

export const CampanhaCard: React.FC<CampanhaCardProps> = ({
  campanha,
  onVerDetalhes,
  onEditar,
  onIniciarEnvio,
  onRetomar,
  onPausar,
  onCancelar,
  onDeletar,
  enviandoCampanha,
  pausandoCampanha,
  cancelandoCampanha,
  getCorStatus,
  traduzirStatus,
}) => {
  return (
    <div className="campanha-card">
      <div className="campanha-header">
        <h3>{campanha.nome}</h3>
        <div 
          className="status-badge"
          style={{ backgroundColor: getCorStatus(campanha.status) }}
        >
          {traduzirStatus(campanha.status)}
        </div>
      </div>
      
      {campanha.descricao && (
        <p className="campanha-descricao">{campanha.descricao}</p>
      )}
      
      <div className="campanha-stats">
        <div className="stat-item">
          <Icons.FiUsers size={16} />
          <span>{campanha.estatisticas.totalContatos} contatos</span>
        </div>
        <div className="stat-item">
          <Icons.FiCheck size={16} style={{ color: "green" }}/>
          <span>{campanha.estatisticas.sucessos} sucessos</span>
        </div>
        <div className="stat-item">
          <Icons.FiX size={16} style={{ color: "red" }}/>
          <span>{campanha.estatisticas.erros} erros</span>
        </div>
      </div>
      
      <div className="campanha-info">
        <small>Criada em: {new Date(campanha.dataCriacao).toLocaleString('pt-BR')}</small>
        {campanha.dataInicio && (
          <small>Iniciada em: {new Date(campanha.dataInicio).toLocaleString('pt-BR')}</small>
        )}
        {campanha.status === 'pausada' && (
          <small> Pausada em: {campanha.pausadaEm ? new Date(campanha.pausadaEm).toLocaleString('pt-BR') : '-'}</small>
        )}
        {/* Exibir estimativa de tempo se disponível */}
        {((campanha.status === 'enviando' || campanha.status === 'pausada') && (campanha.tempoEstimado || campanha.progresso?.tempoEstimado)) && (
          <small>
            Tempo restante estimado: {campanha.tempoEstimado || campanha.progresso?.tempoEstimado}
          </small>
        )}
      </div>
      
      <div className="campanha-actions">
        <button
          onClick={() => onVerDetalhes(campanha)}
          className="btn-acao ver"
          title={campanha.status === 'enviando' ? 'Acompanhar progresso' : 'Ver detalhes'}
        >
          <Icons.FiEye size={16} />
        </button>
        
        {campanha.status === 'rascunho' && onEditar && (
          <button
            onClick={() => onEditar(campanha)}
            className="btn-acao editar"
            title="Editar campanha"
          >
            <Icons.FiEdit2 size={16} />
          </button>
        )}
        
        {['rascunho', 'pausada'].includes(campanha.status) && (onIniciarEnvio || onRetomar) && (
          <button
            onClick={() => campanha.status === 'pausada' ? onRetomar?.(campanha.id!) : onIniciarEnvio?.(campanha.id!)}
            disabled={enviandoCampanha === campanha.id}
            className={`btn-acao ${campanha.status === 'pausada' ? 'retomar' : 'iniciar'}`}
            title={campanha.status === 'pausada' ? 'Retomar campanha' : 'Iniciar campanha'}
          >
            {enviandoCampanha === campanha.id ? (
              <div className="loading-spinner" />
            ) : (
              <Icons.FiPlay size={16} />
            )}
          </button>
        )}
        
        {campanha.status === 'enviando' && (
          <>
            {onPausar && (
              <button
                onClick={() => onPausar(campanha.id!)}
                disabled={pausandoCampanha === campanha.id}
                className="btn-acao pausar"
                title="Pausar campanha"
              >
                {pausandoCampanha === campanha.id ? (
                  <div className="loading-spinner" />
                ) : (
                  <Icons.FiPause size={16} />
                )}
              </button>
            )}
            {onCancelar && (
              <button
                onClick={() => onCancelar(campanha.id!)}
                disabled={cancelandoCampanha === campanha.id}
                className="btn-acao cancelar-envio"
                title="Cancelar envio (irreversível)"
              >
                {cancelandoCampanha === campanha.id ? (
                  <div className="loading-spinner" />
                ) : (
                  <Icons.FiSquare size={16} />
                )}
              </button>
            )}
          </>
        )}
        {/* Adicionar botão de cancelar para status pausada */}
        {campanha.status === 'pausada' && onCancelar && (
          <button
            onClick={() => onCancelar(campanha.id!)}
            disabled={cancelandoCampanha === campanha.id}
            className="btn-acao cancelar-envio"
            title="Cancelar envio (irreversível)"
          >
            {cancelandoCampanha === campanha.id ? (
              <div className="loading-spinner" />
            ) : (
              <Icons.FiSquare size={16} />
            )}
          </button>
        )}
        
        {['rascunho', 'pausada', 'cancelada'].includes(campanha.status) && onDeletar && (
          <button
            onClick={() => onDeletar(campanha.id!)}
            className="btn-acao deletar"
            title="Deletar campanha"
          >
            <Icons.FiTrash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CampanhaCard;