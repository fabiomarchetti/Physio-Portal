// src/lib/supabase/session-service.ts
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type DatiMovimento = Database['public']['Tables']['dati_movimento']['Insert']
type MetricheSessione = Database['public']['Tables']['metriche_sessione']['Insert']
type SessioneRiabilitazione = Database['public']['Tables']['sessioni_riabilitazione']['Row']

// Interfaccia per i landmarks di MediaPipe
interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface MediaPipeLandmarks {
  poseLandmarks?: PoseLandmark[]
  leftHandLandmarks?: PoseLandmark[]
  rightHandLandmarks?: PoseLandmark[]
  worldLandmarks?: PoseLandmark[]
  confidence?: number
}

// Interfaccia per le metriche calcolate
export interface MetricaCalcolata {
  tipo: 'ROM' | 'velocita' | 'stabilita' | 'accuratezza'
  valore: number
  articolazione?: string
  unitaMisura: string
}

export class SessionDataService {
  private supabase = createClient()
  private frameBuffer: DatiMovimento[] = []
  private metricsBuffer: MetricheSessione[] = []
  private saveInterval: NodeJS.Timeout | null = null
  
  // Salva i dati ogni 5 secondi per ottimizzare le performance
  private SAVE_INTERVAL = 5000
  private MAX_BUFFER_SIZE = 30 // ~1 secondo a 30fps

  constructor() {
    this.startAutoSave()
  }

  // Avvia il salvataggio automatico
  private startAutoSave() {
    this.saveInterval = setInterval(() => {
      this.flushBuffers()
    }, this.SAVE_INTERVAL)
  }

  // Ferma il salvataggio automatico
  public stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }
    // Salva i dati rimanenti
    this.flushBuffers()
  }

  // Aggiungi frame al buffer
  public async addFrame(
    sessioneId: string,
    landmarks: MediaPipeLandmarks,
    frameNumero: number
  ) {
    const frame: DatiMovimento = {
      id: crypto.randomUUID(),
      sessione_id: sessioneId,
      timestamp_rilevamento: new Date().toISOString(),
      punti_corpo: landmarks.worldLandmarks ? JSON.parse(JSON.stringify(landmarks.worldLandmarks)) : null,
      punti_pose: landmarks.poseLandmarks ? JSON.parse(JSON.stringify(landmarks.poseLandmarks)) : null,
      punti_mani: {
        left: landmarks.leftHandLandmarks ? JSON.parse(JSON.stringify(landmarks.leftHandLandmarks)) : null,
        right: landmarks.rightHandLandmarks ? JSON.parse(JSON.stringify(landmarks.rightHandLandmarks)) : null
      },
      frame_numero: frameNumero,
      confidenza_rilevamento: landmarks.confidence || 0,
      data_creazione: new Date().toISOString()
    }

    this.frameBuffer.push(frame)

    // Se il buffer è pieno, salva immediatamente
    if (this.frameBuffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flushFrameBuffer()
    }
  }

  // Calcola e salva metriche
  public async addMetrics(
    sessioneId: string,
    metriche: MetricaCalcolata[]
  ) {
    const metricsToSave = metriche.map(m => ({
      id: crypto.randomUUID(),
      sessione_id: sessioneId,
      tipo_metrica: m.tipo,
      valore_metrica: m.valore,
      unita_misura: m.unitaMisura,
      articolazione: m.articolazione || null,
      timestamp_calcolo: new Date().toISOString(),
      data_creazione: new Date().toISOString()
    }))

    this.metricsBuffer.push(...metricsToSave)
  }

  // Svuota i buffer salvando i dati
  private async flushBuffers() {
    await Promise.all([
      this.flushFrameBuffer(),
      this.flushMetricsBuffer()
    ])
  }

  // Salva i frame nel database
  private async flushFrameBuffer() {
    if (this.frameBuffer.length === 0) return

    const framesToSave = [...this.frameBuffer]
    this.frameBuffer = []

    try {
      const { error } = await this.supabase
        .from('dati_movimento')
        .insert(framesToSave)

      if (error) {
        console.error('Errore nel salvare i dati movimento:', error)
        // Rimetti i frame nel buffer per riprovare
        this.frameBuffer.unshift(...framesToSave)
      }
    } catch (err) {
      console.error('Errore nel salvare i frame:', err)
      this.frameBuffer.unshift(...framesToSave)
    }
  }

  // Salva le metriche nel database
  private async flushMetricsBuffer() {
    if (this.metricsBuffer.length === 0) return

    const metricsToSave = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      const { error } = await this.supabase
        .from('metriche_sessione')
        .insert(metricsToSave)

      if (error) {
        console.error('Errore nel salvare le metriche:', error)
        this.metricsBuffer.unshift(...metricsToSave)
      }
    } catch (err) {
      console.error('Errore nel salvare le metriche:', err)
      this.metricsBuffer.unshift(...metricsToSave)
    }
  }

  // Crea una nuova sessione
  public async createSession(
    pazienteId: string,
    tipoEsercizio: string,
    obiettivi?: string
  ): Promise<SessioneRiabilitazione | null> {
    const { data, error } = await this.supabase
      .from('sessioni_riabilitazione')
      .insert({
        paziente_id: pazienteId,
        data_inizio: new Date().toISOString(),
        tipo_esercizio: tipoEsercizio,
        obiettivi: obiettivi || null,
        stato: 'in_corso'
      })
      .select()
      .single()

    if (error) {
      console.error('Errore nella creazione sessione:', error)
      return null
    }

    return data
  }

  // Termina una sessione
  public async endSession(
    sessioneId: string,
    punteggioFinale?: number,
    note?: string
  ) {
    // Salva tutti i dati rimanenti
    await this.flushBuffers()

    const dataFine = new Date()
    
    // Calcola la durata
    const { data: sessione } = await this.supabase
      .from('sessioni_riabilitazione')
      .select('data_inizio')
      .eq('id', sessioneId)
      .single()

    if (!sessione) return

    const dataInizio = new Date(sessione.data_inizio)
    const durataMinuti = Math.round((dataFine.getTime() - dataInizio.getTime()) / 60000)

    // Aggiorna la sessione
    const { error } = await this.supabase
      .from('sessioni_riabilitazione')
      .update({
        data_fine: dataFine.toISOString(),
        durata_minuti: durataMinuti,
        stato: 'completata',
        punteggio_finale: punteggioFinale || null,
        note: note || null
      })
      .eq('id', sessioneId)

    if (error) {
      console.error('Errore nel terminare la sessione:', error)
    }
  }

  // Recupera i dati di una sessione
  public async getSessionData(sessioneId: string) {
    const { data, error } = await this.supabase
      .from('dati_movimento')
      .select('*')
      .eq('sessione_id', sessioneId)
      .order('timestamp_rilevamento', { ascending: true })

    if (error) {
      console.error('Errore nel recuperare i dati:', error)
      return []
    }

    return data
  }

  // Recupera le metriche di una sessione
  public async getSessionMetrics(sessioneId: string) {
    const { data, error } = await this.supabase
      .from('metriche_sessione')
      .select('*')
      .eq('sessione_id', sessioneId)
      .order('timestamp_calcolo', { ascending: true })

    if (error) {
      console.error('Errore nel recuperare le metriche:', error)
      return []
    }

    return data
  }
}