export interface Database {
  public: {
    Tables: {
      profili: {
        Row: {
          id: string
          ruolo: 'fisioterapista' | 'paziente'
          nome: string
          cognome: string
          data_creazione: string
          data_aggiornamento: string
        }
        Insert: {
          id: string
          ruolo: 'fisioterapista' | 'paziente'
          nome: string
          cognome: string
          data_creazione?: string
          data_aggiornamento?: string
        }
        Update: {
          id?: string
          ruolo?: 'fisioterapista' | 'paziente'
          nome?: string
          cognome?: string
          data_creazione?: string
          data_aggiornamento?: string
        }
      }
      fisioterapisti: {
        Row: {
          id: string
          profilo_id: string
          numero_albo: string
          specializzazione: string
          nome_clinica: string
          indirizzo_clinica: string
          telefono: string | null
          email_clinica: string | null
          data_creazione: string
        }
        Insert: {
          id?: string
          profilo_id: string
          numero_albo: string
          specializzazione: string
          nome_clinica: string
          indirizzo_clinica: string
          telefono?: string | null
          email_clinica?: string | null
          data_creazione?: string
        }
        Update: {
          id?: string
          profilo_id?: string
          numero_albo?: string
          specializzazione?: string
          nome_clinica?: string
          indirizzo_clinica?: string
          telefono?: string | null
          email_clinica?: string | null
          data_creazione?: string
        }
      }
      pazienti: {
        Row: {
          id: string
          profilo_id: string
          fisioterapista_id: string
          data_nascita: string
          codice_fiscale: string | null
          telefono: string | null
          diagnosi: string
          piano_terapeutico: string
          note: string | null
          attivo: boolean
          data_creazione: string
        }
        Insert: {
          id?: string
          profilo_id: string
          fisioterapista_id: string
          data_nascita: string
          codice_fiscale?: string | null
          telefono?: string | null
          diagnosi: string
          piano_terapeutico: string
          note?: string | null
          attivo?: boolean
          data_creazione?: string
        }
        Update: {
          id?: string
          profilo_id?: string
          fisioterapista_id?: string
          data_nascita?: string
          codice_fiscale?: string | null
          telefono?: string | null
          diagnosi?: string
          piano_terapeutico?: string
          note?: string | null
          attivo?: boolean
          data_creazione?: string
        }
      }
      sessioni_riabilitazione: {
        Row: {
          id: string
          paziente_id: string
          data_inizio: string
          data_fine: string | null
          durata_minuti: number | null
          tipo_esercizio: string
          obiettivi: string | null
          note: string
          stato: 'attiva' | 'completata' | 'annullata'
          punteggio_finale: number | null
          data_creazione: string
        }
        Insert: {
          id?: string
          paziente_id: string
          data_inizio: string
          data_fine?: string | null
          durata_minuti?: number | null
          tipo_esercizio: string
          obiettivi?: string | null
          note?: string
          stato?: 'attiva' | 'completata' | 'annullata'
          punteggio_finale?: number | null
          data_creazione?: string
        }
        Update: {
          id?: string
          paziente_id?: string
          data_inizio?: string
          data_fine?: string | null
          durata_minuti?: number | null
          tipo_esercizio?: string
          obiettivi?: string | null
          note?: string
          stato?: 'attiva' | 'completata' | 'annullata'
          punteggio_finale?: number | null
          data_creazione?: string
        }
      }
      dati_movimento: {
        Row: {
          id: string
          sessione_id: string
          timestamp_rilevamento: string
          punti_corpo: Record<string, unknown>
          punti_mani: Record<string, unknown>
          punti_pose: Record<string, unknown>
          frame_numero: number | null
          confidenza_rilevamento: number | null
          data_creazione: string
        }
        Insert: {
          id?: string
          sessione_id: string
          timestamp_rilevamento: string
          punti_corpo: Record<string, unknown>
          punti_mani: Record<string, unknown>
          punti_pose: Record<string, unknown>
          frame_numero?: number | null
          confidenza_rilevamento?: number | null
          data_creazione?: string
        }
        Update: {
          id?: string
          sessione_id?: string
          timestamp_rilevamento?: string
          punti_corpo?: Record<string, unknown>
          punti_mani?: Record<string, unknown>
          punti_pose?: Record<string, unknown>
          frame_numero?: number | null
          confidenza_rilevamento?: number | null
          data_creazione?: string
        }
      }
      metriche_sessione: {
        Row: {
          id: string
          sessione_id: string
          tipo_metrica: string
          valore_metrica: number
          unita_misura: string
          articolazione: string | null
          timestamp_calcolo: string
          data_creazione: string
        }
        Insert: {
          id?: string
          sessione_id: string
          tipo_metrica: string
          valore_metrica: number
          unita_misura: string
          articolazione?: string | null
          timestamp_calcolo: string
          data_creazione?: string
        }
        Update: {
          id?: string
          sessione_id?: string
          tipo_metrica?: string
          valore_metrica?: number
          unita_misura?: string
          articolazione?: string | null
          timestamp_calcolo?: string
          data_creazione?: string
        }
      }
      configurazioni_sistema: {
        Row: {
          id: string
          nome_configurazione: string
          valore_configurazione: Record<string, unknown>
          descrizione: string | null
          categoria: string
          modificabile_da: 'admin' | 'fisioterapista' | 'paziente' | 'tutti'
          data_creazione: string
          data_aggiornamento: string
        }
        Insert: {
          id?: string
          nome_configurazione: string
          valore_configurazione: Record<string, unknown>
          descrizione?: string | null
          categoria: string
          modificabile_da?: 'admin' | 'fisioterapista' | 'paziente' | 'tutti'
          data_creazione?: string
          data_aggiornamento?: string
        }
        Update: {
          id?: string
          nome_configurazione?: string
          valore_configurazione?: Record<string, unknown>
          descrizione?: string | null
          categoria?: string
          modificabile_da?: 'admin' | 'fisioterapista' | 'paziente' | 'tutti'
          data_creazione?: string
          data_aggiornamento?: string
        }
      }
      tipi_esercizio: {
        Row: {
          id: string
          nome_esercizio: string
          descrizione: string
          istruzioni: string
          durata_consigliata_minuti: number | null
          difficolta: 'facile' | 'medio' | 'difficile'
          parti_corpo_coinvolte: string[]
          configurazione_mediapipe: Record<string, unknown> | null
          attivo: boolean
          data_creazione: string
        }
        Insert: {
          id?: string
          nome_esercizio: string
          descrizione: string
          istruzioni: string
          durata_consigliata_minuti?: number | null
          difficolta?: 'facile' | 'medio' | 'difficile'
          parti_corpo_coinvolte: string[]
          configurazione_mediapipe?: Record<string, unknown> | null
          attivo?: boolean
          data_creazione?: string
        }
        Update: {
          id?: string
          nome_esercizio?: string
          descrizione?: string
          istruzioni?: string
          durata_consigliata_minuti?: number | null
          difficolta?: 'facile' | 'medio' | 'difficile'
          parti_corpo_coinvolte?: string[]
          configurazione_mediapipe?: Record<string, unknown> | null
          attivo?: boolean
          data_creazione?: string
        }
      }
      obiettivi_terapeutici: {
        Row: {
          id: string
          paziente_id: string
          titolo_obiettivo: string
          descrizione: string
          tipo_obiettivo: string
          valore_target: number | null
          unita_misura: string | null
          data_scadenza: string | null
          stato: 'attivo' | 'raggiunto' | 'sospeso'
          note_progresso: string | null
          data_creazione: string
        }
        Insert: {
          id?: string
          paziente_id: string
          titolo_obiettivo: string
          descrizione: string
          tipo_obiettivo: string
          valore_target?: number | null
          unita_misura?: string | null
          data_scadenza?: string | null
          stato?: 'attivo' | 'raggiunto' | 'sospeso'
          note_progresso?: string | null
          data_creazione?: string
        }
        Update: {
          id?: string
          paziente_id?: string
          titolo_obiettivo?: string
          descrizione?: string
          tipo_obiettivo?: string
          valore_target?: number | null
          unita_misura?: string | null
          data_scadenza?: string | null
          stato?: 'attivo' | 'raggiunto' | 'sospeso'
          note_progresso?: string | null
          data_creazione?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types utili per l'applicazione
export type Profilo = Database['public']['Tables']['profili']['Row']
export type Fisioterapista = Database['public']['Tables']['fisioterapisti']['Row']
export type Paziente = Database['public']['Tables']['pazienti']['Row']
export type SessioneRiabilitazione = Database['public']['Tables']['sessioni_riabilitazione']['Row']
export type DatiMovimento = Database['public']['Tables']['dati_movimento']['Row']
export type MetricaSessione = Database['public']['Tables']['metriche_sessione']['Row']
export type ConfigurazioneSystema = Database['public']['Tables']['configurazioni_sistema']['Row']
export type TipoEsercizio = Database['public']['Tables']['tipi_esercizio']['Row']
export type ObiettivoTerapeutico = Database['public']['Tables']['obiettivi_terapeutici']['Row']

// Enums per type safety
export type RuoloUtente = 'fisioterapista' | 'paziente'
export type StatoSessione = 'attiva' | 'completata' | 'annullata'
export type DifficoltaEsercizio = 'facile' | 'medio' | 'difficile'
export type StatoObiettivo = 'attivo' | 'raggiunto' | 'sospeso'
export type TipoMetrica = 'angolo_articolare' | 'velocita' | 'range_movimento' | 'fluidita' | 'precisione'

// Interfaces per componenti UI
export interface FisioterapistaCompleto extends Fisioterapista {
  profilo: Profilo
  pazienti?: PazienteCompleto[]
}

export interface PazienteCompleto extends Paziente {
  profilo: Profilo
  fisioterapista: FisioterapistaCompleto
  sessioni?: SessioneRiabilitazione[]
  obiettivi?: ObiettivoTerapeutico[]
}

export interface SessioneCompleta extends SessioneRiabilitazione {
  paziente: PazienteCompleto
  dati_movimento?: DatiMovimento[]
  metriche?: MetricaSessione[]
}

// Interfaces per form data
export interface DatiRegistrazioneFisioterapista {
  nome: string
  cognome: string
  email: string
  password: string
  numero_albo: string
  specializzazione: string
  nome_clinica: string
  indirizzo_clinica: string
  telefono?: string
  email_clinica?: string
}

export interface DatiRegistrazionePaziente {
  nome: string
  cognome: string
  email: string
  password: string
  data_nascita: string
  codice_fiscale?: string
  telefono?: string
  codice_fisioterapista: string // per collegare al fisioterapista
}

export interface DatiNuovaSessione {
  paziente_id: string
  tipo_esercizio: string
  obiettivi?: string
  durata_prevista?: number
}

// Configurazioni MediaPipe
export interface ConfigurazioneMediaPipe {
  soglia_confidenza: number
  risoluzione_video: {
    width: number
    height: number
  }
  fps_target: number
  metriche_abilitate: TipoMetrica[]
  intervallo_salvataggio_secondi: number
}

// Dati landmarks MediaPipe
export interface LandmarkPoint {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface PuntiCorpo {
  pose_landmarks: LandmarkPoint[]
  timestamp: number
  confidenza: number
}

export interface PuntiMani {
  left_hand?: LandmarkPoint[]
  right_hand?: LandmarkPoint[]
  timestamp: number
  confidenza: number
}