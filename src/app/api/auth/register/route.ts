import { NextRequest, NextResponse } from 'next/server'
import { registraFisioterapista, registraPaziente } from '@/lib/neon/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo } = body

    if (tipo === 'fisioterapista') {
      const result = await registraFisioterapista({
        nome: body.nome,
        cognome: body.cognome,
        email: body.email,
        password: body.password,
        numeroAlbo: body.numeroAlbo,
        specializzazione: body.specializzazione,
        nomeClinica: body.nomeClinica,
        indirizzoClinica: body.indirizzoClinica,
        telefono: body.telefono,
        emailClinica: body.emailClinica,
      })

      if (result.success && result.token) {
        // Salva token in cookie
        const cookieStore = await cookies()
        cookieStore.set('auth_token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })

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
    } else if (tipo === 'paziente') {
      // Registrazione paziente richiede fisioterapista_id
      const { fisioterapistaId } = body

      if (!fisioterapistaId) {
        return NextResponse.json(
          { success: false, message: 'ID fisioterapista richiesto' },
          { status: 400 }
        )
      }

      const result = await registraPaziente(fisioterapistaId, {
        nome: body.nome,
        cognome: body.cognome,
        dataNascita: body.dataNascita,
        codiceFiscale: body.codiceFiscale,
        diagnosi: body.diagnosi,
        pianoTerapeutico: body.pianoTerapeutico,
        telefono: body.telefono,
        note: body.note,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, message: 'Tipo di registrazione non valido' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Errore API register:', error)
    return NextResponse.json(
      { success: false, message: 'Errore durante la registrazione' },
      { status: 500 }
    )
  }
}
