import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * PUT /api/sessioni/[id]
 * Termina una sessione
 */
export async function PUT(
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
    const { punteggio_finale, note } = body

    // Verifica permessi
    const sessionData = await sql`
      SELECT s.paziente_id, s.data_inizio
      FROM sessioni_riabilitazione s
      WHERE s.id = ${sessionId}
    `

    if (sessionData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Sessione non trovata' },
        { status: 404 }
      )
    }

    // Calcola durata
    const dataInizio = new Date(sessionData[0].data_inizio)
    const dataFine = new Date()
    const durataMinuti = Math.floor((dataFine.getTime() - dataInizio.getTime()) / 1000 / 60)

    // Aggiorna sessione
    await sql`
      UPDATE sessioni_riabilitazione
      SET
        data_fine = ${dataFine.toISOString()},
        durata_minuti = ${durataMinuti},
        stato = 'completata',
        punteggio_finale = ${punteggio_finale || null},
        note = ${note || ''}
      WHERE id = ${sessionId}
    `

    return NextResponse.json({
      success: true,
      message: 'Sessione completata'
    })

  } catch (error) {
    console.error('Errore terminazione sessione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessioni/[id]
 * Annulla una sessione
 */
export async function DELETE(
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

    await sql`
      UPDATE sessioni_riabilitazione
      SET stato = 'annullata'
      WHERE id = ${sessionId}
    `

    return NextResponse.json({
      success: true,
      message: 'Sessione annullata'
    })

  } catch (error) {
    console.error('Errore annullamento sessione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
