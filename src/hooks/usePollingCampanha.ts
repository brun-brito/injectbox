import { useEffect, useRef, useState } from 'react';

interface StatusCampanha {
  id: string;
  status: 'rascunho' | 'agendada' | 'enviando' | 'pausada' | 'concluida' | 'cancelada';
  estatisticas: {
    totalContatos: number;
    pendentes: number;
    enviados: number;
    sucessos: number;
    erros: number;
    percentualSucesso: number;
  };
  dataInicio?: number;
  dataConclusao?: number;
  ultimaAtualizacao: number;
}

interface UsePollingCampanhaReturn {
  status: StatusCampanha | null;
  isPolling: boolean;
  startPolling: (campanhaId: string, cliente: string, idInstancia: string) => void;
  stopPolling: () => void;
  onStatusChange?: (status: StatusCampanha) => void;
}

export function usePollingCampanha(onStatusChange?: (status: StatusCampanha) => void): UsePollingCampanhaReturn {
  const [status, setStatus] = useState<StatusCampanha | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const paramsRef = useRef<{ campanhaId: string; cliente: string; idInstancia: string } | null>(null);

  const fetchStatus = async () => {
    if (!paramsRef.current) return;

    const { campanhaId, cliente, idInstancia } = paramsRef.current;

    try {
      const response = await fetch(`/api/zcampanha/${cliente}/instancias/${idInstancia}/campanhas/${campanhaId}/status`);
      
      if (response.ok) {
        const data = await response.json();
        const newStatus = data.status;
        
        setStatus(prevStatus => {
          // Só atualizar se realmente mudou
          if (!prevStatus || 
              prevStatus.status !== newStatus.status || 
              prevStatus.estatisticas.sucessos !== newStatus.estatisticas.sucessos ||
              prevStatus.estatisticas.erros !== newStatus.estatisticas.erros) {
            
            // Chamar callback se fornecido
            if (onStatusChange) {
              onStatusChange(newStatus);
            }
            
            return newStatus;
          }
          return prevStatus;
        });

        // Parar polling se campanha finalizou
        if (['concluida', 'cancelada', 'pausada'].includes(newStatus.status)) {
          stopPolling();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar status da campanha:', error);
    }
  };

  const startPolling = (campanhaId: string, cliente: string, idInstancia: string) => {
    // Parar polling anterior se existir
    stopPolling();

    paramsRef.current = { campanhaId, cliente, idInstancia };
    setIsPolling(true);

    // Buscar status imediatamente
    fetchStatus();

    // Configurar polling a cada 3 segundos
    intervalRef.current = setInterval(fetchStatus, 3000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    paramsRef.current = null;
  };

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    status,
    isPolling,
    startPolling,
    stopPolling,
    onStatusChange
  };
}
