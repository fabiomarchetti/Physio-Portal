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

    // Se l'utente è fisioterapista, può vedere solo i propri dati
    // Se è sviluppatore, può vedere qualsiasi fisioterapista
    if (payload.ruolo === 'fisioterapista') {
      // Verifica che stia richiedendo i propri dati
      const checkResult = await sql`
        SELECT f.id
        FROM fisioterapisti f
        WHERE f.id = ${id} AND f.profilo_id = ${payload.userId}
      `

      if (checkResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Accesso negato' },
          { status: 403 }
        )
      }
    }

    // Ottieni dati fisioterapista completi
    const fisioResult = await sql`
      SELECT
        f.id,
        f.profilo_id,
        p.nome,
        p.cognome,
        p.email,
        f.numero_albo,
        f.specializzazione,
        f.nome_clinica,
        f.indirizzo_clinica,
        f.telefono,
        f.email_clinica
      FROM fisioterapisti f
      JOIN profili p ON f.profilo_id = p.id
      WHERE f.id = ${id}
    `

    if (fisioResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fisioterapista non trovato' },
        { status: 404 }
      )
    }

    const fisioterapista = fisioResult[0]

    // Ottieni pazienti del fisioterapista
    const pazientiResult = await sql`
      SELECT
        paz.id,
        paz.profilo_id,
        prof.nome,
        prof.cognome,
        paz.nome_paziente,
        paz.cognome_paziente,
        paz.codice_fiscale,
        paz.data_nascita,
        paz.telefono,
        paz.diagnosi,
        paz.piano_terapeutico,
        paz.note,
        paz.attivo,
        paz.data_creazione as created_at
      FROM pazienti paz
      JOIN profili prof ON paz.profilo_id = prof.id
      WHERE paz.fisioterapista_id = ${id}
      ORDER BY paz.data_creazione DESC
    `

    return NextResponse.json({
      success: true,
      fisioterapista: {
        id: fisioterapista.id,
        profilo_id: fisioterapista.profilo_id,
        nome: fisioterapista.nome,
        cognome: fisioterapista.cognome,
        email: fisioterapista.email,
        numero_albo: fisioterapista.numero_albo,
        specializzazione: fisioterapista.specializzazione,
        nome_clinica: fisioterapista.nome_clinica,
        indirizzo_clinica: fisioterapista.indirizzo_clinica,
        telefono: fisioterapista.telefono,
        email_clinica: fisioterapista.email_clinica,
        pazienti: pazientiResult.map(p => ({
          id: p.id,
          profilo_id: p.profilo_id,
          profilo: {
            nome: p.nome,
            cognome: p.cognome
          },
          nome_paziente: p.nome_paziente,
          cognome_paziente: p.cognome_paziente,
          codice_fiscale: p.codice_fiscale,
          data_nascita: p.data_nascita,
          telefono: p.telefono,
          diagnosi: p.diagnosi,
          piano_terapeutico: p.piano_terapeutico,
          note: p.note,
          attivo: p.attivo,
          created_at: p.created_at
        }))
      }
    })
  } catch (error) {
    console.error('Errore recupero fisioterapista:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Solo sviluppatori possono eliminare fisioterapisti
    if (payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Ottieni profilo_id del fisioterapista
    const fisioResult = await sql`
      SELECT profilo_id FROM fisioterapisti WHERE id = ${id}
    `

    if (fisioResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fisioterapista non trovato' },
        { status: 404 }
      )
    }

    const profiloId = fisioResult[0].profilo_id

    // Elimina il profilo (CASCADE eliminerà anche fisioterapisti e pazienti collegati)
    await sql`
      DELETE FROM profili WHERE id = ${profiloId}
    `

    return NextResponse.json({
      success: true,
      message: 'Fisioterapista eliminato con successo',
    })
  } catch (error) {
    console.error('Errore eliminazione fisioterapista:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Solo sviluppatori possono modificare fisioterapisti
    if (payload.ruolo !== 'sviluppatore') {
      return NextResponse.json(
        { success: false, message: 'Accesso negato' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      nome,
      cognome,
      email,
      numeroAlbo,
      specializzazione,
      nomeClinica,
      indirizzoClinica,
      telefono,
      emailClinica,
    } = body

    // Validazione dati
    if (!nome || !cognome || !email) {
      return NextResponse.json(
        { success: false, message: 'Nome, cognome ed email sono obbligatori' },
        { status: 400 }
      )
    }

    // Ottieni profilo_id del fisioterapista
    const fisioResult = await sql`
      SELECT profilo_id FROM fisioterapisti WHERE id = ${id}
    `

    if (fisioResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fisioterapista non trovato' },
        { status: 404 }
      )
    }

    const profiloId = fisioResult[0].profilo_id

    // Aggiorna profilo (nome, cognome, email)
    await sql`
      UPDATE profili
      SET
        nome = ${nome},
        cognome = ${cognome},
        email = ${email},
        data_aggiornamento = NOW()
      WHERE id = ${profiloId}
    `

    // Aggiorna dati fisioterapista
    await sql`
      UPDATE fisioterapisti
      SET
        numero_albo = ${numeroAlbo || ''},
        specializzazione = ${specializzazione || ''},
        nome_clinica = ${nomeClinica || ''},
        indirizzo_clinica = ${indirizzoClinica || ''},
        telefono = ${telefono || null},
        email_clinica = ${emailClinica || null}
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Fisioterapista aggiornato con successo',
    })
  } catch (error) {
    console.error('Errore aggiornamento fisioterapista:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
