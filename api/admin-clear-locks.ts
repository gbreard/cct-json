import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanByPrefix, deleteItem } from './lib/dynamodb';

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
    // Obtener todos los items que empiezan con "lock#"
    const items = await scanByPrefix('lock#');

    console.log(`[ADMIN] Found ${items.length} locks to clear:`, items.map(i => i.pk));

    if (items.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'No hay locks para limpiar',
        locksRemoved: 0
      });
    }

    // Eliminar todos los locks uno por uno
    let deletedCount = 0;
    for (const item of items) {
      try {
        await deleteItem(item.pk, item.sk);
        deletedCount++;
        console.log(`[ADMIN] Deleted lock: ${item.pk}`);
      } catch (err) {
        console.error(`[ADMIN] Error deleting ${item.pk}:`, err);
      }
    }

    console.log(`[ADMIN] Successfully deleted ${deletedCount}/${items.length} locks`);

    return res.status(200).json({
      ok: true,
      message: `${deletedCount} lock(s) eliminado(s) exitosamente`,
      locksRemoved: deletedCount,
      removedKeys: items.map(i => i.pk)
    });
  } catch (error) {
    console.error('[ADMIN] Error clearing locks:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
