import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { signInWithCustomToken, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { withProdutoDisponivel } from '@/components/withProdutoDisponivel';
import styles from '@/styles/ZCampanhaLogin.module.css';

type Props = {
  cliente: string;
};

const ZCampanhaHome = ({ cliente }: Props) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAccessError, setHasAccessError] = useState(false);

  useEffect(() => {
    // Verificar se há erro de acesso negado na URL
    const { error } = router.query;
    if (error === 'access_denied') {
      setErro('Acesso negado. Seu email não tem permissão para acessar este cliente.');
      setHasAccessError(true);
      // Clear the error from URL
      router.replace(`/zcampanha/${cliente}`, undefined, { shallow: true });
    }
  }, [router.query, router, cliente]);

  useEffect(() => {
    // Only redirect if user is authenticated AND there's no access error
    if (!authLoading && user && !hasAccessError) {
      // Redirect and let the protected route handle access validation
      router.push(`/zcampanha/${cliente}/instancias`);
    }
  }, [user, authLoading, router, cliente, hasAccessError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    setHasAccessError(false); // Reset access error on new login attempt

    try {
      // Fazer login via API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await response.json();

      if (data.success && data.customToken) {
        // Usar o custom token para autenticar no Firebase Auth
        await signInWithCustomToken(auth, data.customToken);
        // O redirecionamento será feito pelo useEffect acima
      } else {
        setErro(data.error || 'Erro ao fazer login');
      }
    } catch (error: unknown) {
      console.error('Erro no login:', error);
      setErro('Erro de conexão. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErro('Digite seu email primeiro');
      return;
    }

    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSucesso('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: unknown) {
      let errorMessage = 'Erro ao enviar email de recuperação';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            errorMessage = 'Email não encontrado';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
            break;
          default:
            errorMessage = 'Erro inesperado. Tente novamente';
        }
      }
      
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Login ZCampanha - {cliente.charAt(0).toUpperCase() + cliente.slice(1)}</h1>
        
        {hasAccessError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <span>⚠️</span>
              Faça login com uma conta que tenha acesso a este cliente
            </div>
          </div>
        )}
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className={styles.input}
              placeholder="Digite seu email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Senha:</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              disabled={loading}
              className={styles.input}
              placeholder="Digite sua senha"
            />
          </div>
          
          {erro && <div className={styles.error}>{erro}</div>}
          {sucesso && <div className={styles.success}>{sucesso}</div>}
          
          <button type="submit" disabled={loading} className={styles.button}>
            <span className={loading ? styles.loading : ''}>
              {loading && <div className={styles.spinner}></div>}
              {loading ? 'Entrando...' : 'Entrar'}
            </span>
          </button>
          
          <button 
            type="button" 
            onClick={handleForgotPassword}
            disabled={loading}
            className={styles.forgotButton}
          >
            Esqueci minha senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default withProdutoDisponivel(ZCampanhaHome);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cliente = context.params?.cliente as string;

  return {
    props: { cliente },
  };
};
