import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Se l'utente è paziente, può vedere solo i propri dati
    // Se è fisioterapista, può vedere solo i pazienti a lui assegnati
    // Se è sviluppatore, può vedere qualsiasi paziente
    if (payload.ruolo === 'paziente') {
      // Verifica che stia richiedendo i propri dati
      const checkResult = await sql`
        SELECT p.id
        FROM pazienti p
        WHERE p.id = ${id} AND p.profilo_id = ${payload.userId}
      `

      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    } else if (payload.ruolo === 'fisioterapista') {
      // Verifica che il paziente appartenga al fisioterapista
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
        WHERE p.id = ${id} AND p.fisioterapista_id = ${fisioId}
      `

      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    }

    // Ottieni dati paziente completi
    const pazienteResult = await sql`
      SELECT
        p.id,
        p.profilo_id,
        prof.nome,
        prof.cognome,
        p.nome_paziente,
        p.cognome_paziente,
        p.codice_fiscale,
        p.data_nascita,
        p.telefono,
        p.diagnosi,
        p.piano_terapeutico,
        p.note,
        p.attivo,
        p.data_creazione
      FROM pazienti p
      JOIN profili prof ON p.profilo_id = prof.id
      WHERE p.id = ${id}
    `

    if (pazienteResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    const paziente = pazienteResult[0]

    // Ottieni sessioni recenti del paziente
    const sessioniResult = await sql`
      SELECT
        s.id,
        s.data_inizio,
        s.data_fine,
        s.durata_minuti,
        s.stato,
        s.punteggio_finale,
        s.note,
        s.tipo_esercizio
      FROM sessioni_riabilitazione s
      WHERE s.paziente_id = ${id}
      ORDER BY s.data_inizio DESC
      LIMIT 10
    `

    // Ottieni obiettivi terapeutici del paziente
    const obiettiviResult = await sql`
      SELECT
        o.id,
        o.titolo_obiettivo,
        o.descrizione,
        o.tipo_obiettivo,
        o.valore_target,
        o.unita_misura,
        o.data_scadenza,
        o.stato,
        o.note_progresso,
        o.data_creazione
      FROM obiettivi_terapeutici o
      WHERE o.paziente_id = ${id}
      ORDER BY
        CASE
          WHEN o.stato = 'attivo' THEN 1
          WHEN o.stato = 'raggiunto' THEN 2
          WHEN o.stato = 'sospeso' THEN 3
          ELSE 4
        END,
        o.data_scadenza ASC
    `

    return NextResponse.json({
      success: true,
      paziente: {
        id: paziente.id,
        profilo_id: paziente.profilo_id,
        profilo: {
          nome: paziente.nome,
          cognome: paziente.cognome
        },
        nome_paziente: paziente.nome_paziente,
        cognome_paziente: paziente.cognome_paziente,
        codice_fiscale: paziente.codice_fiscale,
        data_nascita: paziente.data_nascita,
        telefono: paziente.telefono,
        diagnosi: paziente.diagnosi,
        piano_terapeutico: paziente.piano_terapeutico,
        note: paziente.note,
        attivo: paziente.attivo,
        created_at: paziente.data_creazione,
        sessioni: sessioniResult.map(s => ({
          id: s.id,
          data_inizio: s.data_inizio,
          data_fine: s.data_fine,
          durata_minuti: s.durata_minuti,
          stato: s.stato,
          punteggio_finale: s.punteggio_finale,
          note: s.note,
          tipo_esercizio: s.tipo_esercizio
        })),
        obiettivi: obiettiviResult.map(o => ({
          id: o.id,
          titolo_obiettivo: o.titolo_obiettivo,
          descrizione: o.descrizione,
          tipo_obiettivo: o.tipo_obiettivo,
          valore_target: o.valore_target,
          unita_misura: o.unita_misura,
          data_scadenza: o.data_scadenza,
          stato: o.stato,
          note_progresso: o.note_progresso,
          data_creazione: o.data_creazione
        }))
      }
    })
  } catch (error) {
    console.error('Errore recupero paziente:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
