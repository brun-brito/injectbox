import React from 'react';
import { FiXCircle, FiX } from 'react-icons/fi';

type ErroProps = {
  mensagem: string;
  onClose: () => void;
};

const Erro = ({ mensagem, onClose }: ErroProps) => {
  if (!mensagem) return null;

  return (
    <>
      <div className="erro-overlay" onClick={onClose}>
        <div className="erro-modal" onClick={e => e.stopPropagation()}>
          <div className="erro-header">
            <FiXCircle size={48} className="erro-icon" />
            <h2>Ocorreu um Erro</h2>
            <button onClick={onClose} className="btn-fechar-erro">
              <FiX size={24} />
            </button>
          </div>
          <div className="erro-body">
            <p>{mensagem || 'Não foi possível completar a operação. Tente novamente mais tarde.'}</p>
          </div>
          <div className="erro-footer">
            <button onClick={onClose} className="btn-ok">
              Entendi
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
  .erro-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(24, 24, 27, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .erro-modal {
    background: #1e2328;
    border-radius: 16px;
    border: 1px solid #ef4444;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    width: 90%;
    max-width: 450px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: slideUp 0.4s ease-out;
    position: relative;
  }

  @keyframes slideUp {
    from { transform: translateY(20px) scale(0.95); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  .erro-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    color: #f87171;
  }

  .erro-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #fff;
  }

  .erro-icon {
    stroke-width: 1.5;
  }

  .btn-fechar-erro {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #71717a;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .btn-fechar-erro:hover {
    background: #3f3f46;
    color: #fff;
  }

  .erro-body {
    color: #d4d4d8;
    font-size: 1rem;
    line-height: 1.6;
    text-align: center;
    padding: 8px 0;
  }

  .erro-footer {
    display: flex;
    justify-content: center;
  }

  .btn-ok {
    background: #ef4444;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
  }

  .btn-ok:hover {
    background: #dc2626;
  }
`}</style>
    </>
  );
};

export default Erro;
