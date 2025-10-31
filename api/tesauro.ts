import type { VercelRequest, VercelResponse } from '@vercel/node';
import { docClient, TABLE_NAME } from './lib/dynamodb.js';
import { PutCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * API para gestión de tesauro en DynamoDB
 *
 * Estructura DynamoDB:
 * - pk: "tesauro#version" (ej: "tesauro#v1")
 * - sk: "concept#{id}" (ej: "concept#C001")
 * - Metadatos del tesauro: sk: "metadata"
 */

export interface ConceptoEnriquecido {
  id: string;
  termino_preferido: string;
  acronimo?: string;
  terminos_no_preferidos: string[];
  definicion: string;

  // Categorización
  categorias: string[];
  etiquetas: string[];
  sector_aplicacion: "general" | "específico" | "sectorial";

  // Contexto legal
  marco_legal: {
    leyes: Array<{
      nombre: string;
      articulo?: string;
      link?: string;
    }>;
    jurisprudencia?: Array<{
      fallo: string;
      año: number;
      sintesis: string;
    }>;
  };

  // Relaciones semánticas enriquecidas
  relaciones: {
    // Jerárquicas
    terminos_especificos: string[];
    terminos_generales: string[];

    // Partitivas
    es_parte_de: string[];
    tiene_partes: string[];

    // Causales
    causa: string[];
    es_causado_por: string[];

    // Temporales
    precede_a: string[];
    sigue_a: string[];

    // Regulatorias
    regulado_por: string[];
    regula_a: string[];

    // Dependencias
    requiere: string[];
    es_requerido_por: string[];

    // Asociativas
    terminos_relacionados: string[];
    similar_a: string[];
    opuesto_a: string[];
  };

  // Computabilidad
  es_cuantificable: boolean;
  unidad_medida?: string;
  formula_calculo?: string;
  rango_valores?: {
    minimo?: number;
    maximo?: number;
  };

  // Metadatos de gestión
  version: number;
  fecha_creacion: string;
  fecha_modificacion: string;
  modificado_por: string;
  estado: "activo" | "obsoleto" | "propuesto";

  // Notas
  notas?: string[];
  ejemplos?: string[];
}

export interface TesaurosMetadata {
  version: string;
  titulo: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ambito: string;
  fuente: string;
  total_conceptos: number;
  idiomas: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { version = 'v1' } = req.query;
    const pk = `tesauro#${version}`;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, pk);

      case 'POST':
        return await handlePost(req, res, pk);

      case 'PUT':
        return await handlePut(req, res, pk);

      case 'DELETE':
        return await handleDelete(req, res, pk);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in tesauro API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET: Obtener conceptos o metadatos
async function handleGet(req: VercelRequest, res: VercelResponse, pk: string) {
  const { conceptId, search, category } = req.query;

  // Obtener un concepto específico
  if (conceptId) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND sk = :sk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': `concept#${conceptId}`,
      },
    });

    const result = await docClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    return res.status(200).json(result.Items[0]);
  }

  // Obtener todos los conceptos con paginación
  let conceptos: any[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': 'concept#',
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    conceptos = conceptos.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Filtrar por búsqueda (búsqueda fuzzy simple)
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    conceptos = conceptos.filter(c =>
      c.termino_preferido?.toLowerCase().includes(searchLower) ||
      c.terminos_no_preferidos?.some((t: string) => t.toLowerCase().includes(searchLower)) ||
      c.definicion?.toLowerCase().includes(searchLower)
    );
  }

  // Filtrar por categoría
  if (category && typeof category === 'string') {
    conceptos = conceptos.filter(c =>
      c.categorias?.includes(category)
    );
  }

  return res.status(200).json({
    total: conceptos.length,
    conceptos,
  });
}

// POST: Crear nuevo concepto
async function handlePost(req: VercelRequest, res: VercelResponse, pk: string) {
  const concepto: ConceptoEnriquecido = req.body;

  if (!concepto.id || !concepto.termino_preferido) {
    return res.status(400).json({
      error: 'Missing required fields: id, termino_preferido'
    });
  }

  // Agregar metadatos automáticos
  concepto.version = 1;
  concepto.fecha_creacion = new Date().toISOString();
  concepto.fecha_modificacion = new Date().toISOString();
  concepto.estado = concepto.estado || 'activo';

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk,
      sk: `concept#${concepto.id}`,
      ...concepto,
    },
    ConditionExpression: 'attribute_not_exists(pk)', // No sobrescribir si ya existe
  });

  try {
    await docClient.send(command);

    // Actualizar contador de conceptos en metadata
    await updateConceptCount(pk, 1);

    return res.status(201).json({
      ok: true,
      message: 'Concepto creado exitosamente',
      concepto
    });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({
        error: 'Concepto ya existe'
      });
    }
    throw error;
  }
}

// PUT: Actualizar concepto existente
async function handlePut(req: VercelRequest, res: VercelResponse, pk: string) {
  const concepto: ConceptoEnriquecido = req.body;

  if (!concepto.id) {
    return res.status(400).json({ error: 'Missing concept id' });
  }

  // Incrementar versión y actualizar fecha
  concepto.version = (concepto.version || 0) + 1;
  concepto.fecha_modificacion = new Date().toISOString();

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk,
      sk: `concept#${concepto.id}`,
      ...concepto,
    },
  });

  await docClient.send(command);

  return res.status(200).json({
    ok: true,
    message: 'Concepto actualizado exitosamente',
    concepto
  });
}

// DELETE: Eliminar concepto (marca como obsoleto, no elimina físicamente)
async function handleDelete(req: VercelRequest, res: VercelResponse, pk: string) {
  const { conceptId } = req.query;

  if (!conceptId || typeof conceptId !== 'string') {
    return res.status(400).json({ error: 'Missing conceptId' });
  }

  // Obtener concepto actual
  const getCommand = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND sk = :sk',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':sk': `concept#${conceptId}`,
    },
  });

  const result = await docClient.send(getCommand);

  if (!result.Items || result.Items.length === 0) {
    return res.status(404).json({ error: 'Concept not found' });
  }

  const concepto = result.Items[0];

  // Marcar como obsoleto en lugar de eliminar
  concepto.estado = 'obsoleto';
  concepto.fecha_modificacion = new Date().toISOString();

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: concepto,
  });

  await docClient.send(putCommand);

  // Actualizar contador
  await updateConceptCount(pk, -1);

  return res.status(200).json({
    ok: true,
    message: 'Concepto marcado como obsoleto'
  });
}

// Helper: Actualizar contador de conceptos en metadata
async function updateConceptCount(pk: string, increment: number) {
  try {
    const getCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND sk = :sk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'metadata',
      },
    });

    const result = await docClient.send(getCommand);

    if (result.Items && result.Items.length > 0) {
      const metadata = result.Items[0];
      metadata.total_conceptos = (metadata.total_conceptos || 0) + increment;
      metadata.fecha_actualizacion = new Date().toISOString();

      const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: metadata,
      });

      await docClient.send(putCommand);
    }
  } catch (error) {
    console.error('Error updating concept count:', error);
  }
}
