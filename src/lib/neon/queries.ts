import { sql } from './client'

export class DatabaseQueries {
  // =====================================================
  // QUERY PER FISIOTERAPISTI
  // =====================================================

  static async getPazientiDelFisioterapista(fisioterapistaId: string) {
    try {
      const data = await sql`
        SELECT
          p.*,
          prof.nome,
          prof.cognome,
          prof.email,
          prof.ruolo
        FROM pazienti p
        INNER JOIN profili prof ON prof.id = p.profilo_id
        WHERE p.fisioterapista_id = ${fisioterapistaId}::uuid
          AND p.attivo = true
        ORDER BY p.cognome_paziente, p.nome_paziente
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getPazientiDelFisioterapista:', error)
      return { data: null, error }
    }
  }

  static async getPazienteById(pazienteId: string) {
    try {
      const data = await sql`
        SELECT
          p.*,
          prof.nome,
          prof.cognome,
          prof.email,
          prof.ruolo
        FROM pazienti p
        INNER JOIN profili prof ON prof.id = p.profilo_id
        WHERE p.id = ${pazienteId}::uuid
      `
      return { data: data[0] || null, error: null }
    } catch (error) {
      console.error('Errore getPazienteById:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // QUERY PER PAZIENTI
  // =====================================================

  static async getSessioniDelPaziente(pazienteId: string) {
    try {
      const data = await sql`
        SELECT
          s.*,
          COUNT(m.id) as num_metriche
        FROM sessioni_riabilitazione s
        LEFT JOIN metriche_sessione m ON m.sessione_id = s.id
        WHERE s.paziente_id = ${pazienteId}::uuid
        GROUP BY s.id
        ORDER BY s.data_inizio DESC
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getSessioniDelPaziente:', error)
      return { data: null, error }
    }
  }

