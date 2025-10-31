/**
 * Script para migrar el tesauro desde el JSON local a DynamoDB
 * Uso: node scripts/migrate-tesauro.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTION_URL = 'https://cct-json.vercel.app';

async function migrateTesauro() {
  console.log('🚀 Iniciando migración del tesauro...\n');

  // 1. Leer el archivo JSON del tesauro
  const tesauroPath = path.join(__dirname, '..', 'public', 'tesauro_convenios_colectivos.json');
  console.log('📖 Leyendo tesauro desde:', tesauroPath);

  if (!fs.existsSync(tesauroPath)) {
    console.error('❌ Error: No se encontró el archivo del tesauro en:', tesauroPath);
    process.exit(1);
  }

  const tesauroData = JSON.parse(fs.readFileSync(tesauroPath, 'utf-8'));
  console.log(`✅ Tesauro cargado: ${tesauroData.tesauro.conceptos.length} conceptos\n`);

  // 2. Enviar al endpoint de migración
  console.log('📤 Enviando datos al servidor...');
  console.log(`URL: ${PRODUCTION_URL}/api/tesauro-migrate\n`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/tesauro-migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tesauro: tesauroData,
        targetVersion: 'v1',
        dryRun: false, // Cambiar a true para simular sin guardar
      }),
    });

    const result = await response.json();

    console.log('\n📊 Resultado de la migración:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(result, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.ok) {
      console.log('✅ ¡Migración completada exitosamente!');
      console.log(`✨ ${result.migratedCount} conceptos migrados a DynamoDB`);

      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️  ${result.errors.length} error(es) encontrado(s):`);
        result.errors.forEach(err => {
          console.log(`   - Batch ${err.batch}: ${err.error}`);
        });
      }
    } else {
      console.error('❌ Error en la migración:', result.message || result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar la migración
migrateTesauro().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
