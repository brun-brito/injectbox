import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { withProdutoDisponivel } from '@/components/withProdutoDisponivel';

type Props = {
  cliente: string;
};

const TEST_EMAIL = 'teste';
const TEST_PASSWORD = 'teste';

const ZCampanhaHome = ({ cliente }: Props) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (email === TEST_EMAIL && senha === TEST_PASSWORD) {
      localStorage.setItem(`zcampanha_auth_${cliente}`, 'true');
      router.push(`/zcampanha/${cliente}/instancias`);
    } else {
      setErro('Email ou senha inválidos');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Login ZCampanha</h1>
      <form onSubmit={handleLogin} style={{ maxWidth: 320 }}>
        <div>
          <label>Email:</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        <button type="submit" style={{ marginTop: 16 }}>Entrar</button>
      </form>
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
