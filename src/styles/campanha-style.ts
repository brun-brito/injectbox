export const campanhaStyle = `
        .campanhas-bg {
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

        .campanhas-container {
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

        .btn-criar-campanha {
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

        .btn-criar-campanha:hover {
          background: #16a34a;
        }

        .controles-container {
          display: flex;
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

        .filtro-status {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          cursor: pointer;
          min-width: 180px;
        }

        .status-message {
          text-align: center;
          padding: 48px;
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

        .campanhas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .campanha-card {
          background: #1e2328;
          border-radius: 12px;
          border: 1px solid #31313d;
          padding: 20px;
          transition: all 0.2s;
        }

        .campanha-card:hover {
          border-color: #7dd3fc;
          transform: translateY(-2px);
        }

        .campanha-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .campanha-header h3 {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
          margin-right: 12px;
        }

        .status-badge {
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .campanha-descricao {
          color: #bfc7d5;
          font-size: 0.9rem;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .campanha-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #bfc7d5;
          font-size: 0.85rem;
        }

        .campanha-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
        }

        .campanha-info small {
          color: #71717a;
          font-size: 0.8rem;
        }

        .campanha-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-acao {
          background: none;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-acao.ver {
          color: #7dd3fc;
          border-color: #7dd3fc;
        }

        .btn-acao.ver:hover {
          background: rgba(125, 211, 252, 0.1);
        }

        .btn-acao.editar {
          color: #fbbf24;
          border-color: #fbbf24;
        }

        .btn-acao.editar:hover {
          background: rgba(251, 191, 36, 0.1);
        }

        .btn-acao.iniciar, .btn-acao.retomar {
          color: #22c55e;
          border-color: #22c55e;
        }

        .btn-acao.iniciar:hover, .btn-acao.retomar:hover {
          background: rgba(34, 197, 94, 0.1);
        }

        .btn-acao.pausar {
          color: #f59e0b;
          border-color: #f59e0b;
        }

        .btn-acao.pausar:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .btn-acao.deletar {
          color: #ef4444;
          border-color: #ef4444;
        }

        .btn-acao.deletar:hover {
          background: rgba(239, 68, 68, 0.1);
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #23232b;
          border-radius: 12px;
          border: 2px solid #31313d;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-criar {
          width: 90%;
          max-width: 600px;
          padding: 32px;
        }

        .modal-contatos {
          width: 90%;
          max-width: 500px;
          padding: 24px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-detalhes {
          width: 90%;
          max-width: 700px;
          padding: 24px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          color: #7dd3fc;
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
        }

        .btn-fechar-modal {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .btn-fechar-modal:hover {
          color: #fff;
        }

        .form-campanha {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: #a1a1aa;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .required-asterisk {
          color: #ef4444;
          margin-left: 4px;
          font-weight: 700;
          font-size: 19px;
        }

        .form-input, .form-textarea {
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .editor-highlight {
          position: relative;
          white-space: pre-wrap;
          word-wrap: break-word;
          caret-color: #fff;
          min-height: 120px;
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 14px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .editor-highlight:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }

        .editor-highlight[contenteditable=true]:empty:before {
          content: attr(placeholder);
          pointer-events: none;
          display: block;
          color: #71717a;
        }

        .editor-highlight .variavel-destacada {
          background: rgba(124, 58, 237, 0.2);
          color: #c084fc;
          padding: 2px 6px;
          border-radius: 5px;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
          font-weight: 600;
          border: 1px solid rgba(124, 58, 237, 0.4);
          display: inline-block;
          margin: 0 1px;
          vertical-align: baseline;
        }

        .editor-highlight .variavel-invalida {
          color: #f87171;
          text-decoration: underline wavy #ef4444;
          text-decoration-skip-ink: none;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-selecionar-contatos {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-selecionar-contatos:hover {
          background: #2563eb;
        }

        .btn-selecionar-contatos:active {
          transform: scale(0.98);
        }

        .contatos-selecionados {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .contato-tag {
          background: #7c3aed;
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 10px;
        }

        .btn-criar, .btn-confirmar {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-criar:hover, .btn-confirmar:hover {
          background: #16a34a;
        }

        .btn-criar:active, .btn-confirmar:active {
          transform: scale(0.98);
        }

        .btn-criar:disabled {
          background: #4b5563;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-cancelar, .btn-acao.cancelar-envio {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }

        .btn-cancelar:hover, .btn-acao.cancelar-envio:hover {
          background: #3f3f46;
          color: #fff;
          border-color: #3f3f46;
        }

        .contatos-lista {
          flex: 1;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 20px;
          border: 1px solid #31313d;
          border-radius: 8px;
          background: #18181b;
        }

        .sem-contatos {
          text-align: center;
          color: #71717a;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .btn-limpar-busca-sem-resultados {
          background: #7dd3fc;
          color: #18181b;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-limpar-busca-sem-resultados:hover {
          background: #0ea5e9;
        }

        .contato-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #31313d;
          cursor: pointer;
          transition: all 0.2s;
        }

        .contato-checkbox:last-child {
          border-bottom: none;
        }

        .contato-checkbox:hover {
          background: #2d2d38;
        }

        .contato-checkbox input {
          margin: 0;
          width: 16px;
          height: 16px;
        }

        .contato-nome {
          color: #fff;
          font-weight: 500;
          flex: 1;
        }

        .contato-numero {
          color: #7dd3fc;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .detalhes-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item strong {
          color: #7dd3fc;
          font-size: 0.9rem;
        }

        .mensagem-preview {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px;
          color: #e5e7eb;
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
          margin-top: 8px;
          min-height: 40px;
          word-wrap: break-word;
        }

        .mensagem-preview:empty::before {
          content: 'Pré-visualização da mensagem...';
          color: #71717a;
          font-style: italic;
        }

        .mensagem-preview .variavel-destacada {
          background: rgba(124, 58, 237, 0.2);
          color: #c084fc;
          padding: 2px 6px;
          border-radius: 5px;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
          font-weight: 600;
          border: 1px solid rgba(124, 58, 237, 0.4);
          display: inline-block;
          margin: 0 1px;
          vertical-align: baseline;
        }

        .mensagem-preview .variavel-invalida {
          color: #f87171;
          text-decoration: underline wavy #ef4444;
          text-decoration-skip-ink: none;
        }

        .stats-detalhes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          color: #bfc7d5;
          font-size: 0.9rem;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px;
          margin-top: 8px;
        }

        .stats-detalhes div {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-controles {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          margin-bottom: 12px;
        }

        .logs-container {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .logs-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr;
          gap: 8px;
          padding: 12px;
          background: #2d2d38;
          font-weight: 600;
          font-size: 0.85rem;
          color: #7dd3fc;
          border-bottom: 1px solid #31313d;
        }

        .logs-body {
          max-height: 300px;
          overflow-y: auto;
        }

        .log-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid #31313d;
          font-size: 0.85rem;
          transition: background 0.2s;
        }

        .log-row:hover {
          background: #252a30;
        }

        .log-row:last-child {
          border-bottom: none;
        }

        .log-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          word-break: break-word;
        }

        .contato-info {
          min-width: 0;
        }

        .contato-nome-log {
          color: #fff;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .contato-numero-log {
          color: #7dd3fc;
          font-family: monospace;
          font-size: 0.8rem;
        }

        .status-log {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.85rem;
          text-transform: capitalize;
        }

        .status-log.status-sucesso {
          color: #22c55e;
        }

        .status-log.status-erro {
          color: #ef4444;
        }

        .status-log.status-pendente {
          color: #fbbf24;
        }

        .status-log.status-enviando {
          color: #3b82f6;
        }

        .erro-detalhes {
          color: #ef4444;
          font-size: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          margin-top: 2px;
          cursor: help;
        }

        .tentativas-count {
          color: #fff;
          font-weight: 500;
        }

        .codigo-resposta {
          color: #bfc7d5;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .tempo-resposta {
          color: #bfc7d5;
          font-family: monospace;
        }

        .data-tentativa {
          color: #bfc7d5;
          font-size: 0.8rem;
        }

        .timing-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #bfc7d5;
          font-size: 0.9rem;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .modal-detalhes {
            width: 95%;
            padding: 16px;
            max-height: 95vh;
          }

          .logs-header,
          .log-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .logs-header {
            display: none;
          }

          .log-row {
            border: 1px solid #31313d;
            border-radius: 6px;
            margin-bottom: 8px;
            padding: 12px;
          }

          .log-col {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
          }

          .log-col::before {
            content: attr(data-label);
            font-weight: 600;
            color: #7dd3fc;
            min-width: 80px;
            font-size: 0.8rem;
          }

          .contato-info::before {
            content: 'Contato:';
          }

          .log-col:nth-child(2)::before {
            content: 'Status:';
          }

          .log-col:nth-child(3)::before {
            content: 'Tentativas:';
          }

          .log-col:nth-child(4)::before {
            content: 'Resposta:';
          }

          .log-col:nth-child(5)::before {
            content: 'Última:';
          }

          .contato-info {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 768px) {
          .campanhas-container {
            padding: 20px;
          }

          .header-container {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .controles-container {
            flex-direction: column;
            gap: 12px;
          }

          .busca-container {
            max-width: none;
          }

          .campanhas-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-criar, .modal-contatos, .modal-detalhes {
            width: 95%;
            padding: 16px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }

        .tipo-mensagem-selector {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .tipo-btn {
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 12px 16px;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .tipo-btn:hover {
          border-color: #7c3aed;
          background: #27272a;
          color: #fff;
        }

        .tipo-btn.ativo {
          border-color: #7c3aed;
          background: #7c3aed;
          color: #fff;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }

        .tipo-btn span {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-hint {
          color: #71717a;
          font-size: 0.8rem;
          margin-top: 4px;
          font-style: italic;
        }

        .image-preview {
          position: relative;
          margin-top: 12px;
          display: inline-block;
        }

        .preview-img {
          max-width: 200px;
          max-height: 150px;
          border-radius: 8px;
          border: 1px solid #31313d;
          object-fit: cover;
        }

        .remove-image-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .botoes-editor {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .botao-item {
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px;
        }

        .botao-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .botao-header span {
          color: #7dd3fc;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .btn-remover-botao {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .botao-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .botao-select,
        .botao-input {
          background: #23232b;
          border: 1px solid #31313d;
          border-radius: 6px;
          padding: 8px 10px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
        }

        .botao-select:focus,
        .botao-input:focus {
          border-color: #7dd3fc;
        }

        .btn-adicionar-botao {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-adicionar-botao:hover {
          background: #6d28d9;
        }

        .busca-contatos-container {
          margin-bottom: 16px;
        }

        .busca-contatos-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .busca-contatos-icon {
          position: absolute;
          left: 12px;
          color: #71717a;
          z-index: 1;
        }

        .busca-contatos-input {
          width: 100%;
          background: #18181b;
          border: 1px solid #31313d;
          border-radius: 8px;
          padding: 12px 16px 12px 40px;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
          padding-right: 40px;
        }

        .busca-contatos-input:focus {
          border-color: #7dd3fc;
        }

        .busca-contatos-input::placeholder {
          color: #71717a;
        }

        .limpar-busca-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .limpar-busca-btn:hover {
          color: #ef4444;
        }

        .controles-selecao {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #1e2328;
          border-radius: 8px;
          border: 1px solid #31313d;
          margin-bottom: 16px;
          gap: 16px;
        }

        .info-selecao {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .total-contatos {
          color: #bfc7d5;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .contatos-selecionados-info {
          color: #7dd3fc;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .acoes-selecao {
          display: flex;
          align-items: center;
        }

        .checkbox-todos {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #bfc7d5;
          font-weight: 500;
        }

        .checkbox-todos input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .checkbox-label {
          user-select: none;
        }

        @media (max-width: 768px) {
          .controles-selecao {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .info-selecao {
            text-align: center;
          }

          .acoes-selecao {
            justify-content: center;
          }

          .modal-contatos {
            width: 95%;
            padding: 16px;
            max-height: 95vh;
          }

          .contatos-lista {
            max-height: 300px;
          }
        }

        .exemplos-botoes-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
          padding: 16px;
          background: #1e2328;
          border-radius: 8px;
          border: 1px solid #31313d;
        }

        .exemplo-botao-item {
          background: #18181b;
          border-radius: 6px;
          padding: 12px;
          border: 1px solid #31313d;
        }

        .exemplo-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: #7dd3fc;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .exemplo-desc {
          color: #bfc7d5;
          font-size: 0.8rem;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .exemplo-visual {
          display: flex;
          justify-content: center;
        }

        .botao-exemplo {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid;
          text-align: center;
          min-width: 120px;
        }

        .botao-exemplo.reply {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
          color: #22c55e;
        }

        .botao-exemplo.call {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .botao-exemplo.url {
          background: rgba(147, 51, 234, 0.1);
          border-color: #9333ea;
          color: #9333ea;
        }

        .exemplo-imagem-container {
          margin-top: 16px;
          padding: 16px;
          background: #1e2328;
          border-radius: 8px;
          border: 1px solid #31313d;
        }

        .exemplo-imagem-header {
          margin-bottom: 12px;
          color: #7dd3fc;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .exemplo-imagem-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #23232b;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #31313d;
        }

        .exemplo-imagem {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          object-fit: contain;
        }

        @media (max-width: 768px) {
          .exemplos-botoes-container {
            padding: 12px;
          }

          .exemplo-botao-item {
            padding: 10px;
          }

          .exemplo-header {
            font-size: 0.85rem;
          }

          .exemplo-desc {
            font-size: 0.75rem;
          }

          .botao-exemplo {
            padding: 6px 12px;
            font-size: 0.8rem;
            min-width: 100px;
          }

          .exemplo-imagem {
            max-height: 250px;
          }

          .exemplo-imagem-container {
            padding: 12px;
          }

          .exemplo-imagem-wrapper {
            padding: 8px;
          }
        }

        .file-input-hidden {
          display: none;
        }

        .image-selector {
          margin-top: 8px;
        }

        .image-upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          border: 2px dashed #31313d;
          border-radius: 12px;
          background: #18181b;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 16px;
          min-height: 140px;
        }

        .image-upload-btn:hover {
          border-color: #7dd3fc;
          background: #1e2328;
          transform: translateY(-2px);
        }

        .upload-icon {
          color: #7dd3fc;
          opacity: 0.7;
          transition: all 0.2s ease;
        }

        .image-upload-btn:hover .upload-icon {
          opacity: 1;
          transform: scale(1.1);
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }

        .upload-title {
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
        }

        .upload-subtitle {
          color: #71717a;
          font-size: 0.85rem;
        }

        .image-preview-container {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .image-preview {
          position: relative;
          display: inline-block;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #31313d;
          background: #18181b;
          padding: 8px;
        }

        .preview-img {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
          object-fit: cover;
          display: block;
        }

        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(239, 68, 68, 0.9);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }

        .remove-image-btn:hover {
          background: #ef4444;
          transform: scale(1.1);
        }

        .image-actions {
          display: flex;
          gap: 8px;
        }

        .change-image-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .change-image-btn:hover {
          background: #6d28d9;
        }

        @media (max-width: 768px) {
          .image-upload-btn {
            padding: 24px 16px;
            min-height: 120px;
          }

          .upload-icon {
            font-size: 28px;
          }

          .upload-title {
            font-size: 0.9rem;
          }

          .upload-subtitle {
            font-size: 0.8rem;
          }

          .preview-img {
            max-height: 160px;
          }
        }

        .input-with-variables {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .variables-button-container {
          position: absolute;
          bottom: 8px;
          right: 8px;
          z-index: 5;
        }

        .variaveis-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 44px;
          height: 40px;
          box-shadow: 
            0 4px 12px rgba(124, 58, 237, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .variaveis-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(255, 255, 255, 0.2), 
            transparent
          );
          transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .variaveis-btn:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 6px 20px rgba(124, 58, 237, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .variaveis-btn:hover::before {
          left: 100%;
        }

        .variaveis-btn:active {
          transform: translateY(-1px) scale(1.01);
          transition: all 0.1s ease;
        }

        .variaveis-btn-icon {
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .variaveis-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: #0f0f0f;
          border: 1px solid #2d2d2d;
          border-radius: 16px;
          box-shadow: 
            0 16px 40px rgba(0, 0, 0, 0.7),
            0 8px 24px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(124, 58, 237, 0.2);
          margin-bottom: 16px;
          min-width: 360px;
          z-index: 20;
          overflow: hidden;
          backdrop-filter: blur(16px) saturate(180%);
          animation: slideUpFadeScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUpFadeScale {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .variaveis-header {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(124, 58, 237, 0.3);
          position: relative;
          overflow: hidden;
        }

        .variaveis-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0.3) 0%, 
            rgba(255,255,255,0.8) 50%, 
            rgba(255,255,255,0.3) 100%
          );
        }

        .variaveis-header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at top,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 70%
          );
        }

        .variaveis-titulo {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 800;
          display: block;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        .variaveis-subtitulo {
          color: rgba(255,255,255,0.9);
          font-size: 0.85rem;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }

        .variaveis-lista {
          padding: 12px;
          background: #0f0f0f;
        }

        .variavel-item {
          background: none;
          border: none;
          color: #fff;
          padding: 16px 20px;
          width: 100%;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          margin-bottom: 6px;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }

        .variavel-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(124, 58, 237, 0.15), 
            transparent
          );
          transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .variavel-item:hover {
          background: linear-gradient(135deg, 
            rgba(124, 58, 237, 0.12) 0%, 
            rgba(168, 85, 247, 0.08) 100%
          );
          transform: translateX(6px);
          border-color: rgba(124, 58, 237, 0.4);
          box-shadow: 
            0 4px 12px rgba(124, 58, 237, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .variavel-item:hover::before {
          left: 100%;
        }

        .variavel-item:active {
          transform: translateX(4px) scale(0.98);
          transition: all 0.1s ease;
        }

        .variavel-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 6px;
        }

        .variavel-tag {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
          color: #fff;
          padding: 8px 14px;
          border-radius: 10px;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', 'Consolas', monospace;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 
            0 3px 8px rgba(124, 58, 237, 0.4),
            0 1px 3px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .variavel-tag::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.2) 0%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.1) 100%
          );
          border-radius: 10px;
        }

        .variavel-exemplo {
          color: #22c55e;
          font-size: 0.95rem;
          font-weight: 600;
          font-style: italic;
          opacity: 0.95;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          background: rgba(34, 197, 94, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .variavel-desc {
          color: #bfc7d5;
          font-size: 0.85rem;
          line-height: 1.4;
          margin-left: 6px;
          opacity: 0.9;
        }

        /* Estilo para variáveis destacadas globalmente */
        .mensagem-preview .variavel-destacada {
          background: rgba(124, 58, 237, 0.2);
          color: #c084fc;
          padding: 2px 6px;
          border-radius: 5px;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
          font-weight: 600;
          border: 1px solid rgba(124, 58, 237, 0.4);
          display: inline-block;
          margin: 0 1px;
          vertical-align: baseline;
        }

        @media (max-width: 768px) {
          .variaveis-menu {
            min-width: 300px;
            right: -10px;
            margin-bottom: 12px;
          }

          .variables-button-container {
            margin-right: 8px;
            margin-top: -44px;
          }

          .variaveis-btn {
            min-width: 40px;
            height: 36px;
            font-size: 1.1rem;
            padding: 8px 12px;
            border-radius: 10px;
          }

          .variaveis-header {
            padding: 16px 20px 12px;
          }

          .variaveis-titulo {
            font-size: 1rem;
          }

          .variaveis-subtitulo {
            font-size: 0.8rem;
          }

          .variavel-item {
            padding: 12px 16px;
          }

          .variavel-tag {
            font-size: 0.85rem;
            padding: 6px 12px;
          }

          .variavel-exemplo {
            font-size: 0.85rem;
          }

          .variavel-desc {
            font-size: 0.8rem;
          }

          .mensagem-preview .variavel-destacada,
          .editor-highlight .variavel-destacada {
            font-size: 0.85em;
            padding: 2px 5px;
          }
        }

        .progresso-envio-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 20px;
          }

          .progresso-envio-modal {
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .progresso-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .progresso-header h3 {
            margin: 0;
            color: #111827;
            font-size: 18px;
          }

          .status-conexao {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
          }

          .conexao-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #10b981;
          }

          .progresso-barra-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }

          .progresso-barra {
            flex: 1;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
          }

          .progresso-preenchimento {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
          }

          .progresso-texto {
            font-weight: 600;
            color: #111827;
            min-width: 50px;
            text-align: right;
          }

          .progresso-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }

          .stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .stat-label {
            font-size: 14px;
            color: #6b7280;
          }

          .stat-value {
            font-weight: 600;
            color: #111827;
            font-size: 14px;
          }

          .status-enviando {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background-color: #eff6ff;
            border-radius: 8px;
            font-size: 14px;
            color: #1d4ed8;
            margin-bottom: 20px;
          }

          .loading-spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid #bfdbfe;
            border-top: 2px solid #1d4ed8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .btn-fechar-progresso {
            width: 100%;
            padding: 12px;
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #374151;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-fechar-progresso:hover {
            background-color: #e5e7eb;
          }
          
          .progresso-envio-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 20px;
          }

          .progresso-envio-modal {
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .progresso-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .progresso-header h3 {
            margin: 0;
            color: #111827;
            font-size: 18px;
          }

          .status-conexao {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
          }

          .conexao-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .conexao-indicator.conectado {
            background-color: #10b981;
          }

          .conexao-indicator.carregando {
            background-color: #3b82f6;
          }

          .progresso-barra-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }

          .progresso-barra {
            flex: 1;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
          }

          .progresso-preenchimento {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
          }

          .progresso-texto {
            font-weight: 600;
            color: #111827;
            min-width: 50px;
            text-align: right;
          }

          .progresso-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }

          .stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .stat-label {
            font-size: 14px;
            color: #6b7280;
          }

          .stat-value {
            font-weight: 600;
            color: #111827;
            font-size: 14px;
          }

          .status-info {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background-color: #eff6ff;
            border-radius: 8px;
            font-size: 14px;
            color: #1d4ed8;
            margin-bottom: 12px;
          }

          .status-info.concluida {
            background-color: #f0fdf4;
            color: #15803d;
          }

          .info-atualizacao {
            text-align: center;
            margin-bottom: 20px;
            color: #6b7280;
          }

          .loading-spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid #bfdbfe;
            border-top: 2px solid #1d4ed8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .progresso-actions {
            display: flex;
            gap: 12px;
          }

          .btn-fechar-progresso {
            flex: 1;
            padding: 12px;
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #374151;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-fechar-progresso:hover {
            background-color: #e5e7eb;
          }

          .btn-parar-acompanhamento {
            padding: 12px 16px;
            background-color: #ef4444;
            border: 1px solid #dc2626;
            color: white;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            gap: 5px;
            transition: all 0.2s ease;
            align-items: center;
          }

          .btn-parar-acompanhamento:hover {
            background-color: #dc2626;
          }

          /* Estilos para a área de seleção de destinatários */
          .destinatarios-container {
            display: flex;
            gap: 32px;
            margin-top: 16px;
            margin-bottom: 16px;
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .destinatario-card {
            background: #23232b;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(124, 58, 237, 0.08);
            padding: 20px 18px;
            min-width: 260px;
            max-width: 340px;
            flex: 1 1 260px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 8px;
          }

          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }

          .card-icon.individual,
          .card-icon.grupos {
            background: #7c3aed;
            color: #fff;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
          }

          .card-info h4 {
            margin: 0;
            font-size: 1.1em;
            font-weight: 600;
            color: #fff;
          }

          .card-count {
            font-size: 0.95em;
            color: #a78bfa;
            margin-top: 2px;
          }

          .card-content {
            margin-bottom: 12px;
          }

          .preview-contatos,
          .preview-grupos {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .contato-preview,
          .grupo-preview {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #312e81;
            border-radius: 8px;
            padding: 4px 10px;
            font-size: 0.98em;
            color: #fff;
          }

          .contato-avatar,
          .grupo-badge {
            background: #7c3aed;
            color: #fff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1em;
          }

          .contato-nome-preview,
          .grupo-nome-preview {
            font-weight: 500;
            color: #fff;
          }

          .card-action-btn {
            margin-top: 8px;
            background: #7c3aed;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
          }

          .card-action-btn:hover {
            background: #6d28d9;
          }

          .empty-state {
            color: #bfc7d5;
            font-size: 0.95em;
            padding: 8px 0;
            text-align: center;
          }

          /* Estilos para o modal de seleção de grupos */
          .modal-content.modal-grupos {
            background: #23232b;
            border-radius: 14px;
            box-shadow: 0 4px 32px rgba(124, 58, 237, 0.18);
            padding: 32px 28px 24px 28px;
            max-width: 480px;
            width: 100%;
            margin: 40px auto;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .modal-content.modal-grupos .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
          }

          .grupos-lista {
            max-height: 340px;
            overflow-y: auto;
            margin-bottom: 18px;
            padding-right: 4px;
          }

          .grupo-checkbox {
            display: block;
            margin-bottom: 10px;
            cursor: pointer;
            padding: 0;
          }

          .grupo-checkbox.selecionado .grupo-item {
            background: #7c3aed22;
            border: 1.5px solid #7c3aed;
          }

          .grupo-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #18181b;
            border-radius: 8px;
            padding: 8px 12px;
            transition: background 0.2s, border 0.2s;
            border: 1.5px solid transparent;
          }

          .grupo-cor-indicator {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            margin-right: 4px;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
            border: 2px solid #fff;
          }

          .grupo-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .grupo-nome {
            font-weight: 600;
            color: #fff;
            font-size: 1em;
          }

          .grupo-total {
            font-size: 0.92em;
            color: #a78bfa;
          }

          .checkbox-custom {
            margin-left: auto;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sem-grupos {
            text-align: center;
            color: #bfc7d5;
            padding: 32px 0;
          }

          .sem-grupos .empty-icon {
            margin-bottom: 12px;
          }

          .btn-confirmar {
            background: #7c3aed;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px 18px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
          }

          .btn-confirmar:disabled {
            background: #6b7280;
            cursor: not-allowed;
          }

          .variacao-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 120px;
        }
        
        .variacao-badge {
          background: #7c3aed;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-align: center;
          white-space: nowrap;
        }
        
        .variacao-preview {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.2;
          cursor: help;
        }
        
        .sem-variacao {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
        }
        
        .log-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid #31313d;
          align-items: center;
        }
        
        .logs-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
          gap: 16px;
          padding: 12px 16px;
          background: #2d2d38;
          font-size: 0.9rem;
          font-weight: 600;
          color: #7dd3fc;
          border-bottom: 2px solid #31313d;
        }
        
        @media (max-width: 768px) {
          .log-row,
          .logs-header {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .log-col {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .log-col::before {
            content: attr(data-label);
            font-weight: 600;
            color: #7dd3fc;
          }
          
          .variacao-info {
            max-width: none;
            flex-direction: row;
            align-items: center;
          }
        }

        .mensagem-preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-top: 8px;
        }
        
        .preview-texto {
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }
        
        .preview-imagem {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .imagem-container {
          max-width: 300px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .preview-img-detalhes {
          width: 100%;
          height: auto;
          display: block;
          max-height: 200px;
          object-fit: cover;
        }
        
        .legenda-container {
          background: #ffffff;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        
        .legenda-container strong {
          color: #1f2937;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 6px;
        }
        
        .legenda-texto {
          font-size: 14px;
          line-height: 1.4;
          color: #374151;
        }
        
        .sem-legenda {
          color: #6b7280;
          font-style: italic;
          font-size: 13px;
        }
        
        .preview-botoes {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .texto-botoes {
          background: #ffffff;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #10b981;
        }
        
        .texto-principal {
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }
        
        .botoes-container strong {
          color: #1f2937;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }
        
        .botoes-lista {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .botao-preview {
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 10px 12px;
          transition: all 0.2s ease;
        }
        
        .botao-preview:hover {
          border-color: #3b82f6;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
        }
        
        .botao-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .botao-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }
        
        .botao-tipo {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .variacao-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 120px;
        }
        
        .variacao-badge {
          background: #7c3aed;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-align: center;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .variacao-preview {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.2;
          cursor: help;
        }
        
        .sem-variacao {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
        }
        
        .log-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid #31313d;
          align-items: center;
        }
        
        .logs-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1.2fr;
          gap: 16px;
          padding: 12px 16px;
          background: #2d2d38;
          font-size: 0.9rem;
          font-weight: 600;
          color: #7dd3fc;
          border-bottom: 2px solid #31313d;
        }
        
        /* Responsividade para preview de mensagens */
        @media (max-width: 768px) {
          .preview-imagem {
            gap: 8px;
          }
          
          .imagem-container {
            max-width: 100%;
          }
          
          .preview-img-detalhes {
            max-height: 150px;
          }
          
          .botoes-lista {
            gap: 6px;
          }
          
          .botao-preview {
            padding: 8px 10px;
          }
          
          .log-row,
          .logs-header {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .log-col {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .log-col::before {
            content: attr(data-label);
            font-weight: 600;
            color: #7dd3fc;
          }
          
          .variacao-info {
            max-width: none;
            flex-direction: row;
            align-items: center;
          }
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #3b82f6;
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

        /* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(20, 20, 30, 0.85);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal Content */
.modal-content.modal-subgrupos {
  background: #181824;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  width: 360px;
  max-width: 95vw;
  padding: 0;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 8px 24px;
  border-bottom: 1px solid #23233a;
  background: #23233a;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #a78bfa;
}

.btn-fechar-modal {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.btn-fechar-modal:hover {
  background: #29294d;
}

/* Busca */
.busca-contatos-container {
  padding: 12px 24px 0 24px;
}
.busca-contatos-wrapper {
  display: flex;
  align-items: center;
  background: #23233a;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 8px;
}
.busca-contatos-icon {
  color: #a78bfa;
  margin-right: 8px;
}
.busca-contatos-input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  flex: 1;
  outline: none;
}

/* Info Seleção */
.controles-selecao {
  padding: 0 24px;
  margin-bottom: 8px;
}
.info-selecao {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #a1a1aa;
  margin-bottom: 4px;
}
.acoes-selecao {
  display: flex;
  align-items: center;
  gap: 12px;
}
.checkbox-todos {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  cursor: pointer;
}
.checkbox-label {
  color: #fff;
}

/* Lista de Subgrupos */
.subgrupos-lista {
  padding: 0 24px 0 24px;
  max-height: 320px;
  overflow-y: auto;
}
.subgrupo-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}
.subgrupo-checkbox input[type="checkbox"] {
  accent-color: #a78bfa;
  width: 18px;
  height: 18px;
}
.subgrupo-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.subgrupo-badge {
  background: #a78bfa;
  color: #fff;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
.subgrupo-details {
  display: flex;
  flex-direction: column;
}
.subgrupo-nome-preview,
.subgrupo-nome {
  font-weight: 500;
  color: #fff;
}
.subgrupo-total-preview,
.subgrupo-total {
  font-size: 0.95rem;
  color: #a1a1aa;
}
.checkbox-custom {
  margin-left: auto;
  color: #a78bfa;
}

/* Botão de confirmação */
.modal-actions {
  padding: 18px 24px;
  background: #23233a;
  border-top: 1px solid #23233a;
  display: flex;
  justify-content: flex-end;
}
.btn-confirmar {
  background: #a78bfa;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-confirmar:disabled {
  background: #6d28d9;
  opacity: 0.7;
  cursor: not-allowed;
}
      `