import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function GET(request: NextRequest) {
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

    // Solo sviluppatori possono vedere tutti i fisioterapisti
    if (payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    // Carica tutti i fisioterapisti
    const result = await sql`
      SELECT
        f.id,
        f.numero_albo,
        f.specializzazione,
        f.nome_clinica,
        f.indirizzo_clinica,
        f.telefono,
        f.email_clinica,
        f.data_creazione,
        p.nome,
        p.cognome,
        p.email
      FROM fisioterapisti f
      JOIN profili p ON f.profilo_id = p.id
      ORDER BY f.data_creazione DESC
    `

    const fisioterapisti = result.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      cognome: row.cognome,
      email: row.email,
      numero_albo: row.numero_albo,
      specializzazione: row.specializzazione,
      nome_clinica: row.nome_clinica,
      indirizzo_clinica: row.indirizzo_clinica,
      telefono: row.telefono,
      email_clinica: row.email_clinica,
      data_creazione: row.data_creazione,
    }))

    return NextResponse.json({
      success: true,
      fisioterapisti,
    })
  } catch (error) {
    console.error('Errore caricamento fisioterapisti:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
