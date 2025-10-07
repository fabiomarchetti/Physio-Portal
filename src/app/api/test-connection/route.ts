import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon/client'

export async function GET() {
  try {
    // Test connessione database
    const result = await sql`SELECT NOW() as current_time, version() as db_version`

    // Test presenza tabelle
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Test presenza funzione login_sviluppatore
    const functions = await sql`
      SELECT proname
      FROM pg_proc
      WHERE proname LIKE '%login%'
    `

    return NextResponse.json({
      success: true,
      database_connected: true,
      database_url_present: !!process.env.DATABASE_URL,
      current_time: result[0]?.current_time,
      db_version: result[0]?.db_version,
      tables: tables.map(t => t.table_name),
      login_functions: functions.map(f => f.proname),
    })
  } catch (error) {
    console.error('Errore test connessione:', error)
    return NextResponse.json({
      success: false,
      database_connected: false,
      database_url_present: !!process.env.DATABASE_URL,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    }, { status: 500 })
  }
}
