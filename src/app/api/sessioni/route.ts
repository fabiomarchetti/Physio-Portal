import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * POST /api/sessioni
 * Crea una nuova sessione di riabilitazione
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { paziente_id, tipo_esercizio, obiettivi } = body

    if (!paziente_id || !tipo_esercizio) {
      return NextResponse.json(
        { success: false, message: 'paziente_id e tipo_esercizio sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica permessi
    if (payload.ruolo === 'paziente') {
      const checkResult = await sql`
        SELECT p.id FROM pazienti p
        WHERE p.id = ${paziente_id} AND p.profilo_id = ${payload.userId}
      `
      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    } else if (payload.ruolo === 'fisioterapista') {
      const fisioResult = await sql`
        SELECT f.id FROM fisioterapisti f
        WHERE f.profilo_id = ${payload.userId}
      `
      if (fisioResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Fisioterapista non trovato' },
          { status: 404 }
        )
      }

      const fisioId = fisioResult[0].id
      const checkResult = await sql`
        SELECT p.id FROM pazienti p
        WHERE p.id = ${paziente_id} AND p.fisioterapista_id = ${fisioId}
      `
      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    }

    // Crea sessione
    const result = await sql`
      INSERT INTO sessioni_riabilitazione (
        paziente_id,
        tipo_esercizio,
        obiettivi,
        note,
        stato,
        data_inizio
      ) VALUES (
        ${paziente_id},
        ${tipo_esercizio},
        ${obiettivi || ''},
        '',
        'attiva',
        NOW()
      )
      RETURNING id, paziente_id, tipo_esercizio, obiettivi, data_inizio, stato
    `

    return NextResponse.json({
      success: true,
      sessione: result[0]
    })

  } catch (error) {
    console.error('Errore creazione sessione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
