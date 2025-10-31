import type { VercelRequest, VercelResponse } from '@vercel/node';
import { docClient, TABLE_NAME } from './lib/dynamodb.js';
import { PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * ADMIN ENDPOINT: Migrar tesauro desde JSON a DynamoDB
 *
 * USO: POST /api/tesauro-migrate
 * Body: { tesauro: <JSON del tesauro completo> }
 *
 * Este endpoint toma el tesauro actual y lo migra a DynamoDB con la estructura enriquecida
 */

interface ConceptoAntiguo {
  id: string;
  termino_preferido: string;
  acronimo?: string;
  terminos_no_preferidos: string[];
  definicion: string;
  relaciones: {
    terminos_especificos: string[];
    terminos_generales: string[];
    terminos_relacionados: string[];
  };
  notas?: string[];
}

interface TesauroAntiguo {
  tesauro: {
    titulo: string;
    version: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    ambito: string;
    fuente: string;
    conceptos: ConceptoAntiguo[];
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tesauro, targetVersion = 'v1', dryRun = false }: {
      tesauro: TesauroAntiguo;
      targetVersion?: string;
      dryRun?: boolean;
    } = req.body;

    if (!tesauro || !tesauro.tesauro || !tesauro.tesauro.conceptos) {
      return res.status(400).json({
        error: 'Invalid tesauro format. Expected: { tesauro: { conceptos: [...] } }'
      });
    }

    const pk = `tesauro#${targetVersion}`;
    const conceptosAntiguos = tesauro.tesauro.conceptos;

    console.log(`[MIGRATE] Starting migration of ${conceptosAntiguos.length} concepts to ${pk}`);

    // Categorizar conceptos automáticamente basado en patrones
    const conceptosEnriquecidos = conceptosAntiguos.map(antiguo =>
      enrichConcept(antiguo, tesauro.tesauro)
    );

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        message: 'Migración simulada (no se guardó nada)',
        totalConceptos: conceptosEnriquecidos.length,
        preview: conceptosEnriquecidos.slice(0, 5),
      });
    }

    // Guardar metadata del tesauro
    const metadata = {
      pk,
      sk: 'metadata',
      version: targetVersion,
      titulo: tesauro.tesauro.titulo,
      fecha_creacion: tesauro.tesauro.fecha_creacion,
      fecha_actualizacion: new Date().toISOString(),
      ambito: tesauro.tesauro.ambito,
      fuente: tesauro.tesauro.fuente,
      total_conceptos: conceptosEnriquecidos.length,
      idiomas: ['es'],
      version_origen: tesauro.tesauro.version,
    };

    const metadataCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: metadata,
    });

    await docClient.send(metadataCommand);

    // Migrar conceptos en lotes (DynamoDB permite max 25 items por batch)
    const batchSize = 25;
    let migratedCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < conceptosEnriquecidos.length; i += batchSize) {
      const batch = conceptosEnriquecidos.slice(i, i + batchSize);

      try {
        const putRequests = batch.map(concepto => ({
          PutRequest: {
            Item: {
              pk,
              sk: `concept#${concepto.id}`,
              ...concepto,
            },
          },
        }));

        const batchCommand = new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: putRequests,
          },
        });

        await docClient.send(batchCommand);
        migratedCount += batch.length;

        console.log(`[MIGRATE] Batch ${Math.floor(i / batchSize) + 1} completed: ${migratedCount}/${conceptosEnriquecidos.length}`);
      } catch (error) {
        console.error(`[MIGRATE] Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Migración completada',
      targetVersion,
      totalConceptos: conceptosEnriquecidos.length,
      migratedCount,
      errors: errors.length > 0 ? errors : undefined,
      metadata,
    });
  } catch (error) {
    console.error('[MIGRATE] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Enriquecer un concepto antiguo con la nueva estructura
function enrichConcept(antiguo: ConceptoAntiguo, tesauroInfo: any): any {
  // Detectar categorías automáticamente basado en patrones
  const categorias = detectCategories(antiguo);

  // Detectar sector de aplicación
  const sector_aplicacion = detectSector(antiguo);

  // Extraer marco legal de las notas
  const marco_legal = extractLegalFramework(antiguo.notas || []);

  // Detectar si es cuantificable
  const es_cuantificable = detectQuantifiable(antiguo);

  return {
    id: antiguo.id,
    termino_preferido: antiguo.termino_preferido,
    acronimo: antiguo.acronimo,
    terminos_no_preferidos: antiguo.terminos_no_preferidos || [],
    definicion: antiguo.definicion || '',

    // Categorización
    categorias,
    etiquetas: [],
    sector_aplicacion,

    // Contexto legal
    marco_legal,

    // Relaciones semánticas (expandidas)
    relaciones: {
      // Mantener las relaciones existentes
      terminos_especificos: antiguo.relaciones?.terminos_especificos || [],
      terminos_generales: antiguo.relaciones?.terminos_generales || [],
      terminos_relacionados: antiguo.relaciones?.terminos_relacionados || [],

      // Nuevas relaciones (inicialmente vacías, se enriquecerán después)
      es_parte_de: [],
      tiene_partes: [],
      causa: [],
      es_causado_por: [],
      precede_a: [],
      sigue_a: [],
      regulado_por: [],
      regula_a: [],
      requiere: [],
      es_requerido_por: [],
      similar_a: [],
      opuesto_a: [],
    },

    // Computabilidad
    es_cuantificable,
    unidad_medida: es_cuantificable ? detectUnit(antiguo) : undefined,
    formula_calculo: undefined,
    rango_valores: undefined,

    // Metadatos
    version: 1,
    fecha_creacion: new Date().toISOString(),
    fecha_modificacion: new Date().toISOString(),
    modificado_por: 'sistema_migracion',
    estado: 'activo',

    // Notas
    notas: antiguo.notas || [],
    ejemplos: [],
  };
}

// Detectar categorías basado en el término y definición
function detectCategories(concepto: ConceptoAntiguo): string[] {
  const categorias: string[] = [];
  const termino = concepto.termino_preferido.toLowerCase();
  const definicion = (concepto.definicion || '').toLowerCase();
  const text = `${termino} ${definicion}`;

  // Categorías fundamentales
  if (
    termino.includes('convenio colectivo') ||
    termino.includes('acuerdo') ||
    termino.includes('negociación')
  ) {
    categorias.push('negociacion_colectiva');
  }

  if (
    text.includes('salario') ||
    text.includes('remuneración') ||
    text.includes('sueldo') ||
    text.includes('pago')
  ) {
    categorias.push('remuneraciones');
  }

  if (
    text.includes('jornada') ||
    text.includes('horario') ||
    text.includes('turno') ||
    text.includes('descanso')
  ) {
    categorias.push('jornada_laboral');
  }

  if (
    text.includes('licencia') ||
    text.includes('vacaciones') ||
    text.includes('permiso')
  ) {
    categorias.push('licencias_permisos');
  }

  if (
    text.includes('seguridad') ||
    text.includes('higiene') ||
    text.includes('riesgo') ||
    text.includes('protección')
  ) {
    categorias.push('seguridad_higiene');
  }

  if (
    text.includes('capacitación') ||
    text.includes('formación') ||
    text.includes('entrenamiento')
  ) {
    categorias.push('capacitacion');
  }

  if (
    text.includes('sindicato') ||
    text.includes('representación') ||
    text.includes('delegado')
  ) {
    categorias.push('representacion_sindical');
  }

  if (categorias.length === 0) {
    categorias.push('general');
  }

  return categorias;
}

// Detectar sector de aplicación
function detectSector(concepto: ConceptoAntiguo): "general" | "específico" | "sectorial" {
  const termino = concepto.termino_preferido.toLowerCase();

  if (
    termino.includes('general') ||
    termino.includes('marco') ||
    concepto.id.startsWith('C00')
  ) {
    return 'general';
  }

  if (
    termino.includes('sector') ||
    termino.includes('actividad') ||
    termino.includes('rama')
  ) {
    return 'sectorial';
  }

  return 'específico';
}

// Extraer marco legal de las notas
function extractLegalFramework(notas: string[]): any {
  const leyes: any[] = [];

  for (const nota of notas) {
    // Buscar referencias a leyes (ej: "Ley 14.250", "Artículo 5°")
    const leyMatch = nota.match(/Ley\s+(\d+\.?\d*)/i);
    const articuloMatch = nota.match(/Artículo\s+(\d+°?)/i);

    if (leyMatch) {
      leyes.push({
        nombre: `Ley ${leyMatch[1]}`,
        articulo: articuloMatch ? articuloMatch[1] : undefined,
        link: undefined,
      });
    }
  }

  return {
    leyes,
    jurisprudencia: [],
  };
}

// Detectar si el concepto es cuantificable
function detectQuantifiable(concepto: ConceptoAntiguo): boolean {
  const text = `${concepto.termino_preferido} ${concepto.definicion || ''}`.toLowerCase();

  return (
    text.includes('monto') ||
    text.includes('porcentaje') ||
    text.includes('cantidad') ||
    text.includes('días') ||
    text.includes('horas') ||
    text.includes('%') ||
    /\d+/.test(text) // Contiene números
  );
}

// Detectar unidad de medida
function detectUnit(concepto: ConceptoAntiguo): string | undefined {
  const text = `${concepto.termino_preferido} ${concepto.definicion || ''}`.toLowerCase();

  if (text.includes('pesos') || text.includes('$')) return 'pesos';
  if (text.includes('días')) return 'días';
  if (text.includes('horas')) return 'horas';
  if (text.includes('porcentaje') || text.includes('%')) return 'porcentaje';
  if (text.includes('años')) return 'años';
  if (text.includes('meses')) return 'meses';

  return undefined;
}
