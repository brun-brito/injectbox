import React from 'react';
import { FiInfo, FiX } from 'react-icons/fi';

interface AvisoProps {
  mensagem: string;
  onClose: () => void;
}

const Aviso: React.FC<AvisoProps> = ({ mensagem, onClose }) => {
  if (!mensagem) return null;

  return (
    <div className="aviso-overlay">
      <div className="aviso-container">
        <div className="aviso-icon">
          <FiInfo size={24} />
        </div>
        <div className="aviso-content">
          <div className="aviso-mensagem">
            {mensagem.split('\n').map((linha, index) => (
              <div key={index}>{linha}</div>
            ))}
          </div>
        </div>
        <button 
          className="aviso-close-btn" 
          onClick={onClose}
          aria-label="Fechar aviso"
        >
          <FiX size={20} />
        </button>
      </div>
      
      <style jsx>{`
        .aviso-overlay {
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

        .aviso-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          gap: 16px;
          align-items: flex-start;
          position: relative;
          animation: avisoSlideIn 0.3s ease-out;
        }

        @keyframes avisoSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .aviso-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .aviso-content {
          flex: 1;
          min-width: 0;
        }

        .aviso-mensagem {
          color: #374151;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        .aviso-mensagem div {
          margin-bottom: 8px;
        }

        .aviso-mensagem div:last-child {
          margin-bottom: 0;
        }

        .aviso-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
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
        }

        .aviso-close-btn:hover {
          background: #f3f4f6;
          color: #6b7280;
          transform: scale(1.1);
        }

        .aviso-close-btn:active {
          transform: scale(0.95);
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .aviso-overlay {
            padding: 12px;
          }
          
          .aviso-container {
            padding: 20px;
            gap: 12px;
          }
          
          .aviso-icon {
            width: 36px;
            height: 36px;
          }
          
          .aviso-mensagem {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Aviso;
