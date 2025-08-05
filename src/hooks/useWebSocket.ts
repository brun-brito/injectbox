import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProgressoCampanha } from '@/lib/websocketServer';

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribeToCampanha: (campanhaId: string) => void;
  unsubscribeFromCampanha: (campanhaId: string) => void;
  progressoCampanha: ProgressoCampanha | null;
  campanhasConcluidas: string[];
  errosCampanha: { [key: string]: string };
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [progressoCampanha, setProgressoCampanha] = useState<ProgressoCampanha | null>(null);
  const [campanhasConcluidas, setCampanhasConcluidas] = useState<string[]>([]);
  const [errosCampanha, setErrosCampanha] = useState<{ [key: string]: string }>({});
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Inicializar WebSocket
    socketRef.current = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL! 
      : 'http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('progresso-campanha', (progresso: ProgressoCampanha) => {
      console.log('Progresso recebido:', progresso);
      setProgressoCampanha(progresso);
    });

    socket.on('campanha-concluida', ({ campanhaId, estatisticas }) => {
      console.log(`Campanha ${campanhaId} concluída:`, estatisticas);
      setCampanhasConcluidas(prev => [...prev, campanhaId]);
      setProgressoCampanha(null); // Limpar progresso
    });

    socket.on('erro-campanha', ({ campanhaId, erro }) => {
      console.error(`Erro na campanha ${campanhaId}:`, erro);
      setErrosCampanha(prev => ({ ...prev, [campanhaId]: erro }));
      setProgressoCampanha(null); // Limpar progresso
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToCampanha = (campanhaId: string) => {
    if (socketRef.current) {
      console.log(`Inscrevendo-se na campanha ${campanhaId}`);
      socketRef.current.emit('subscribe-campanha', campanhaId);
    }
  };

  const unsubscribeFromCampanha = (campanhaId: string) => {
    if (socketRef.current) {
      console.log(`Cancelando inscrição da campanha ${campanhaId}`);
      socketRef.current.emit('unsubscribe-campanha', campanhaId);
    }
  };

  return {
    isConnected,
    subscribeToCampanha,
    unsubscribeFromCampanha,
    progressoCampanha,
    campanhasConcluidas,
    errosCampanha
  };
}
