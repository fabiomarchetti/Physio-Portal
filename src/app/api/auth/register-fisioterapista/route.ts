import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { registraFisioterapista } from '@/lib/neon/auth'
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

    // Solo sviluppatori possono registrare fisioterapisti
    if (payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      nome,
      cognome,
      email,
      password,
      numeroAlbo,
      specializzazione,
      nomeClinica,
      indirizzoClinica,
      telefono,
      emailClinica,
    } = body

    // Validazione dati
    if (!nome || !cognome || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nome, cognome, email e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Registra il fisioterapista
    const result = await registraFisioterapista({
      nome,
      cognome,
      email,
      password,
      numeroAlbo: numeroAlbo || '',
      specializzazione: specializzazione || '',
      nomeClinica: nomeClinica || '',
      indirizzoClinica: indirizzoClinica || '',
      telefono,
      emailClinica,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        user: result.user,
      })
    }

    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 }
    )
  } catch (error) {
    console.error('Errore registrazione fisioterapista:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
