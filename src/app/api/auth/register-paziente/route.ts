import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { registraPaziente } from '@/lib/neon/auth'
import { verifyToken } from '@/lib/neon/auth'

export async function POST(request: NextRequest) {
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

    // Solo fisioterapisti e sviluppatori possono registrare pazienti
    if (payload.ruolo !== 'fisioterapista' && payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      fisioterapistaId,
      nome,
      cognome,
      dataNascita,
      codiceFiscale,
      diagnosi,
      pianoTerapeutico,
      telefono,
      note,
    } = body

    // Validazione dati
    if (!nome || !cognome || !dataNascita || !codiceFiscale) {
      return NextResponse.json(
        { success: false, message: 'Dati mancanti' },
        { status: 400 }
      )
    }

    // Registra il paziente
    const result = await registraPaziente(fisioterapistaId, {
      nome,
      cognome,
      dataNascita,
      codiceFiscale,
      diagnosi: diagnosi || '',
      pianoTerapeutico: pianoTerapeutico || '',
      telefono,
      note,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        pazienteId: result.pazienteId,
        passwordGenerata: result.passwordGenerata,
      })
    }

    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 }
    )
  } catch (error) {
    console.error('Errore registrazione paziente:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
