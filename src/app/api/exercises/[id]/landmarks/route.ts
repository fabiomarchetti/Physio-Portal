import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 })
    }

    const exerciseId = params.id
    const body = await request.json()
    const { landmark, landmark_config } = body

    // Aggiorna l'esercizio con i landmark configurati
    const result = await sql`
      UPDATE tipi_esercizio
      SET
        configurazione_mediapipe = ${JSON.stringify(landmark_config)},
        data_aggiornamento = NOW()
      WHERE id = ${exerciseId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Esercizio non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Landmark aggiornati con successo',
      data: result[0]
    })

  } catch (error) {
    console.error('Errore API aggiornamento landmark:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
