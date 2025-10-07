import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon/client'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { success: false, message: 'Filename richiesto' },
        { status: 400 }
      )
    }

    // Leggi il file SQL
    const sqlFilePath = path.join(process.cwd(), 'database_neon', filename)

    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json(
        { success: false, message: `File non trovato: ${filename}` },
        { status: 404 }
      )
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

    console.log(`📄 Esecuzione migrazione: ${filename}`)
    console.log('─'.repeat(60))

    // Esegui lo script SQL
    // Nota: Neon serverless non supporta multi-statement in una singola query
    // Dobbiamo splitare lo script e eseguire statement per statement

    // Split per statement (semplificato - funziona per la maggior parte dei casi)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    const results = []
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Usa template literal per Neon serverless
          const executeSql = new Function('sql', `return sql\`${statement}\``)
          const result = await executeSql(sql)
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true
          })
        } catch (err: any) {
          // Ignora errori "already exists" o simili
          if (err.message?.includes('already exists') ||
              err.message?.includes('duplicate')) {
            results.push({
              statement: statement.substring(0, 100) + '...',
              success: true,
              note: 'Already exists (skipped)'
            })
          } else {
            results.push({
              statement: statement.substring(0, 100) + '...',
              success: false,
              error: err.message
            })
          }
        }
      }
    }

    console.log('✅ Migrazione completata!')
    console.log(`📊 Statement eseguiti: ${results.length}`)

    return NextResponse.json({
      success: true,
      message: `Migrazione ${filename} eseguita con successo`,
      results,
      totalStatements: results.length
    })

  } catch (error: any) {
    console.error('❌ Errore durante la migrazione:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Errore durante la migrazione' },
      { status: 500 }
    )
  }
}
