import { NextRequest, NextResponse } from 'next/server'
import { loginSviluppatore, loginFisioterapista, loginPaziente } from '@/lib/neon/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, codiceFiscale, password, tipo } = body

    let result

    if (tipo === 'sviluppatore' && email) {
      result = await loginSviluppatore(email, password)
    } else if (tipo === 'fisioterapista' && email) {
      result = await loginFisioterapista(email, password)
    } else if (tipo === 'paziente' && codiceFiscale) {
      result = await loginPaziente(codiceFiscale, password)
    } else {
      return NextResponse.json(
        { success: false, message: 'Parametri di login non validi' },
        { status: 400 }
      )
    }

    if (result.success && result.token) {
      // Salva token in cookie HTTP-only
      const cookieStore = await cookies()

      console.log('🔐 Login: Impostazione cookie auth-token')
      console.log('📍 NODE_ENV:', process.env.NODE_ENV)
      console.log('🔒 Secure:', process.env.NODE_ENV === 'production')

      cookieStore.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 giorni
        path: '/',
      })

      console.log('✅ Cookie impostato, cookies attuali:', cookieStore.getAll().map(c => c.name))

      return NextResponse.json({
        success: true,
        message: result.message,
        user: result.user,
      })
    }

    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 }
    )
  } catch (error) {
    console.error('Errore API login:', error)
    return NextResponse.json(
      { success: false, message: 'Errore durante il login' },
      { status: 500 }
    )
  }
}
