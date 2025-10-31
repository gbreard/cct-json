import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanByPrefix } from './lib/dynamodb.js';

interface LockData {
  userName: string;
  timestamp: string;
  sessionId: string;
  lastHeartbeat: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener todos los items que empiezan con "lock#"
    const items = await scanByPrefix('lock#');

    if (items.length === 0) {
      return res.status(200).json({
        count: 0,
        locks: [],
        message: 'No hay locks activos'
      });
    }

    // Mapear los items a formato de respuesta
    const locks = items.map(item => ({
      key: item.pk,
      fileName: item.pk.replace('lock#', ''),
      userName: item.userName,
      timestamp: item.timestamp,
      lastHeartbeat: item.lastHeartbeat,
      sessionId: item.sessionId
    }));

    return res.status(200).json({
      count: locks.length,
      locks,
      message: `${locks.length} lock(s) activo(s)`
    });
  } catch (error) {
    console.error('Error listing locks:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
