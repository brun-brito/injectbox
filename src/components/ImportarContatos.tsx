import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiDownload, FiCheck, FiAlertTriangle, FiFile } from 'react-icons/fi';

interface ImportarContatosProps {
  cliente: string;
  idInstancia: string;
  onSucesso: () => void;
  onFechar: () => void;
}

type ResultadoImportacao = {
  success: boolean;
  totalLinhas: number;
  contatosInseridos: number;
  errosEncontrados: number;
  contatos: Array<{ id: string; nome: string; numero: string; linha: number }>;
  erros: Array<{ linha: number; erros: string[] }>;
};

const ImportarContatos: React.FC<ImportarContatosProps> = ({
  cliente,
  idInstancia,
  onSucesso,
  onFechar
}) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatosAceitos = '.xlsx,.xls,.csv';
  const tamanhoMaximo = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > tamanhoMaximo) {
      setErro('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    // Validar tipo
    const extensao = file.name.toLowerCase().split('.').pop();
    if (!['xlsx', 'xls', 'csv'].includes(extensao || '')) {
      setErro('Formato não suportado. Use: .xlsx, .xls ou .csv');
      return;
    }

    setArquivo(file);
    setErro('');
    setResultado(null);
  };

  const handleImportar = async () => {
    if (!arquivo) return;

    setCarregando(true);
    setErro('');

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const response = await fetch(
        `/api/zcampanha/${cliente}/instancias/${idInstancia}/agenda/importar`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResultado(data);
        if (data.contatosInseridos > 0) {
          onSucesso();
        }
      } else {
        setErro(data.error || 'Erro ao importar contatos');
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro de conexão');
    } finally {
      setCarregando(false);
    }
  };

  const downloadModelo = () => {
    const csvContent = 'Nome,Numero\nPedro Silva,5511999999999\nMaria Santos,5511888888888\nPedro Costa,5511777777777';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo-contatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparSelecao = () => {
    setArquivo(null);
    setResultado(null);
    setErro('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FiUpload size={20} />
            Importar Contatos
          </h3>
          <button onClick={onFechar} className="btn-fechar">
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!resultado ? (
            <>
              {/* Instruções */}
              <div className="instrucoes">
                <h4>Como importar:</h4>
                <ul>
                  <li>Use uma planilha Excel (.xlsx, .xls) ou arquivo CSV</li>
                  <li>Primeira coluna: <strong>Nome</strong></li>
                  <li>Segunda coluna: <strong>Numero</strong> (apenas números)</li>
                  <li>Máximo: 10MB</li>
                </ul>
              </div>

              {/* Botão para baixar modelo */}
              <div className="modelo-container">
                <button onClick={downloadModelo} className="btn-modelo">
                  <FiDownload size={16} />
                  Baixar Modelo de Exemplo
                </button>
              </div>

              {/* Seleção de arquivo */}
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={formatosAceitos}
                  onChange={handleFileSelect}
                  className="file-input"
                  id="file-input"
                />
                <label htmlFor="file-input" className="upload-label">
                  <FiFile size={32} />
                  <div className="upload-text">
                    <span className="upload-title">
                      {arquivo ? arquivo.name : 'Clique para selecionar arquivo'}
                    </span>
                    <span className="upload-subtitle">
                      {arquivo 
                        ? `${(arquivo.size / 1024).toFixed(1)} KB`
                        : 'Excel (.xlsx, .xls) ou CSV'
                      }
                    </span>
                  </div>
                </label>
              </div>

              {/* Arquivo selecionado */}
              {arquivo && (
                <div className="arquivo-selecionado">
                  <div className="arquivo-info">
                    <FiCheck size={16} className="check-icon" />
                    <span>Arquivo selecionado: {arquivo.name}</span>
                  </div>
                  <button onClick={limparSelecao} className="btn-remover">
                    <FiX size={16} />
                  </button>
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="erro-container">
                  <FiAlertTriangle size={16} />
                  <span>{erro}</span>
                </div>
              )}
            </>
          ) : (
            /* Resultado da importação */
            <div className="resultado-container">
              <div className="resultado-header">
                <div className={`resultado-icon ${resultado.success ? 'sucesso' : 'erro'}`}>
                  {resultado.success ? <FiCheck size={24} /> : <FiAlertTriangle size={24} />}
                </div>
                <h4>
                  {resultado.success 
                    ? 'Importação Concluída!' 
                    : 'Importação com Problemas'
                  }
                </h4>
              </div>

              <div className="resultado-stats">
                <div className="stat-item sucesso">
                  <span className="stat-number">{resultado.contatosInseridos}</span>
                  <span className="stat-label">Contatos Importados</span>
                </div>
                <div className="stat-item total">
                  <span className="stat-number">{resultado.totalLinhas}</span>
                  <span className="stat-label">Total de Linhas</span>
                </div>
                {resultado.errosEncontrados > 0 && (
                  <div className="stat-item erro">
                    <span className="stat-number">{resultado.errosEncontrados}</span>
                    <span className="stat-label">Erros</span>
                  </div>
                )}
              </div>

              {/* Lista de erros */}
              {resultado.erros.length > 0 && (
                <div className="erros-detalhes">
                  <h5>Erros Encontrados:</h5>
                  <div className="erros-lista">
                    {resultado.erros.slice(0, 10).map((erro, index) => (
                      <div key={index} className="erro-item">
                        <strong>Linha {erro.linha}:</strong>
                        <ul>
                          {erro.erros.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {resultado.erros.length > 10 && (
                      <div className="erros-mais">
                        +{resultado.erros.length - 10} erros adicionais...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          {!resultado ? (
            <>
              <button
                onClick={handleImportar}
                disabled={!arquivo || carregando}
                className="btn-importar"
              >
                {carregando ? (
                  <>
                    <div className="loading-spinner" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FiUpload size={16} />
                    Importar Contatos
                  </>
                )}
              </button>
              <button onClick={onFechar} className="btn-cancelar">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={limparSelecao} className="btn-nova-importacao">
                Nova Importação
              </button>
              <button onClick={onFechar} className="btn-fechar-resultado">
                Fechar
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #23232b;
          border-radius: 16px;
          padding: 0;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          border: 2px solid #31313d;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #31313d;
        }

        .modal-header h3 {
          color: #7dd3fc;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-fechar {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-fechar:hover {
          background: #dc2626;
        }

        .modal-body {
          padding: 24px;
        }

        .instrucoes {
          background: #1e2328;
          border: 1px solid #31313d;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .instrucoes h4 {
          color: #7dd3fc;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .instrucoes ul {
          color: #bfc7d5;
          margin: 0;
          padding-left: 20px;
        }

        .instrucoes li {
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .modelo-container {
          margin-bottom: 20px;
          text-align: center;
        }

        .btn-modelo {
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .btn-modelo:hover {
          background: #16a34a;
        }

        .upload-area {
          margin-bottom: 20px;
        }

        .file-input {
          display: none;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 20px;
          border: 2px dashed #31313d;
          border-radius: 12px;
          background: #1e2328;
          cursor: pointer;
          transition: all 0.2s;
          color: #bfc7d5;
        }

        .upload-label:hover {
          border-color: #7dd3fc;
          background: #252a30;
        }

        .upload-text {
          text-align: center;
        }

        .upload-title {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .upload-subtitle {
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .arquivo-selecionado {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .arquivo-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #22c55e;
          font-weight: 500;
        }

        .check-icon {
          color: #22c55e;
        }

        .btn-remover {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-remover:hover {
          background: #dc2626;
        }

        .erro-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: #ef4444;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .resultado-container {
          text-align: center;
        }

        .resultado-header {
          margin-bottom: 24px;
        }

        .resultado-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .resultado-icon.sucesso {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .resultado-icon.erro {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .resultado-header h4 {
          color: #fff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .resultado-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 24px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-item.sucesso .stat-number {
          color: #22c55e;
        }

        .stat-item.total .stat-number {
          color: #7dd3fc;
        }

        .stat-item.erro .stat-number {
          color: #ef4444;
        }

        .stat-label {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .erros-detalhes {
          background: #1e2328;
          border: 1px solid #31313d;
          border-radius: 12px;
          padding: 20px;
          margin-top: 24px;
          text-align: left;
        }

        .erros-detalhes h5 {
          color: #ef4444;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .erros-lista {
          max-height: 200px;
          overflow-y: auto;
        }

        .erro-item {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #31313d;
        }

        .erro-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .erro-item strong {
          color: #fff;
          display: block;
          margin-bottom: 8px;
        }

        .erro-item ul {
          margin: 0;
          padding-left: 20px;
          color: #ef4444;
        }

        .erro-item li {
          margin-bottom: 4px;
        }

        .erros-mais {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          margin-top: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 2px solid #31313d;
        }

        .btn-importar {
          flex: 1;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .btn-importar:hover:not(:disabled) {
          background: #6d28d9;
        }

        .btn-importar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancelar {
          background: #6b7280;
          color: white;
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

        .btn-nova-importacao {
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-nova-importacao:hover {
          background: #6d28d9;
        }

        .btn-fechar-resultado {
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-fechar-resultado:hover {
          background: #16a34a;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .modal-content {
            margin: 10px;
            max-height: 90vh;
          }

          .resultado-stats {
            flex-direction: column;
            gap: 16px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ImportarContatos;
