import { NextApiRequest, NextApiResponse } from 'next';
import WebSocketManager from '@/lib/websocketServer';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const wsManager = WebSocketManager.getInstance();
    wsManager.initializeWebSocket(res as any);
    
    res.status(200).json({ message: 'WebSocket inicializado' });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
