import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiLock, FiXCircle } from 'react-icons/fi';
import { useZCampanhaAccess } from '@/hooks/useZCampanhaAccess';

type Props = {
  children: React.ReactNode;
  cliente: string;
};

export const ZCampanhaProtectedRoute = ({ children, cliente }: Props) => {
  const { user, hasAccess, loading, error } = useZCampanhaAccess(cliente);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showNotLoggedIn, setShowNotLoggedIn] = useState(false);

  useEffect(() => {
    // Reset states quando cliente muda
    setLoadingTimeout(false);
    setShowAccessDenied(false);
    setShowNotLoggedIn(false);
  }, [cliente]);

  // Timeout para loading
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowNotLoggedIn(true);
      } else if (hasAccess === false) {
        setShowAccessDenied(true);
      }
    }
  }, [user, hasAccess, loading]);

  // Se deu timeout no loading, mostrar erro
  if (loadingTimeout || (error && !loading)) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#18181b',
        color: '#fff',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <FiAlertTriangle size={64} color="#fbbf24" />
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Erro ao acessar!
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8, maxWidth: '500px' }}>
          {error || 'Timeout ao conectar com o sistema de autenticação'}
        </div>
      </div>
    );
  }

  // Usuário não está logado
  if (showNotLoggedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#18181b',
        color: '#fff',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <FiLock size={64} color="#7dd3fc" />
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Login Necessário
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8, maxWidth: '500px' }}>
          Você precisa fazer login para acessar esta página
        </div>
        <button 
          onClick={() => window.location.href = `/zcampanha/${cliente}`}
          style={{
            background: '#7dd3fc',
            color: '#18181b',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '10px'
          }}
          onMouseOver={e => {
            const btn = e.target as HTMLButtonElement;
            btn.style.background = '#38bdf8';
          }}
          onMouseOut={e => {
            const btn = e.target as HTMLButtonElement;
            btn.style.background = '#7dd3fc';
          }}
        >
           Fazer Login
        </button>
      </div>
    );
  }

  // Usuário não tem acesso
  if (showAccessDenied) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#18181b',
        color: '#fff',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <FiXCircle size={64} color="#ef4444" />
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
          Acesso Negado
        </div>
        <div style={{ fontSize: '16px', opacity: 0.8, maxWidth: '500px' }}>
          Seu email não tem permissão para acessar <strong>{cliente}</strong>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button 
            onClick={() => {
              // Clear cache and try different client
              const email = user?.email;
              if (email) {
                // Suggest going back to a client they might have access to
                window.location.href = `/zcampanha/${cliente}/instancias`;
              }
            }}
            style={{
              background: 'transparent',
              color: '#fbbf24',
              border: '2px solid #fbbf24',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => {
              const btn = e.target as HTMLButtonElement;
              btn.style.background = '#fbbf24';
              btn.style.color = '#18181b';
            }}
            onMouseOut={e => {
              const btn = e.target as HTMLButtonElement;
              btn.style.background = 'transparent';
              btn.style.color = '#fbbf24';
            }}
          >
             Tentar Outro Cliente
          </button>
        </div>
      </div>
    );
  }

  // Loading normal
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#18181b',
        color: '#fff',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #333',
          borderTop: '4px solid #7dd3fc',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '18px' }}>Verificando permissões para {cliente}...</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          Aguarde até 15 segundos...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Renderizar conteúdo protegido
  if (hasAccess === true) {
    return <>{children}</>;
  }

  // Fallback
  return null;
};
