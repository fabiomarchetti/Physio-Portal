import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function GET(
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

    // Carica l'esercizio con la categoria
    const result = await sql`
      SELECT
        te.*,
        ce.id_categoria as categoria_id,
        ce.nome_categoria as categoria_nome
      FROM tipi_esercizio te
      LEFT JOIN categorie_esercizi ce ON te.id_categoria = ce.id_categoria
      WHERE te.id = ${exerciseId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Esercizio non trovato' }, { status: 404 })
    }

    const exercise = result[0]

    // Formatta la risposta per compatibilità
    const formattedExercise = {
      ...exercise,
      categoria: {
        id: exercise.categoria_id,
        nome_categoria: exercise.categoria_nome
      }
    }

    return NextResponse.json(formattedExercise)

  } catch (error) {
    console.error('Errore API esercizio:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
