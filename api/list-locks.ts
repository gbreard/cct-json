import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    // Obtener todas las keys que empiezan con "lock:"
    const keys = await kv.keys('lock:*');

    if (keys.length === 0) {
      return res.status(200).json({
        count: 0,
        locks: [],
        message: 'No hay locks activos'
      });
    }

    // Obtener los datos de cada lock
    const lockPromises = keys.map(async (key) => {
      const lockData = await kv.get<LockData>(key);
      return {
        key,
        fileName: key.replace('lock:', ''),
        ...lockData
      };
    });

    const locks = await Promise.all(lockPromises);

    return res.status(200).json({
      count: locks.length,
      locks: locks.filter(lock => lock.userName), // Filtrar locks inválidos
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
