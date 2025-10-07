import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione
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

    // Solo sviluppatori possono resettare password
    if (payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Ottieni email fisioterapista
    const fisioResult = await sql`
      SELECT f.profilo_id, p.email
      FROM fisioterapisti f
      JOIN profili p ON f.profilo_id = p.id
      WHERE f.id = ${id}
    `

    if (fisioResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fisioterapista non trovato' },
        { status: 404 }
      )
    }

    const { profilo_id, email } = fisioResult[0]

    // Genera nuova password temporanea (prime 8 caratteri dell'email + 123)
    const nuovaPassword = email.substring(0, 8) + '123'

    // Aggiorna password usando la funzione SQL hash_password (pgcrypto)
    // IMPORTANTE: Deve usare la stessa funzione usata in registrazione
    await sql`
      UPDATE profili
      SET password_hash = hash_password(${nuovaPassword}),
          data_aggiornamento = NOW()
      WHERE id = ${profilo_id}
    `

    return NextResponse.json({
      success: true,
      message: 'Password resettata con successo',
      nuovaPassword,
    })
  } catch (error) {
    console.error('Errore reset password:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
