import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * PATCH /api/esercizi-pazienti/[id]
 * Aggiorna un'assegnazione esercizio (attiva/disattiva, completa)
 */
export async function PATCH(
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

    // Solo fisioterapisti possono modificare assegnazioni
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono modificare le assegnazioni' },
        { status: 403 }
      )
    }

    const { id: assegnazioneId } = await params
    const body = await request.json()

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

    // Verifica che l'assegnazione appartenga al fisioterapista
    const checkAssegnazione = await sql`
      SELECT ep.id, ep.paziente_id
      FROM esercizi_pazienti ep
      WHERE ep.id = ${assegnazioneId} AND ep.fisioterapista_id = ${fisioId}
    `

    if (checkAssegnazione.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Assegnazione non trovata' },
        { status: 404 }
      )
    }

    // Costruisci l'update dinamicamente
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (typeof body.attivo === 'boolean') {
      updates.push(`attivo = $${paramIndex++}`)
      values.push(body.attivo)
    }

    if (typeof body.completato === 'boolean') {
      updates.push(`completato = $${paramIndex++}`)
      values.push(body.completato)

      if (body.completato) {
        updates.push(`data_completamento = NOW()`)
      } else {
        updates.push(`data_completamento = NULL`)
      }
    }

    if (body.note_fisioterapista !== undefined) {
      updates.push(`note_fisioterapista = $${paramIndex++}`)
      values.push(body.note_fisioterapista)
    }

    if (body.obiettivi_specifici !== undefined) {
      updates.push(`obiettivi_specifici = $${paramIndex++}`)
      values.push(body.obiettivi_specifici)
    }

    if (body.frequenza_settimanale !== undefined) {
      updates.push(`frequenza_settimanale = $${paramIndex++}`)
      values.push(body.frequenza_settimanale)
    }

    if (body.durata_minuti_consigliata !== undefined) {
      updates.push(`durata_minuti_consigliata = $${paramIndex++}`)
      values.push(body.durata_minuti_consigliata)
    }

    if (body.data_inizio !== undefined) {
      updates.push(`data_inizio = $${paramIndex++}`)
      values.push(body.data_inizio)
    }

    if (body.data_fine !== undefined) {
      updates.push(`data_fine = $${paramIndex++}`)
      values.push(body.data_fine)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nessun campo da aggiornare' },
        { status: 400 }
      )
    }

    // Aggiungi sempre l'aggiornamento del timestamp
    updates.push('data_aggiornamento = NOW()')

    // Costruisci la query
    const updateQuery = `
      UPDATE esercizi_pazienti
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(assegnazioneId)

    // Esegui l'update usando sql.query
    const result = await sql(updateQuery, values)

    return NextResponse.json({
      success: true,
      message: 'Assegnazione aggiornata con successo',
      assegnazione: result[0]
    })

  } catch (error) {
    console.error('Errore aggiornamento assegnazione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/esercizi-pazienti/[id]
 * Elimina un'assegnazione esercizio
 */
export async function DELETE(
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

    // Solo fisioterapisti possono eliminare assegnazioni
    if (payload.ruolo !== 'fisioterapista') {
      return NextResponse.json(
        { success: false, message: 'Solo i fisioterapisti possono eliminare le assegnazioni' },
        { status: 403 }
      )
    }

    const { id: assegnazioneId } = await params

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

    // Verifica che l'assegnazione appartenga al fisioterapista
    const checkAssegnazione = await sql`
      SELECT ep.id
      FROM esercizi_pazienti ep
      WHERE ep.id = ${assegnazioneId} AND ep.fisioterapista_id = ${fisioId}
    `

    if (checkAssegnazione.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Assegnazione non trovata' },
        { status: 404 }
      )
    }

    // Elimina l'assegnazione
    await sql`
      DELETE FROM esercizi_pazienti
      WHERE id = ${assegnazioneId}
    `

    return NextResponse.json({
      success: true,
      message: 'Assegnazione eliminata con successo'
    })

  } catch (error) {
    console.error('Errore eliminazione assegnazione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
