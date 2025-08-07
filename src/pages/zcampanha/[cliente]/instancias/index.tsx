import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { withProdutoDisponivel } from '@/components/withProdutoDisponivel';
import { ZCampanhaProtectedRoute } from '@/components/zcampanha/ZCampanhaProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

type Instancia = {
  idInstancia: string;
  nome: string;
  numero: string;
  tokenInstancia: string;
};

type StatusInstancia =
  | { type: 'ok' }
  | { type: 'qr'; value: string }
  | { type: 'erro'; value: string }
  | { type: 'loading' };

type Props = {
  cliente: string;
};

const InstanciasPage = ({ cliente }: Props) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [status, setStatus] = useState<Record<string, StatusInstancia>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ open: boolean; src: string | null }>({ open: false, src: null });
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push(`/zcampanha/${cliente}`);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleDashboardNavigation = (idInstancia: string) => {
    setIsNavigating(true);
    router.push(`/zcampanha/${cliente}/instancias/${idInstancia}`);
  };

  useEffect(() => {
    // Busca instâncias
    fetch(`/api/zcampanha/${cliente}/instancias`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setErro(data.error);
        else setInstancias(data.instancias || []);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao buscar instâncias');
        setLoading(false);
      });
    // Busca Client-Token
    fetch(`/api/zcampanha/${cliente}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.doc && data.doc['Client-Token']) {
          setClientToken(data.doc['Client-Token']);
        }
      });
  }, [cliente]);

  useEffect(() => {
    if (!clientToken || instancias.length === 0) return;
    instancias.forEach(inst => {
      setStatus(prev => ({
        ...prev,
        [inst.idInstancia]: { type: 'loading' },
      }));
      fetch(
        `https://api.z-api.io/instances/${inst.idInstancia}/token/${inst.tokenInstancia}/qr-code/image`,
        {
          method: 'GET',
          headers: { 'Client-Token': clientToken },
        }
      )
        .then(async res => {
          let data;
          try {
            data = await res.json();
          } catch {
            setStatus(prev => ({
              ...prev,
              [inst.idInstancia]: { type: 'erro', value: 'Resposta inválida' },
            }));
            return;
          }
          if (data.connected === true) {
            setStatus(prev => ({
              ...prev,
              [inst.idInstancia]: { type: 'ok' },
            }));
          } else if (data.value && typeof data.value === 'string' && data.value.startsWith('data:image')) {
            setStatus(prev => ({
              ...prev,
              [inst.idInstancia]: { type: 'qr', value: data.value },
            }));
          } else if (data.error) {
            setStatus(prev => ({
              ...prev,
              [inst.idInstancia]: { type: 'erro', value: data.error },
            }));
          } else {
            setStatus(prev => ({
              ...prev,
              [inst.idInstancia]: { type: 'erro', value: 'Erro desconhecido' },
            }));
          }
        })
        .catch(() => {
          setStatus(prev => ({
            ...prev,
            [inst.idInstancia]: { type: 'erro', value: 'Erro de conexão' },
          }));
        });
    });
  }, [clientToken, instancias]);

  if (loading) return <div style={{ padding: 32 }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 32, color: 'red' }}>{erro}</div>;

  return (
    <ZCampanhaProtectedRoute cliente={cliente}>
      <div className="instancias-container">
        {isNavigating && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Carregando...</p>
            </div>
          </div>
        )}
        <div className="header">
          <div className="header-content">
            <div>
              <h1>Instâncias do ZCampanha</h1>
              <p>Cliente: <strong>{cliente.charAt(0).toUpperCase() + cliente.slice(1)}</strong></p>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
        {instancias.length === 0 ? (
          <div style={{ marginTop: 32, color: '#fbbf24', fontWeight: 600, fontSize: '1.2rem' }}>
            Nenhum número foi encontrado para campanha.
          </div>
        ) : (
          <table className="instancias-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Número</th>
                <th>Token</th>
                <th>Conectado</th>
              </tr>
            </thead>
            <tbody>
              {instancias.map(inst => (
                <tr key={inst.idInstancia}>
                  <td>{inst.idInstancia}</td>
                  <td>{inst.nome}</td>
                  <td>{inst.numero}</td>
                  <td className="token">{inst.tokenInstancia}</td>
                  <td>
                    {(() => {
                      const s = status[inst.idInstancia];
                      if (!s || s.type === 'loading') return '...';
                      if (s.type === 'ok')
                        return (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>OK</span>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Abrir dashboard da instância"
                              onClick={() => handleDashboardNavigation(inst.idInstancia)}
                              disabled={isNavigating}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M9 6l6 6-6 6" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </span>
                        );
                      if (s.type === 'qr')
                        return (
                          <img
                            src={s.value}
                            alt="QR Code"
                            style={{ width: 64, height: 64, background: '#fff', borderRadius: 8, border: '2px solid #333', cursor: 'pointer' }}
                            onClick={() => setQrModal({ open: true, src: s.value })}
                            title="Clique para expandir"
                          />
                        );
                      if (s.type === 'erro')
                        return <span style={{ color: '#ef4444', fontWeight: 600 }}>{s.value}</span>;
                      return '?';
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {qrModal.open && qrModal.src && (
          <div className="qr-modal" onClick={() => setQrModal({ open: false, src: null })}>
            <div className="qr-modal-bg" />
            <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
              <img src={qrModal.src} alt="QR Code Expandido" style={{ width: 320, height: 320, background: '#fff', borderRadius: 16, border: '4px solid #333' }} />
              <button className="qr-modal-close" onClick={() => setQrModal({ open: false, src: null })}>Fechar</button>
            </div>
          </div>
        )}
        <style jsx>{`
          .instancias-container {
            background: #18181b;
            color: #fff;
            min-height: 100vh;
            padding: 40px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .header {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }
          .header-content {
            width: 100%;
            max-width: 900px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 16px;
          }
          h1 {
            margin-bottom: 8px;
            font-size: 2rem;
            letter-spacing: 1px;
          }
          p {
            margin-bottom: 24px;
            font-size: 1.1rem;
          }
          .logout-button {
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
            font-weight: 600;
            transition: color 0.2s;
          }
          .logout-button:hover {
            color: #b91c1c;
          }
          .instancias-table {
            border-collapse: separate;
            border-spacing: 0;
            min-width: 900px;
            background: #23232b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 16px #0004;
          }
          .instancias-table th, .instancias-table td {
            padding: 14px 18px;
            text-align: left;
            font-size: 1rem;
            word-break: break-all;
          }
          .instancias-table th {
            background: #2d2d38;
            color: #7dd3fc;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .instancias-table tbody tr:nth-child(odd) {
            background: #23232b;
          }
          .instancias-table tbody tr:nth-child(even) {
            background: #1a1a22;
          }
          .instancias-table tr {
            transition: background 0.2s;
          }
          .instancias-table tr:hover {
            background: #31313d;
          }
          .token {
            font-family: 'Fira Mono', 'Consolas', monospace;
            font-size: 0.95rem;
            color: #fbbf24;
          }
          .instancias-table th:last-child, .instancias-table td:last-child {
            text-align: center;
          }
          @media (max-width: 1000px) {
            .instancias-table, .instancias-table th, .instancias-table td {
              font-size: 0.95rem;
              min-width: unset;
              padding: 10px 6px;
            }
            .instancias-table {
              min-width: 100vw;
            }
          }
          .qr-modal {
            position: fixed;
            z-index: 1000;
            left: 0; top: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-modal-bg {
            position: absolute;
            left: 0; top: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
          }
          .qr-modal-content {
            position: relative;
            z-index: 1;
            background: #23232b;
            padding: 32px 32px 24px 32px;
            border-radius: 20px;
            box-shadow: 0 8px 32px #000a;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-modal-content img {
            margin-bottom: 16px;
          }
          .qr-modal-close {
            background: #ef4444;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
            transition: background 0.2s;
          }
          .qr-modal-close:hover {
            background: #b91c1c;
          }
          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(24, 24, 27, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }

          .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #31313d;
            border-top: 3px solid #7dd3fc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-spinner p {
            color: #7dd3fc;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </ZCampanhaProtectedRoute>
  );
};

export default withProdutoDisponivel(InstanciasPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cliente = context.params?.cliente as string;
  return { props: { cliente } };
};
