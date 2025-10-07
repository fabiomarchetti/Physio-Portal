/**
 * Script per eseguire migrazioni SQL sul database Neon
 * Usage: node run-migration.js <nome-file.sql>
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Leggi DATABASE_URL da .env.local
function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL='([^']+)'/);
  if (!match) {
    throw new Error('DATABASE_URL not found in .env.local');
  }
  return match[1];
}

async function runMigration(sqlFilePath) {
  const sql = neon(getDatabaseUrl());

  try {
    console.log('🔌 Connessione al database Neon...');
    console.log('✅ Connesso!');

    // Leggi il file SQL
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`\n📄 Esecuzione script: ${path.basename(sqlFilePath)}`);
    console.log('─'.repeat(60));

    // Esegui lo script SQL
    const result = await sql(sqlContent);
    console.log('✅ Script eseguito con successo!');

    if (Array.isArray(result)) {
      console.log(`\n📊 Risultati: ${result.length} righe`);
    }

  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione dello script:');
    console.error(error.message);
    console.error('\nDettagli errore:');
    console.error(error);
    process.exit(1);
  } finally {
    console.log('\n🔌 Connessione chiusa');
  }
}

// Main
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('❌ Specifica il file SQL da eseguire');
  console.error('Usage: node run-migration.js <nome-file.sql>');
  process.exit(1);
}

const sqlFilePath = path.join(__dirname, sqlFile);
if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ File non trovato: ${sqlFilePath}`);
  process.exit(1);
}

runMigration(sqlFilePath);
