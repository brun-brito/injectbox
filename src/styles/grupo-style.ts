export const grupoStyle =
    `
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

        .selecao-rapida {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .btn-selecao-rapida {
          background: #31313d;
          color: #7dd3fc;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-selecao-rapida:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-selecao-rapida:hover:not(:disabled) {
          background: #23232b;
          color: #38bdf8;
        }

        .input-qtd-selecao {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 8px;
          font-size: 0.9rem;
          color: #fff;
          outline: none;
          width: 70px;
        }

        .input-qtd-selecao:focus {
          border-color: #7dd3fc;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #7dd3fc;
          border-radius: 50%;
          display: inline-block;
          animation: spin 1s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
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
          
        .btn-criar-subgrupo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-criar-subgrupo:disabled {
          background: #a7f3d0;
          color: #666;
          cursor: not-allowed;
        }

        .btn-criar-subgrupo:hover:not(:disabled) {
          background: #059669;
        }
      `