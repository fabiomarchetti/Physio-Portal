import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon/client'

export async function GET() {
  try {
    // Test connessione database
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`

    // Test query tabella profili
    const profiliCount = await sql`SELECT COUNT(*) as count FROM profili`

    return NextResponse.json({
      success: true,
      message: 'Connessione al database Neon riuscita!',
      data: {
        serverTime: result[0].current_time,
        postgresVersion: result[0].pg_version,
        profiliCount: profiliCount[0].count,
      },
    })
  } catch (error) {
    console.error('Errore test database:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore connessione database',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}
