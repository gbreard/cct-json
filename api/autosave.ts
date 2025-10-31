import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AutosaveData {
  data: any;
  userName: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Guardar autosave
      const { fileName, data, userName } = req.body;

      if (!fileName || !data) {
        return res.status(400).json({ error: 'fileName and data are required' });
      }

      const autosaveData: AutosaveData = {
        data,
        userName: userName || 'Usuario',
        timestamp: new Date().toISOString(),
      };

      const key = `autosave:${fileName}`;
      await kv.set(key, autosaveData);

      return res.status(200).json({
        ok: true,
        message: 'Autosave guardado exitosamente',
        timestamp: autosaveData.timestamp
      });
    }

    else if (req.method === 'GET') {
      // Recuperar autosave
      const { fileName } = req.query;

      if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ error: 'fileName is required' });
      }

      const key = `autosave:${fileName}`;
      const autosaveData = await kv.get<AutosaveData>(key);

      if (!autosaveData) {
        // Devolver 200 con null en lugar de 404 para evitar errores en consola
        return res.status(200).json({ data: null, timestamp: null, userName: null });
      }

      return res.status(200).json(autosaveData);
    }

    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in autosave API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
