import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ENDPOINT DE DIAGNÓSTICO: Muestra TODO el estado de KV
 * USO: GET /api/debug-kv
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
    const result: any = {
      timestamp: new Date().toISOString(),
      locks: [],
      autosaves: [],
      allKeys: []
    };

    // Buscar TODAS las keys con diferentes métodos
    console.log('[DEBUG] Starting KV scan...');

    // Método 1: SCAN con match lock:*
    let cursor = 0;
    const lockKeys: string[] = [];
    do {
      const scanResult = await kv.scan(cursor, { match: 'lock:*', count: 100 });
      cursor = scanResult[0];
      const keys = scanResult[1];
      lockKeys.push(...keys);
      console.log(`[DEBUG] SCAN lock:* cursor=${cursor} found=${keys.length}`);
    } while (cursor !== 0);

    console.log(`[DEBUG] Total lock keys found: ${lockKeys.length}`, lockKeys);

    // Método 2: SCAN con match autosave:*
    cursor = 0;
    const autosaveKeys: string[] = [];
    do {
      const scanResult = await kv.scan(cursor, { match: 'autosave:*', count: 100 });
      cursor = scanResult[0];
      const keys = scanResult[1];
      autosaveKeys.push(...keys);
      console.log(`[DEBUG] SCAN autosave:* cursor=${cursor} found=${keys.length}`);
    } while (cursor !== 0);

    console.log(`[DEBUG] Total autosave keys found: ${autosaveKeys.length}`);

    // Método 3: SCAN sin filtro (TODAS las keys)
    cursor = 0;
    const allKeys: string[] = [];
    do {
      const scanResult = await kv.scan(cursor, { count: 100 });
      cursor = scanResult[0];
      const keys = scanResult[1];
      allKeys.push(...keys);
      console.log(`[DEBUG] SCAN * cursor=${cursor} found=${keys.length}`);
    } while (cursor !== 0);

    console.log(`[DEBUG] Total keys in DB: ${allKeys.length}`, allKeys);

    // Obtener datos de cada lock
    for (const key of lockKeys) {
      const lockData = await kv.get(key);
      result.locks.push({
        key,
        data: lockData
      });
    }

    // Obtener datos de algunos autosaves (máximo 10)
    for (const key of autosaveKeys.slice(0, 10)) {
      const autosaveData = await kv.get(key);
      result.autosaves.push({
        key,
        hasData: !!autosaveData
      });
    }

    result.allKeys = allKeys;
    result.summary = {
      totalKeys: allKeys.length,
      lockKeysFound: lockKeys.length,
      autosaveKeysFound: autosaveKeys.length
    };

    console.log('[DEBUG] Returning result:', result.summary);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
