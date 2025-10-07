import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * POST /api/sessioni/[id]/metriche
 * Aggiunge metriche alla sessione
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autenticato' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params
    const body = await request.json()
    const { metrics } = body

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { success: false, message: 'metrics array richiesto' },
        { status: 400 }
      )
    }

    for (const metric of metrics) {
      await sql`
        INSERT INTO metriche_sessione (
          sessione_id,
          tipo_metrica,
          valore_metrica,
          unita_misura,
          articolazione,
          timestamp_calcolo
        ) VALUES (
          ${sessionId},
          ${metric.tipo},
          ${metric.valore},
          ${metric.unitaMisura},
          ${metric.articolazione || null},
          NOW()
        )
      `
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Errore salvataggio metriche:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sessioni/[id]/metriche
 * Ottiene le metriche di una sessione
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autenticato' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params

    const result = await sql`
      SELECT
        id,
        tipo_metrica,
        valore_metrica,
        unita_misura,
        articolazione,
        timestamp_calcolo
      FROM metriche_sessione
      WHERE sessione_id = ${sessionId}
      ORDER BY timestamp_calcolo ASC
    `

    return NextResponse.json({
      success: true,
      metriche: result
    })

  } catch (error) {
    console.error('Errore recupero metriche:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
