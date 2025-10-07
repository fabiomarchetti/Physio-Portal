import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * POST /api/categorie
 * Crea una nuova categoria esercizi
 */
export async function POST(request: NextRequest) {
  try {
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

    // Solo fisioterapisti possono creare categorie
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono creare categorie' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome_categoria, img_categoria } = body

    if (!nome_categoria || !nome_categoria.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nome categoria richiesto' },
        { status: 400 }
      )
    }

    // Inserisci nuova categoria
    const result = await sql`
      INSERT INTO categorie_esercizi (
        nome_categoria,
        img_categoria
      ) VALUES (
        ${nome_categoria.trim()},
        ${img_categoria || 'default_category.svg'}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: 'Categoria creata con successo',
      categoria: result[0]
    })

  } catch (error: any) {
    console.error('Errore creazione categoria:', error)

    // Gestisci errore di duplicato
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return NextResponse.json(
        { success: false, message: 'Una categoria con questo nome esiste già' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categorie?id=xxx
 * Elimina una categoria
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Solo fisioterapisti possono eliminare categorie
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono eliminare categorie' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID categoria richiesto' },
        { status: 400 }
      )
    }

    // Elimina la categoria
    await sql`
      DELETE FROM categorie_esercizi
      WHERE id_categoria = ${parseInt(id)}
    `

    return NextResponse.json({
      success: true,
      message: 'Categoria eliminata con successo'
    })

  } catch (error) {
    console.error('Errore eliminazione categoria:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
