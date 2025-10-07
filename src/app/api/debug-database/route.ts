import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon/client'

// Helper per creare identifier sicuri (solo per tabelle della whitelist)
function safeIdentifier(name: string): string {
  // Valida che il nome contenga solo caratteri alfanumerici e underscore
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid table name: ${name}`)
  }
  return name
}

export async function GET() {
  try {
    const knownTables = [
      'profili',
      'fisioterapisti',
      'pazienti',
      'categorie_esercizi',
      'tipi_esercizio',
      'esercizi_pazienti',
      'sessioni_riabilitazione',
      'dati_movimento',
      'obiettivi_terapeutici',
      'configurazioni_sistema'
    ]

    const results = []

    for (const tableName of knownTables) {
      try {
        // Valida il nome della tabella
        const safeTable = safeIdentifier(tableName)

        // Controlla se la tabella esiste
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = ${tableName}
          )
        `

        if (!tableExists[0].exists) {
          results.push({
            name: tableName,
            count: 0,
            error: 'Tabella non esistente',
            exists: false
          })
          continue
        }

        // Conta i record - usa sql.unsafe() per nomi tabelle dalla whitelist
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql.unsafe(safeTable)}`
        const count = parseInt(countResult[0].count)

        // Ottieni la struttura della tabella
        const structure = await sql`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `

        // Ottieni un record di esempio se la tabella non è vuota
        let sampleData = null
        if (count > 0) {
          const sampleResult = await sql`SELECT * FROM ${sql.unsafe(safeTable)} LIMIT 1`
          sampleData = sampleResult[0]
        }

        results.push({
          name: tableName,
          count,
          exists: true,
          structure: structure.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          })),
          sampleData
        })

      } catch (error: any) {
        console.error(`Errore analisi tabella ${tableName}:`, error)
        results.push({
          name: tableName,
          count: 0,
          error: error.message,
          exists: false
        })
      }
    }

    // Test relazioni tra tabelle
    const relations = await testRelations()

    return NextResponse.json({
      success: true,
      tables: results,
      relations,
      summary: {
        totalTables: results.length,
        existingTables: results.filter(t => t.exists).length,
        tablesWithErrors: results.filter(t => t.error).length,
        totalRecords: results.reduce((sum, t) => sum + (t.count || 0), 0),
        emptyTables: results.filter(t => t.exists && t.count === 0).length
      }
    })

  } catch (error: any) {
    console.error('Errore analisi database:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}

async function testRelations() {
  const relations = []

  try {
    // Test relazione categorie -> tipi_esercizio
    const catEsercizi = await sql`
      SELECT
        ce.id_categoria,
        ce.nome_categoria,
        COUNT(te.id) as esercizi_count
      FROM categorie_esercizi ce
      LEFT JOIN tipi_esercizio te ON te.id_categoria = ce.id_categoria
      GROUP BY ce.id_categoria, ce.nome_categoria
    `

    relations.push({
      name: 'categorie_esercizi -> tipi_esercizio',
      status: 'ok',
      data: catEsercizi
    })
  } catch (error: any) {
    relations.push({
      name: 'categorie_esercizi -> tipi_esercizio',
      status: 'error',
      error: error.message
    })
  }

  try {
    // Test relazione fisioterapisti -> pazienti
    const fisiopazienti = await sql`
      SELECT
        f.id,
        f.numero_albo,
        COUNT(p.id) as pazienti_count
      FROM fisioterapisti f
      LEFT JOIN pazienti p ON p.fisioterapista_id = f.id
      GROUP BY f.id, f.numero_albo
    `

    relations.push({
      name: 'fisioterapisti -> pazienti',
      status: 'ok',
      data: fisiopazienti
    })
  } catch (error: any) {
    relations.push({
      name: 'fisioterapisti -> pazienti',
      status: 'error',
      error: error.message
    })
  }

  try {
    // Test relazione pazienti -> esercizi_pazienti
    const pazEsercizi = await sql`
      SELECT
        p.id,
        p.nome_paziente,
        p.cognome_paziente,
        COUNT(ep.id) as esercizi_assegnati
      FROM pazienti p
      LEFT JOIN esercizi_pazienti ep ON ep.paziente_id = p.id
      GROUP BY p.id, p.nome_paziente, p.cognome_paziente
    `

    relations.push({
      name: 'pazienti -> esercizi_pazienti',
      status: 'ok',
      data: pazEsercizi
    })
  } catch (error: any) {
    relations.push({
      name: 'pazienti -> esercizi_pazienti',
      status: 'error',
      error: error.message
    })
  }

  return relations
}
