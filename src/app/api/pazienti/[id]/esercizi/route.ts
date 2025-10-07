import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * GET /api/pazienti/[id]/esercizi
 * Ottiene gli esercizi assegnati a un paziente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: pazienteId } = await params

    // Verifica permessi
    if (payload.ruolo === 'paziente') {
      // Il paziente può vedere solo i propri esercizi
      const checkResult = await sql`
        SELECT p.id
        FROM pazienti p
        WHERE p.id = ${pazienteId} AND p.profilo_id = ${payload.userId}
      `
      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    } else if (payload.ruolo === 'fisioterapista') {
      // Il fisioterapista può vedere solo i pazienti a lui assegnati
      const fisioResult = await sql`
        SELECT f.id
        FROM fisioterapisti f
        WHERE f.profilo_id = ${payload.userId}
      `
      if (fisioResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Fisioterapista non trovato' },
          { status: 404 }
        )
      }

      const fisioId = fisioResult[0].id
      const checkResult = await sql`
        SELECT p.id
        FROM pazienti p
        WHERE p.id = ${pazienteId} AND p.fisioterapista_id = ${fisioId}
      `
      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    }

    // Ottieni esercizi assegnati (solo attivi per default)
    const { searchParams } = new URL(request.url)
    const includiCompletati = searchParams.get('completati') === 'true'

    let eserciziQuery
    if (includiCompletati) {
      eserciziQuery = sql`
        SELECT
          ep.id,
          ep.paziente_id,
          ep.esercizio_id,
          ep.fisioterapista_id,
          ep.data_assegnazione,
          ep.data_inizio,
          ep.data_fine,
          ep.frequenza_settimanale,
          ep.durata_minuti_consigliata,
          ep.note_fisioterapista,
          ep.obiettivi_specifici,
          ep.attivo,
          ep.completato,
          ep.data_completamento,
          ep.numero_sessioni_completate,
          ep.ultima_sessione,
          ep.data_creazione,
          te.nome_esercizio,
          te.descrizione,
          te.istruzioni,
          te.difficolta,
          te.parti_corpo_coinvolte,
          te.configurazione_mediapipe,
          te.id_categoria
        FROM esercizi_pazienti ep
        JOIN tipi_esercizio te ON ep.esercizio_id = te.id
        WHERE ep.paziente_id = ${pazienteId}
        ORDER BY ep.data_assegnazione DESC
      `
    } else {
      eserciziQuery = sql`
        SELECT
          ep.id,
          ep.paziente_id,
          ep.esercizio_id,
          ep.fisioterapista_id,
          ep.data_assegnazione,
          ep.data_inizio,
          ep.data_fine,
          ep.frequenza_settimanale,
          ep.durata_minuti_consigliata,
          ep.note_fisioterapista,
          ep.obiettivi_specifici,
          ep.attivo,
          ep.completato,
          ep.data_completamento,
          ep.numero_sessioni_completate,
          ep.ultima_sessione,
          ep.data_creazione,
          te.nome_esercizio,
          te.descrizione,
          te.istruzioni,
          te.difficolta,
          te.parti_corpo_coinvolte,
          te.configurazione_mediapipe,
          te.id_categoria
        FROM esercizi_pazienti ep
        JOIN tipi_esercizio te ON ep.esercizio_id = te.id
        WHERE ep.paziente_id = ${pazienteId} AND ep.attivo = TRUE
        ORDER BY ep.data_assegnazione DESC
      `
    }

    const esercizi = await eserciziQuery

    return NextResponse.json({
      success: true,
      esercizi: esercizi.map(e => ({
        id: e.id,
        paziente_id: e.paziente_id,
        esercizio_id: e.esercizio_id,
        fisioterapista_id: e.fisioterapista_id,
        data_assegnazione: e.data_assegnazione,
        data_inizio: e.data_inizio,
        data_fine: e.data_fine,
        frequenza_settimanale: e.frequenza_settimanale,
        durata_minuti_consigliata: e.durata_minuti_consigliata,
        note_fisioterapista: e.note_fisioterapista,
        obiettivi_specifici: e.obiettivi_specifici,
        attivo: e.attivo,
        completato: e.completato,
        data_completamento: e.data_completamento,
        numero_sessioni_completate: e.numero_sessioni_completate,
        ultima_sessione: e.ultima_sessione,
        esercizio: {
          nome_esercizio: e.nome_esercizio,
          descrizione: e.descrizione,
          istruzioni: e.istruzioni,
          difficolta: e.difficolta,
          parti_corpo_coinvolte: e.parti_corpo_coinvolte,
          configurazione_mediapipe: e.configurazione_mediapipe,
          id_categoria: e.id_categoria
        }
      }))
    })

  } catch (error) {
    console.error('Errore recupero esercizi paziente:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pazienti/[id]/esercizi
 * Assegna un esercizio a un paziente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Solo fisioterapisti possono assegnare esercizi
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono assegnare esercizi' },
        { status: 403 }
      )
    }

    const { id: pazienteId } = await params
    const body = await request.json()

    // Validazione input
    const {
      esercizio_id,
      data_inizio,
      data_fine,
      frequenza_settimanale,
      durata_minuti_consigliata,
      note_fisioterapista,
      obiettivi_specifici
    } = body

    if (!esercizio_id) {
      return NextResponse.json(
        { success: false, message: 'esercizio_id richiesto' },
        { status: 400 }
      )
    }

    // Ottieni fisioterapista_id
    const fisioResult = await sql`
      SELECT f.id
      FROM fisioterapisti f
      WHERE f.profilo_id = ${payload.userId}
    `

    if (fisioResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fisioterapista non trovato' },
        { status: 404 }
      )
    }

    const fisioId = fisioResult[0].id

    // Verifica che il paziente appartenga al fisioterapista
    const checkPaziente = await sql`
      SELECT p.id
      FROM pazienti p
      WHERE p.id = ${pazienteId} AND p.fisioterapista_id = ${fisioId}
    `

    if (checkPaziente.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Paziente non trovato o non in carico' },
        { status: 404 }
      )
    }

    // Verifica se l'esercizio esiste
    const checkEsercizio = await sql`
      SELECT id FROM tipi_esercizio WHERE id = ${esercizio_id}
    `

    if (checkEsercizio.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Esercizio non trovato' },
        { status: 404 }
      )
    }

    // Inserisci assegnazione
    const result = await sql`
      INSERT INTO esercizi_pazienti (
        paziente_id,
        esercizio_id,
        fisioterapista_id,
        data_inizio,
        data_fine,
        frequenza_settimanale,
        durata_minuti_consigliata,
        note_fisioterapista,
        obiettivi_specifici
      ) VALUES (
        ${pazienteId},
        ${esercizio_id},
        ${fisioId},
        ${data_inizio || null},
        ${data_fine || null},
        ${frequenza_settimanale || null},
        ${durata_minuti_consigliata || null},
        ${note_fisioterapista || null},
        ${obiettivi_specifici || null}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: 'Esercizio assegnato con successo',
      assegnazione: result[0]
    })

  } catch (error: any) {
    console.error('Errore assegnazione esercizio:', error)

    // Gestisci errore di duplicato
    if (error.message?.includes('idx_esercizi_pazienti_unici')) {
      return NextResponse.json(
        { success: false, message: 'Questo esercizio è già assegnato al paziente' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
