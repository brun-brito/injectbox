import { useRouter } from 'next/router';

const DashboardLinks = () => {
  const router = useRouter();
  const { cliente, idInstancia } = router.query as { cliente: string; idInstancia: string };

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
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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
      <div className="voltar-container">
        <button className="voltar-btn" onClick={() => router.push(`/zcampanha/${cliente}/instancias`)}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
      </div>
      
      <div className="dashboard-index-container">
        <h1>Instância: <span>{idInstancia}</span></h1>
        <div className="dashboard-links">
          {links.map(link => (
            <button
              key={link.label}
              className="dashboard-link"
              style={{ borderColor: link.color }}
              onClick={() => router.push(link.href)}
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

        h1 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 32px;
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

        .dashboard-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-link-label {
          font-size: 1.13rem;
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
        }
      `}</style>
    </div>
  );
};

export default DashboardLinks;
