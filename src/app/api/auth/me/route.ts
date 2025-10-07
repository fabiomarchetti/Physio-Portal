import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, getProfiloCompleto } from '@/lib/neon/auth'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    console.log('🍪 Cookies disponibili:', cookieStore.getAll().map(c => c.name))
    console.log('🔑 Token auth-token:', token ? 'Presente' : 'Assente')

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

    // Ottieni profilo completo dal database
    const profilo = await getProfiloCompleto(payload.userId)

    if (!profilo) {
      return NextResponse.json(
        { success: false, message: 'Profilo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profilo.id,
        nome: profilo.nome,
        cognome: profilo.cognome,
        email: profilo.email,
        ruolo: profilo.ruolo,
        datiSpecifici: profilo.dati_specifici,
      },
    })
  } catch (error) {
    console.error('Errore API me:', error)
    return NextResponse.json(
      { success: false, message: 'Errore durante il recupero del profilo' },
      { status: 500 }
    )
  }
}
