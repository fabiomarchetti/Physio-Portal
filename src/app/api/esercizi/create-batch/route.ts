import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * POST /api/esercizi/create-batch
 * Crea multipli esercizi personalizzati e li assegna a un paziente
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

    // Solo fisioterapisti possono creare esercizi
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono creare esercizi' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { paziente_id, esercizi } = body

    if (!paziente_id || !esercizi || !Array.isArray(esercizi) || esercizi.length === 0) {
      return NextResponse.json(
        { success: false, message: 'paziente_id ed esercizi array richiesti' },
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
      WHERE p.id = ${paziente_id} AND p.fisioterapista_id = ${fisioId}
    `

    if (checkPaziente.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Paziente non trovato o non in carico' },
        { status: 404 }
      )
    }

    // Array per raccogliere i risultati
    const assegnazioniCreate = []

    // Per ogni esercizio
    for (const esercizio of esercizi) {
      const {
        id_categoria,
        nome_esercizio,
        descrizione_esercizio,
        istruzioni,
        data_inizio,
        data_fine,
        frequenza_settimanale,
        durata_minuti_consigliata,
        ripetizioni_per_sessione,
        note_fisioterapista,
        obiettivi_specifici
      } = esercizio

      // Validazione base
      if (!id_categoria || !nome_esercizio || !descrizione_esercizio) {
        continue // Salta esercizi incompleti
      }

      // Estrai i dati MediaPipe se presenti
      const parti_corpo = esercizio.parti_corpo_coinvolte || []
      const config_mediapipe = esercizio.configurazione_mediapipe
        ? JSON.stringify(esercizio.configurazione_mediapipe)
        : null

      // 1. Crea l'esercizio in tipi_esercizio (condiviso per altri fisioterapisti)
      const nuovoEsercizioResult = await sql`
        INSERT INTO tipi_esercizio (
          id_categoria,
          nome_esercizio,
          descrizione,
          istruzioni,
          difficolta,
          parti_corpo_coinvolte,
          configurazione_mediapipe,
          attivo,
          condiviso,
          creato_per_paziente_id,
          creato_da_fisioterapista_id
        ) VALUES (
          ${id_categoria},
          ${nome_esercizio},
          ${descrizione_esercizio},
          ${istruzioni || ''},
          'medio',
          ${parti_corpo},
          ${config_mediapipe},
          TRUE,
          TRUE,
          ${paziente_id},
          ${fisioId}
        )
        RETURNING id
      `

      const esercizioId = nuovoEsercizioResult[0].id

      // 2. Assegna l'esercizio al paziente in esercizi_pazienti
      const assegnazioneResult = await sql`
        INSERT INTO esercizi_pazienti (
          paziente_id,
          esercizio_id,
          fisioterapista_id,
          data_inizio,
          data_fine,
          frequenza_settimanale,
          durata_minuti_consigliata,
          ripetizioni_per_sessione,
          note_fisioterapista,
          obiettivi_specifici
        ) VALUES (
          ${paziente_id},
          ${esercizioId},
          ${fisioId},
          ${data_inizio || null},
          ${data_fine || null},
          ${frequenza_settimanale || null},
          ${durata_minuti_consigliata || null},
          ${ripetizioni_per_sessione || null},
          ${note_fisioterapista || null},
          ${obiettivi_specifici || null}
        )
        RETURNING *
      `

      assegnazioniCreate.push({
        esercizio_id: esercizioId,
        assegnazione_id: assegnazioneResult[0].id,
        nome_esercizio
      })
    }

    return NextResponse.json({
      success: true,
      message: `${assegnazioniCreate.length} esercizi creati e assegnati con successo`,
      assegnazioni: assegnazioniCreate
    })

  } catch (error: any) {
    console.error('Errore creazione batch esercizi:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server', error: error.message },
      { status: 500 }
    )
  }
}
