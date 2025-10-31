import type { VercelRequest, VercelResponse } from '@vercel/node';
import { docClient, TABLE_NAME } from './lib/dynamodb.js';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * API de búsqueda avanzada para tesauro
 * Implementa búsqueda fuzzy, autocompletado y detección de conceptos en texto
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { version = 'v1' } = req.query;
    const pk = `tesauro#${version}`;

    if (req.method === 'GET') {
      return await handleSearchQuery(req, res, pk);
    } else if (req.method === 'POST') {
      return await handleTextAnalysis(req, res, pk);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in tesauro search:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET: Búsqueda con autocompletado
async function handleSearchQuery(req: VercelRequest, res: VercelResponse, pk: string) {
  const { q, limit = '10', mode = 'fuzzy' } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  const maxLimit = Math.min(parseInt(limit as string), 50);

  // Obtener todos los conceptos activos
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':prefix': 'concept#',
    },
  });

  const result = await docClient.send(command);
  const conceptos = (result.Items || []).filter(c => c.estado !== 'obsoleto');

  // Búsqueda fuzzy
  const matches = conceptos
    .map(concepto => {
      const score = calculateMatchScore(q, concepto, mode as string);
      return { concepto, score };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLimit);

  return res.status(200).json({
    query: q,
    total: matches.length,
    results: matches.map(m => ({
      ...m.concepto,
      _matchScore: m.score,
    })),
  });
}

// POST: Detectar conceptos en texto CCT
async function handleTextAnalysis(req: VercelRequest, res: VercelResponse, pk: string) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text in body' });
  }

  // Obtener todos los conceptos activos
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':prefix': 'concept#',
    },
  });

  const result = await docClient.send(command);
  const conceptos = (result.Items || []).filter(c => c.estado !== 'obsoleto');

  // Detectar conceptos en el texto
  const detectedConcepts = detectConceptsInText(text, conceptos);

  return res.status(200).json({
    textLength: text.length,
    conceptsFound: detectedConcepts.length,
    concepts: detectedConcepts,
    coverage: calculateCoverage(text, detectedConcepts),
  });
}

// Calcular score de coincidencia (0-100)
function calculateMatchScore(query: string, concepto: any, mode: string): number {
  const queryLower = query.toLowerCase().trim();
  const termino = concepto.termino_preferido?.toLowerCase() || '';
  const terminosNoPref = concepto.terminos_no_preferidos?.map((t: string) => t.toLowerCase()) || [];
  const definicion = concepto.definicion?.toLowerCase() || '';

  let score = 0;

  // Coincidencia exacta en término preferido (máxima prioridad)
  if (termino === queryLower) {
    score = 100;
  }
  // Empieza con el término (alta prioridad)
  else if (termino.startsWith(queryLower)) {
    score = 90;
  }
  // Contiene el término (prioridad media)
  else if (termino.includes(queryLower)) {
    score = 70;
  }
  // Coincidencia en términos no preferidos
  else if (terminosNoPref.some((t: string) => t === queryLower)) {
    score = 85;
  } else if (terminosNoPref.some((t: string) => t.startsWith(queryLower))) {
    score = 75;
  } else if (terminosNoPref.some((t: string) => t.includes(queryLower))) {
    score = 60;
  }
  // Coincidencia en definición (baja prioridad)
  else if (definicion.includes(queryLower)) {
    score = 40;
  }
  // Búsqueda fuzzy (coincidencia parcial de palabras)
  else if (mode === 'fuzzy') {
    const queryWords = queryLower.split(/\s+/);
    const terminoWords = termino.split(/\s+/);

    const matchingWords = queryWords.filter(qw =>
      terminoWords.some(tw => tw.includes(qw) || qw.includes(tw))
    );

    if (matchingWords.length > 0) {
      score = (matchingWords.length / queryWords.length) * 50;
    }
  }

  // Bonus por coincidencia en acrónimo
  if (concepto.acronimo?.toLowerCase() === queryLower) {
    score = Math.max(score, 95);
  }

  // Bonus por categorías populares
  if (concepto.categorias?.includes('fundamental')) {
    score += 5;
  }

  return Math.min(score, 100);
}

// Detectar conceptos mencionados en un texto
function detectConceptsInText(text: string, conceptos: any[]): any[] {
  const textLower = text.toLowerCase();
  const detected: Array<{
    concepto: any;
    occurrences: number;
    positions: Array<{ start: number; end: number; match: string }>;
  }> = [];

  for (const concepto of conceptos) {
    const terminos = [
      concepto.termino_preferido,
      ...(concepto.terminos_no_preferidos || []),
    ];

    if (concepto.acronimo) {
      terminos.push(concepto.acronimo);
    }

    const positions: Array<{ start: number; end: number; match: string }> = [];

    for (const termino of terminos) {
      // Buscar el término como palabra completa (con límites de palabra)
      const regex = new RegExp(`\\b${escapeRegex(termino)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        positions.push({
          start: match.index,
          end: match.index + match[0].length,
          match: match[0],
        });
      }
    }

    if (positions.length > 0) {
      detected.push({
        concepto: {
          id: concepto.id,
          termino_preferido: concepto.termino_preferido,
          definicion: concepto.definicion,
          categorias: concepto.categorias,
        },
        occurrences: positions.length,
        positions,
      });
    }
  }

  // Ordenar por número de ocurrencias (más frecuente primero)
  return detected.sort((a, b) => b.occurrences - a.occurrences);
}

// Calcular cobertura del tesauro en el texto (% de palabras que son conceptos)
function calculateCoverage(text: string, detectedConcepts: any[]): number {
  const totalWords = text.split(/\s+/).length;
  const coveredWords = detectedConcepts.reduce(
    (sum, dc) => sum + dc.positions.reduce((s: number, p: any) => s + p.match.split(/\s+/).length, 0),
    0
  );

  return totalWords > 0 ? Math.round((coveredWords / totalWords) * 100) : 0;
}

// Escapar caracteres especiales de regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
