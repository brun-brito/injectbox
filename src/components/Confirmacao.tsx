import React from 'react';
import { FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi';

interface ConfirmacaoProps {
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: 'warning' | 'danger' | 'info';
}

const Confirmacao: React.FC<ConfirmacaoProps> = ({ 
  titulo,
  mensagem, 
  onConfirmar, 
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'warning'
}) => {
  const getIconeETema = () => {
    switch (tipo) {
      case 'danger':
        return {
          icone: <FiX size={24} />,
          cor: '#ef4444',
          gradiente: 'linear-gradient(135deg, #ef4444, #dc2626)'
        };
      case 'info':
        return {
          icone: <FiCheck size={24} />,
          cor: '#3b82f6',
          gradiente: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
        };
      default: // warning
        return {
          icone: <FiAlertTriangle size={24} />,
          cor: '#f59e0b',
          gradiente: 'linear-gradient(135deg, #f59e0b, #d97706)'
        };
    }
  };

  const tema = getIconeETema();

  return (
    <div className="confirmacao-overlay">
      <div className="confirmacao-container">
        <div className="confirmacao-header">
          <div className="confirmacao-icon" style={{ background: tema.gradiente }}>
            {tema.icone}
          </div>
          <div className="confirmacao-titulo-area">
            <h3 className="confirmacao-titulo">{titulo}</h3>
            <button 
              className="confirmacao-close-btn" 
              onClick={onCancelar}
              aria-label="Fechar confirmação"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className="confirmacao-content">
          <div className="confirmacao-mensagem">
            {mensagem.split('\n').map((linha, index) => (
              <div key={index}>{linha}</div>
            ))}
          </div>
        </div>
        
        <div className="confirmacao-actions">
          <button 
            className="btn-cancelar"
            onClick={onCancelar}
          >
            {textoCancelar}
          </button>
          <button 
            className="btn-confirmar"
            onClick={onConfirmar}
            style={{ backgroundColor: tema.cor }}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .confirmacao-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .confirmacao-container {
          background: white;
          border-radius: 12px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: confirmacaoSlideIn 0.3s ease-out;
          overflow: hidden;
        }

        @keyframes confirmacaoSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .confirmacao-header {
          padding: 24px 24px 16px 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .confirmacao-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .confirmacao-titulo-area {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          min-width: 0;
        }

        .confirmacao-titulo {
          color: #111827;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          line-height: 1.4;
        }

        .confirmacao-close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .confirmacao-close-btn:hover {
          background: #f3f4f6;
          color: #6b7280;
          transform: scale(1.1);
        }

        .confirmacao-close-btn:active {
          transform: scale(0.95);
        }

        .confirmacao-content {
          padding: 0 24px 24px 24px;
        }

        .confirmacao-mensagem {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.6;
        }

        .confirmacao-mensagem div {
          margin-bottom: 8px;
        }

        .confirmacao-mensagem div:last-child {
          margin-bottom: 0;
        }

        .confirmacao-actions {
          padding: 16px 24px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancelar {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
        }

        .btn-cancelar:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-cancelar:active {
          transform: scale(0.98);
        }

        .btn-confirmar {
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
        }

        .btn-confirmar:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-confirmar:active {
          transform: scale(0.98);
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .confirmacao-overlay {
            padding: 12px;
          }
          
          .confirmacao-header {
            padding: 20px 20px 12px 20px;
            gap: 12px;
          }
          
          .confirmacao-content {
            padding: 0 20px 20px 20px;
          }
          
          .confirmacao-actions {
            padding: 12px 20px 20px 20px;
            flex-direction: column-reverse;
          }
          
          .btn-cancelar,
          .btn-confirmar {
            width: 100%;
            justify-content: center;
          }
          
          .confirmacao-icon {
            width: 40px;
            height: 40px;
          }
          
          .confirmacao-titulo {
            font-size: 16px;
          }
          
          .confirmacao-mensagem {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Confirmacao;
