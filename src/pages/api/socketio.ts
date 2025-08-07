import { NextApiRequest, NextApiResponse } from 'next';
import WebSocketManager from '@/lib/websocketServer';
import { WebSocketContext } from '@/types/websocket';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const wsManager = WebSocketManager.getInstance();
    const context: WebSocketContext = { req, res };
    wsManager.initializeWebSocket(context);
    
    res.status(200).json({ message: 'WebSocket inicializado' });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
