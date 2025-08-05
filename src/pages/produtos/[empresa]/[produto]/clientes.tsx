import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ClientesPage = () => {
  const router = useRouter();
  const { empresa, produto } = router.query;
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    if (!empresa || !produto) return;
    fetch(`/api/clientes/${empresa}/${produto}`)
      .then(res => res.json())
      .then(data => setClientes(data.clientes || []));
  }, [empresa, produto]);

  return (
    <div>
      <h1>Clientes do produto {produto}</h1>
      <ul>
        {clientes.map(cliente => (
          <li key={cliente.id}>{cliente.nome} - {cliente.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default ClientesPage;
