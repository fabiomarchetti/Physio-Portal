import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')

    return NextResponse.json({
      success: true,
      message: 'Logout effettuato con successo',
    })
  } catch (error) {
    console.error('Errore API logout:', error)
    return NextResponse.json(
      { success: false, message: 'Errore durante il logout' },
      { status: 500 }
    )
  }
}
