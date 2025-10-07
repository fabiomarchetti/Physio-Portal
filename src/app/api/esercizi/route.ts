import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * GET /api/esercizi
 * Ottiene tutte le categorie e gli esercizi
 */
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

    // Solo fisioterapisti e sviluppatori possono vedere esercizi
    if (payload.ruolo !== 'fisioterapista' && payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    // Ottieni categorie
    const categorieResult = await sql`
      SELECT
        id_categoria,
        nome_categoria,
        img_categoria,
        data_creazione,
        data_aggiornamento
      FROM categorie_esercizi
      ORDER BY nome_categoria ASC
    `

    // Mappa id_categoria a id per compatibilità frontend
    const categorie = categorieResult.map(cat => ({
      id: cat.id_categoria,
      nome_categoria: cat.nome_categoria,
      img_categoria: cat.img_categoria,
      data_creazione: cat.data_creazione,
      data_aggiornamento: cat.data_aggiornamento
    }))

    // Ottieni esercizi
    const eserciziResult = await sql`
      SELECT
        te.id,
        te.id_categoria,
        te.nome_esercizio,
        te.descrizione,
        te.istruzioni,
        te.difficolta,
        te.parti_corpo_coinvolte,
        te.configurazione_mediapipe,
        te.attivo,
        te.data_creazione
      FROM tipi_esercizio te
      WHERE te.attivo = TRUE
      ORDER BY te.nome_esercizio ASC
    `

    return NextResponse.json({
      success: true,
      categorie: categorie,
      esercizi: eserciziResult
    })
  } catch (error) {
    console.error('Errore recupero esercizi:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/esercizi
 * Crea un nuovo esercizio nella tabella tipi_esercizio
 */
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

    // Solo fisioterapisti e sviluppatori possono creare esercizi
    if (payload.ruolo !== 'fisioterapista' && payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validazione input
    const {
      id_categoria,
      nome_esercizio,
      descrizione,
      istruzioni,
      durata_consigliata_minuti,
      difficolta,
      parti_corpo_coinvolte,
      configurazione_mediapipe
    } = body

    if (!id_categoria || !nome_esercizio || !descrizione) {
      return NextResponse.json(
        { success: false, message: 'Categoria, nome e descrizione sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che la categoria esista
    const categoriaCheck = await sql`
      SELECT id_categoria
      FROM categorie_esercizi
      WHERE id_categoria = ${id_categoria}
    `

    if (categoriaCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Categoria non trovata' },
        { status: 404 }
      )
    }

    // Inserisci esercizio
    const result = await sql`
      INSERT INTO tipi_esercizio (
        id_categoria,
        nome_esercizio,
        descrizione,
        istruzioni,
        durata_consigliata_minuti,
        difficolta,
        parti_corpo_coinvolte,
        configurazione_mediapipe,
        attivo
      ) VALUES (
        ${id_categoria},
        ${nome_esercizio},
        ${descrizione},
        ${istruzioni || ''},
        ${durata_consigliata_minuti || null},
        ${difficolta || 'medio'},
        ${JSON.stringify(parti_corpo_coinvolte || [])},
        ${configurazione_mediapipe ? JSON.stringify(configurazione_mediapipe) : null},
        TRUE
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: 'Esercizio creato con successo',
      esercizio: result[0]
    })

  } catch (error) {
    console.error('Errore creazione esercizio:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
