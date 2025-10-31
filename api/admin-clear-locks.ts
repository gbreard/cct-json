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
    // Usar scan en lugar de keys para mayor confiabilidad
    let cursor = 0;
    const allKeys: string[] = [];

    // Iterar usando SCAN para obtener todas las keys
    do {
      const result = await kv.scan(cursor, { match: 'lock:*', count: 100 });
      cursor = result[0];
      const keys = result[1];
      allKeys.push(...keys);
    } while (cursor !== 0);

    console.log(`[ADMIN] Found ${allKeys.length} locks to clear:`, allKeys);

    if (allKeys.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'No hay locks para limpiar',
        locksRemoved: 0
      });
    }

    // Eliminar todos los locks uno por uno con logging
    let deletedCount = 0;
    for (const key of allKeys) {
      try {
        const deleted = await kv.del(key);
        if (deleted) {
          deletedCount++;
          console.log(`[ADMIN] Deleted lock: ${key}`);
        }
      } catch (err) {
        console.error(`[ADMIN] Error deleting ${key}:`, err);
      }
    }

    console.log(`[ADMIN] Successfully deleted ${deletedCount}/${allKeys.length} locks`);

    return res.status(200).json({
      ok: true,
      message: `${deletedCount} lock(s) eliminado(s) exitosamente`,
      locksRemoved: deletedCount,
      removedKeys: allKeys
    });
  } catch (error) {
    console.error('[ADMIN] Error clearing locks:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
