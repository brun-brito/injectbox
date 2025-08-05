import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function withProdutoDisponivel<P extends { cliente: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProdutoDisponivelWrapper(props: P) {
    const router = useRouter();
    const { cliente } = props;
    const [habilitado, setHabilitado] = useState<boolean | null>(null);

    useEffect(() => {
      if (!cliente) return;
      fetch(`/api/zcampanha/${cliente}`)
        .then(res => res.json())
        .then(data => {
          if (!data.exists) {
            window.alert('Este cliente não possui o produto zcampanha!');
            router.replace('/');
          } else {
            setHabilitado(true);
          }
        })
        .catch(() => {
          window.alert('Erro ao validar o cliente!');
          router.replace('/');
        });
    }, [cliente, router]);

    if (habilitado === null) {
      return <div style={{ padding: 32 }}>Verificando permissão...</div>;
    }

    return <WrappedComponent {...props} />;
  };
}
