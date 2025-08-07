import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface SocketServer extends HttpServer {
  io?: SocketIOServer;
}

export interface WebSocketContext {
  req: NextApiRequest;
  res: NextApiResponse;
}

// Tipos mais permissivos para evitar conflitos
export type WebSocketRequest = NextApiRequest & {
  socket?: {
    server?: SocketServer;
  };
};

export type WebSocketResponse = NextApiResponse & {
  socket?: {
    server?: SocketServer;
  };
};

export type WebSocketInitParam = WebSocketContext | WebSocketRequest | WebSocketResponse;
