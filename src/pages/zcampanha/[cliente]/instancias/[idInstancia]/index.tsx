import { withZCampanhaAuth } from '@/components/zcampanha/withZCampanhaAuth';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const DashboardLinks = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };
  const [isLoading, setIsLoading] = useState(false);
  const [instanceData, setInstanceData] = useState<{nome: string; numero: string} | null>(null);

  useEffect(() => {
    if (!cliente || !idInstancia) return;
    
    // Buscar dados da instância
    fetch(`/api/zcampanha/${cliente}/instancias`)
      .then(res => res.json())
      .then(data => {
        if (data.instancias) {
          const instance = data.instancias.find((inst: any) => inst.idInstancia === idInstancia);
          if (instance) {
            setInstanceData({ nome: instance.nome, numero: instance.numero });
          }
        }
      })
      .catch(error => {
        console.error('Erro ao buscar dados da instância:', error);
      });
  }, [cliente, idInstancia]);

  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  const handleBackNavigation = () => {
    setIsLoading(true);
    router.push(`/zcampanha/${cliente}/instancias`);
  };

  const links = [
    {
      label: 'Agenda',
      href: `/zcampanha/${cliente}/instancias/${idInstancia}/agenda`,
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="16" rx="3" stroke="#7dd3fc" strokeWidth="2"/>
          <path d="M8 3v4M16 3v4" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round"/>
          <rect x="8" y="13" width="8" height="2" rx="1" fill="#7dd3fc"/>
        </svg>
      ),
      color: '#7dd3fc'
    },
    {
      label: 'Grupos de Usuários',
      href: `/zcampanha/${cliente}/instancias/${idInstancia}/grupos`,
      icon: (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
          <path stroke="#8b5cf6" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle stroke="#8b5cf6" cx="9" cy="7" r="4"></circle>
          <path stroke="#8b5cf6" d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path stroke="#8b5cf6" d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      color: '#8b5cf6'
    },
    {
      label: 'Simulador de Conversa',
      href: `/zcampanha/${cliente}/instancias/${idInstancia}/simulador`,
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="3" stroke="#22c55e" strokeWidth="2"/>
          <path d="M8 13h8M8 9h5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: '#22c55e'
    },
    {
      label: 'Envio de Campanhas',
      href: `/zcampanha/${cliente}/instancias/${idInstancia}/campanhas`,
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path d="M3 12l18-7-7 18-2-8-8-3z" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#fbbf24'
    }
  ];

  return (
    <div className="dashboard-index-bg">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Carregando...</p>
          </div>
        </div>
      )}
      
      <div className="voltar-container">
        <button 
          className="voltar-btn" 
          onClick={handleBackNavigation}
          disabled={isLoading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
      </div>
      
      <div className="dashboard-index-container">
        <div className="instance-info">
          {/* <h1>Instância: <span>{idInstancia}</span></h1> */}
          {instanceData && (
            <div className="instance-details">
              <h1>Nome: <span>{instanceData.nome}</span></h1>
              <h1>Número: <span>{instanceData.numero}</span></h1>
            </div>
          )}
        </div>
        <div className="dashboard-links">
          {links.map(link => (
            <button
              key={link.label}
              className="dashboard-link"
              style={{ borderColor: link.color }}
              onClick={() => handleNavigation(link.href)}
              disabled={isLoading}
            >
              <span className="dashboard-link-icon">{link.icon}</span>
              <span className="dashboard-link-label">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .dashboard-index-bg {
          min-height: 100vh;
          background: #18181b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
        }

        .voltar-container {
          position: absolute;
          top: 40px;
          left: 40px;
          z-index: 10;
        }

        .voltar-btn {
          background: #23232b;
          color: #7dd3fc;
          border: 2px solid #31313d;
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .voltar-btn:hover {
          background: #2d2d38;
          border-color: #7dd3fc;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }

        .voltar-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .voltar-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .voltar-btn:disabled:hover {
          background: #23232b;
          border-color: #31313d;
          transform: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .dashboard-index-container {
          background: #23232b;
          border-radius: 24px;
          padding: 48px 32px 40px 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          min-width: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 2px solid #31313d;
        }

        .instance-info {
          margin-bottom: 32px;
          text-align: center;
        }

        .instance-details {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .instance-details p {
          color: #d1d5db;
          font-size: 1rem;
          margin: 0;
          font-weight: 500;
        }

        .instance-details strong {
          color: #7dd3fc;
          font-weight: 600;
        }

        h1 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 0;
          font-weight: 700;
          letter-spacing: 1px;
          text-align: center;
        }

        h1 span {
          color: #7dd3fc;
          font-weight: 600;
          font-family: monospace;
          background: #1e2328;
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid #31313d;
        }

        .dashboard-links {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        .dashboard-link {
          display: flex;
          align-items: center;
          gap: 18px;
          background: #18181b;
          color: #fff;
          border: 2.5px solid;
          border-radius: 16px;
          padding: 18px 28px;
          font-size: 1.15rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .dashboard-link:hover {
          background: #31313d;
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .dashboard-link:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .dashboard-link:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dashboard-link:disabled:hover {
          transform: none;
          background: #18181b;
        }

        .dashboard-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-link-label {
          font-size: 1.13rem;
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

        @media (max-width: 768px) {
          .voltar-container {
            position: static;
            margin-bottom: 20px;
            align-self: flex-start;
          }

          .dashboard-index-bg {
            padding: 20px;
          }

          .dashboard-index-container {
            padding: 32px 20px;
            min-width: auto;
            width: 100%;
          }

          .voltar-btn {
            padding: 10px 16px;
            font-size: 0.9rem;
          }

          .instance-details {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default withZCampanhaAuth(DashboardLinks);
