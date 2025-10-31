import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ADMIN ENDPOINT: Limpia todos los locks de documentos
 *
 * USO: GET /api/admin-clear-locks
 *
 * IMPORTANTE: Solo usar en desarrollo o cuando sea necesario resetear el sistema
 */
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
        ok: true,
        message: 'No hay locks para limpiar',
        locksRemoved: 0
      });
    }

    // Eliminar todos los locks
    const deletePromises = keys.map(key => kv.del(key));
    await Promise.all(deletePromises);

    return res.status(200).json({
      ok: true,
      message: `${keys.length} lock(s) eliminado(s) exitosamente`,
      locksRemoved: keys.length,
      removedKeys: keys
    });
  } catch (error) {
    console.error('Error clearing locks:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
