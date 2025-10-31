import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LockData {
  userName: string;
  timestamp: string;
  sessionId: string;
  lastHeartbeat: string;
}

// Lock expira después de 5 minutos sin heartbeat
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { fileName } = req.query;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const key = `lock:${fileName}`;

    if (req.method === 'GET') {
      // Verificar si hay un lock activo
      const lockData = await kv.get<LockData>(key);

      if (!lockData) {
        return res.status(200).json({ locked: false });
      }

      // Verificar si el lock expiró
      const lastHeartbeat = new Date(lockData.lastHeartbeat).getTime();
      const now = new Date().getTime();
      const isExpired = (now - lastHeartbeat) > LOCK_TIMEOUT_MS;

      if (isExpired) {
        // Lock expirado, eliminarlo
        await kv.del(key);
        return res.status(200).json({ locked: false, wasExpired: true });
      }

      return res.status(200).json({
        locked: true,
        userName: lockData.userName,
        timestamp: lockData.timestamp,
        lastHeartbeat: lockData.lastHeartbeat
      });
    }

    else if (req.method === 'POST') {
      // Intentar crear o renovar lock
      const { userName, sessionId, action } = req.body;

      if (!userName || !sessionId) {
        return res.status(400).json({ error: 'userName and sessionId are required' });
      }

      // Verificar si ya existe un lock
      const existingLock = await kv.get<LockData>(key);

      if (action === 'heartbeat') {
        // Renovar lock existente (heartbeat)
        if (!existingLock) {
          return res.status(404).json({ error: 'No lock found to renew' });
        }

        if (existingLock.sessionId !== sessionId) {
          return res.status(403).json({ error: 'Cannot renew lock owned by another session' });
        }

        // Actualizar heartbeat
        const updatedLock: LockData = {
          ...existingLock,
          lastHeartbeat: new Date().toISOString()
        };

        await kv.set(key, updatedLock);

        return res.status(200).json({
          ok: true,
          message: 'Lock renewed',
          lock: updatedLock
        });
      }

      else if (action === 'acquire') {
        // Adquirir nuevo lock
        if (existingLock) {
          // Verificar si está expirado
          const lastHeartbeat = new Date(existingLock.lastHeartbeat).getTime();
          const now = new Date().getTime();
          const isExpired = (now - lastHeartbeat) > LOCK_TIMEOUT_MS;

          if (!isExpired) {
            // Lock activo, no se puede adquirir
            return res.status(423).json({ // 423 Locked
              locked: true,
              userName: existingLock.userName,
              timestamp: existingLock.timestamp,
              message: 'Document is currently locked by another user'
            });
          }

          // Lock expirado, se puede sobrescribir
          console.log(`Lock expired for ${fileName}, allowing new lock`);
        }

        // Crear nuevo lock
        const newLock: LockData = {
          userName,
          sessionId,
          timestamp: new Date().toISOString(),
          lastHeartbeat: new Date().toISOString()
        };

        await kv.set(key, newLock);

        return res.status(200).json({
          ok: true,
          message: 'Lock acquired successfully',
          lock: newLock
        });
      }

      else {
        return res.status(400).json({ error: 'Invalid action. Use "acquire" or "heartbeat"' });
      }
    }

    else if (req.method === 'DELETE') {
      // Liberar lock
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const existingLock = await kv.get<LockData>(key);

      if (!existingLock) {
        return res.status(200).json({ ok: true, message: 'No lock to release' });
      }

      // Solo el dueño del lock puede liberarlo
      if (existingLock.sessionId !== sessionId) {
        return res.status(403).json({ error: 'Cannot release lock owned by another session' });
      }

      await kv.del(key);

      return res.status(200).json({
        ok: true,
        message: 'Lock released successfully'
      });
    }

    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in lock API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