  static async getStatistichePaziente(pazienteId: string) {
    try {
      const data = await sql`
        SELECT * FROM get_statistiche_paziente(${pazienteId}::uuid)
      `
      return { data: data[0] || null, error: null }
    } catch (error) {
      console.error('Errore getStatistichePaziente:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // QUERY PER SESSIONI
  // =====================================================

  static async creaSessione(
    pazienteId: string,
    tipoEsercizio: string,
    obiettivi?: string,
    note?: string
  ) {
    try {
      const data = await sql`
        INSERT INTO sessioni_riabilitazione (
          paziente_id,
          tipo_esercizio,
          obiettivi,
          note,
          stato
        ) VALUES (
          ${pazienteId}::uuid,
          ${tipoEsercizio},
          ${obiettivi || null},
          ${note || ''},
          'attiva'
        )
        RETURNING *
      `
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Errore creaSessione:', error)
      return { data: null, error }
    }
  }

  static async completaSessione(
    sessioneId: string,
    punteggioFinale?: number
  ) {
    try {
      const data = await sql`
        UPDATE sessioni_riabilitazione
        SET
          data_fine = NOW(),
          stato = 'completata',
          punteggio_finale = ${punteggioFinale || null}
        WHERE id = ${sessioneId}::uuid
        RETURNING *
      `
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Errore completaSessione:', error)
      return { data: null, error }
    }
  }

  static async getDatiMovimentoSessione(sessioneId: string) {
    try {
      const data = await sql`
        SELECT *
        FROM dati_movimento
        WHERE sessione_id = ${sessioneId}::uuid
        ORDER BY timestamp_rilevamento
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getDatiMovimentoSessione:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // QUERY PER METRICHE
  // =====================================================

  static async getMetrichePerTipo(sessioneId: string, tipoMetrica: string) {
    try {
      const data = await sql`
        SELECT * FROM get_metriche_per_tipo(
          ${sessioneId}::uuid,
          ${tipoMetrica}
        )
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getMetrichePerTipo:', error)
      return { data: null, error }
    }
  }

  static async getMetricheSessione(sessioneId: string) {
    try {
      const data = await sql`
        SELECT *
        FROM metriche_sessione
        WHERE sessione_id = ${sessioneId}::uuid
        ORDER BY timestamp_calcolo
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getMetricheSessione:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // SALVA DATI MOVIMENTO
  // =====================================================

  static async salvaDatiMovimento(
    sessioneId: string,
    puntiCorpo: Record<string, unknown>,
    puntiMani: Record<string, unknown>,
    puntiPose: Record<string, unknown>,
    frameNumero: number,
    confidenza: number
  ) {
    try {
      const data = await sql`
        INSERT INTO dati_movimento (
          sessione_id,
          timestamp_rilevamento,
          punti_corpo,
          punti_mani,
          punti_pose,
          frame_numero,
          confidenza_rilevamento
        ) VALUES (
          ${sessioneId}::uuid,
          NOW(),
          ${JSON.stringify(puntiCorpo)}::jsonb,
          ${JSON.stringify(puntiMani)}::jsonb,
          ${JSON.stringify(puntiPose)}::jsonb,
          ${frameNumero},
          ${confidenza}
        )
        RETURNING *
      `
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Errore salvaDatiMovimento:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // SALVA METRICHE
  // =====================================================

  static async salvaMetrica(
    sessioneId: string,
    tipoMetrica: string,
    valore: number,
    unitaMisura: string,
    articolazione?: string
  ) {
    try {
      const data = await sql`
        INSERT INTO metriche_sessione (
          sessione_id,
          tipo_metrica,
          valore_metrica,
          unita_misura,
          articolazione,
          timestamp_calcolo
        ) VALUES (
          ${sessioneId}::uuid,
          ${tipoMetrica},
          ${valore},
          ${unitaMisura},
          ${articolazione || null},
          NOW()
        )
        RETURNING *
      `
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Errore salvaMetrica:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // QUERY PER ESERCIZI
  // =====================================================

  static async getTipiEsercizio(attivo: boolean = true) {
    try {
      const data = await sql`
        SELECT *
        FROM tipi_esercizio
        WHERE attivo = ${attivo}
        ORDER BY nome_esercizio
      `
      return { data, error: null }
    } catch (error) {
      console.error('Errore getTipiEsercizio:', error)
      return { data: null, error }
    }
  }

  static async getEsercizioById(esercizioId: string) {
    try {
      const data = await sql`
        SELECT *
        FROM tipi_esercizio
        WHERE id = ${esercizioId}::uuid
      `
      return { data: data[0] || null, error: null }
    } catch (error) {
      console.error('Errore getEsercizioById:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // QUERY PER OBIETTIVI TERAPEUTICI
  // =====================================================

  static async getObiettiviPaziente(pazienteId: string, stato?: string) {
    try {
      const query = stato
        ? sql`
            SELECT *
            FROM obiettivi_terapeutici
            WHERE paziente_id = ${pazienteId}::uuid
              AND stato = ${stato}
            ORDER BY data_creazione DESC
          `
        : sql`
            SELECT *
            FROM obiettivi_terapeutici
            WHERE paziente_id = ${pazienteId}::uuid
            ORDER BY data_creazione DESC
          `

      const data = await query
      return { data, error: null }
    } catch (error) {
      console.error('Errore getObiettiviPaziente:', error)
      return { data: null, error }
    }
  }

  static async creaObiettivo(
    pazienteId: string,
    titoloObiettivo: string,
    descrizione: string,
    tipoObiettivo: string,
    valoreTarget?: number,
    unitaMisura?: string,
    dataScadenza?: string
  ) {
    try {
      const data = await sql`
        INSERT INTO obiettivi_terapeutici (
          paziente_id,
          titolo_obiettivo,
          descrizione,
          tipo_obiettivo,
          valore_target,
          unita_misura,
          data_scadenza,
          stato
        ) VALUES (
          ${pazienteId}::uuid,
          ${titoloObiettivo},
          ${descrizione},
          ${tipoObiettivo},
          ${valoreTarget || null},
          ${unitaMisura || null},
          ${dataScadenza || null},
          'attivo'
        )
        RETURNING *
      `
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Errore creaObiettivo:', error)
      return { data: null, error }
    }
  }

  // =====================================================
  // VERIFICA ACCESSI
  // =====================================================

  static async verificaAccessoPaziente(
    fisioterapistaId: string,
    pazienteId: string
  ): Promise<boolean> {
    try {
      const result = await sql`
        SELECT fisioterapista_ha_accesso_paziente(
          ${fisioterapistaId}::uuid,
          ${pazienteId}::uuid
        ) as ha_accesso
      `
      return result[0]?.ha_accesso || false
    } catch (error) {
      console.error('Errore verificaAccessoPaziente:', error)
      return false
    }
  }
}
