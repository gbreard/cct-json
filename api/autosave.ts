import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getItem, putItem } from './lib/dynamodb.js';

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

      const pk = `autosave#${fileName}`;
      const sk = 'metadata';

      const autosaveData: AutosaveData = {
        data,
        userName: userName || 'Usuario',
        timestamp: new Date().toISOString(),
      };

      await putItem(pk, sk, autosaveData);

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

      const pk = `autosave#${fileName}`;
      const sk = 'metadata';

      const item = await getItem(pk, sk);

      if (!item) {
        // Devolver 200 con null en lugar de 404 para evitar errores en consola
        return res.status(200).json({ data: null, timestamp: null, userName: null });
      }

      const autosaveData = item as AutosaveData;

      return res.status(200).json({
        data: autosaveData.data,
        timestamp: autosaveData.timestamp,
        userName: autosaveData.userName
      });
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
