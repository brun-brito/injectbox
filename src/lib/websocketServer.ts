import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { Socket as NetSocket } from 'net';
import { Server as HTTPServer } from 'http';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiRequest {
  socket: SocketWithIO;
}

export type ProgressoCampanha = {
  campanhaId: string;
  status: 'iniciando' | 'criando-variacoes' | 'processando' | 'finalizando' | 'concluida' | 'erro' | 'pausada' | 'cancelada';
  loteAtual: number;
  totalLotes: number;
  contatosProcessados: number;
  totalContatos: number;
  sucessos: number;
  erros: number;
  iniciadoEm: number;
  ultimaAtualizacao: number;
  estimativaTermino?: number;
  mensagemStatus?: string;
  percentualConcluido: number;
};

class WebSocketManager {
  private static instance: WebSocketManager;
  private io: SocketIOServer | null = null;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initializeWebSocket(res: NextApiResponseWithSocket): SocketIOServer {
    if (!res.socket.server.io) {
      console.log('Inicializando WebSocket Server...');
      
      const io = new SocketIOServer(res.socket.server, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : "http://localhost:3000",
          methods: ["GET", "POST"]
        }
      });

      io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);

        socket.on('subscribe-campanha', (campanhaId: string) => {
          socket.join(`campanha-${campanhaId}`);
          console.log(`Cliente ${socket.id} inscrito na campanha ${campanhaId}`);
        });

        socket.on('unsubscribe-campanha', (campanhaId: string) => {
          socket.leave(`campanha-${campanhaId}`);
          console.log(`Cliente ${socket.id} cancelou inscrição da campanha ${campanhaId}`);
        });

        socket.on('disconnect', () => {
          console.log(`Cliente desconectado: ${socket.id}`);
        });
      });

      res.socket.server.io = io;
      this.io = io;
    } else {
      this.io = res.socket.server.io;
    }

    return this.io;
  }

  emitirProgressoCampanha(progresso: ProgressoCampanha) {
    if (this.io) {
      console.log(`[WebSocket] Emitindo progresso para campanha ${progresso.campanhaId}: ${progresso.percentualConcluido.toFixed(1)}%`);
      this.io.to(`campanha-${progresso.campanhaId}`).emit('progresso-campanha', progresso);
    }
  }

  emitirCampanhaConcluida(campanhaId: string, estatisticas: any) {
    if (this.io) {
      console.log(`[WebSocket] Emitindo conclusão da campanha ${campanhaId}`);
      this.io.to(`campanha-${campanhaId}`).emit('campanha-concluida', {
        campanhaId,
        estatisticas,
        timestamp: Date.now()
      });
    }
  }

  emitirErroCampanha(campanhaId: string, erro: string) {
    if (this.io) {
      console.log(`[WebSocket] Emitindo erro da campanha ${campanhaId}: ${erro}`);
      this.io.to(`campanha-${campanhaId}`).emit('erro-campanha', {
        campanhaId,
        erro,
        timestamp: Date.now()
      });
    }
  }
}

export default WebSocketManager;
