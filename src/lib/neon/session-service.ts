// src/lib/neon/session-service.ts
// Client-side service che usa le API per gestire le sessioni

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface FrameData {
  poseLandmarks: PoseLandmark[]
  worldLandmarks: PoseLandmark[]
  confidence: number
}

interface MetricData {
  tipo: 'ROM' | 'velocita' | 'stabilita' | 'accuratezza'
  valore: number
  articolazione?: string
  unitaMisura: string
}

export class SessionDataService {
  private sessionId: string | null = null
  private autoSaveInterval: NodeJS.Timeout | null = null

  /**
   * Crea una nuova sessione di riabilitazione
   */
  async createSession(
    pazienteId: string,
    tipoEsercizio: string,
    obiettivi?: string
  ) {
    try {
      const response = await fetch('/api/sessioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paziente_id: pazienteId,
          tipo_esercizio: tipoEsercizio,
          obiettivi
        })
      })

      const data = await response.json()

      if (data.success && data.sessione) {
        this.sessionId = data.sessione.id
        return data.sessione
      }

      return null
    } catch (error) {
      console.error('Errore creazione sessione:', error)
      throw error
    }
  }

  /**
   * Termina una sessione
   */
  async endSession(
    sessionId: string,
    punteggioFinale?: number,
    note?: string
  ) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          punteggio_finale: punteggioFinale,
          note
        })
      })

      const data = await response.json()

      if (data.success) {
        this.sessionId = null
        this.stopAutoSave()
        return true
      }

      return false
    } catch (error) {
      console.error('Errore terminazione sessione:', error)
      throw error
    }
  }

  /**
   * Aggiunge un frame di movimento
   */
  async addFrame(
    sessionId: string,
    frameData: FrameData,
    frameNumber: number
  ) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}/frames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          frameData,
          frameNumber
        })
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Errore salvataggio frame:', error)
      throw error
    }
  }

  /**
   * Aggiunge metriche alla sessione
   */
  async addMetrics(sessionId: string, metrics: MetricData[]) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}/metriche`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ metrics })
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Errore salvataggio metriche:', error)
      throw error
    }
  }

  /**
   * Ottiene i dati di movimento di una sessione
   */
  async getSessionData(sessionId: string) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}/frames`, {
        credentials: 'include'
      })

      const data = await response.json()
      return data.success ? data.frames : []
    } catch (error) {
      console.error('Errore recupero dati sessione:', error)
      throw error
    }
  }

  /**
   * Ottiene le metriche di una sessione
   */
  async getSessionMetrics(sessionId: string) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}/metriche`, {
        credentials: 'include'
      })

      const data = await response.json()
      return data.success ? data.metriche : []
    } catch (error) {
      console.error('Errore recupero metriche:', error)
      throw error
    }
  }

  /**
   * Avvia il salvataggio automatico
   */
  startAutoSave(callback: () => void, intervalMs: number = 5000) {
    this.stopAutoSave()
    this.autoSaveInterval = setInterval(callback, intervalMs)
  }

  /**
   * Ferma il salvataggio automatico
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * Annulla una sessione
   */
  async cancelSession(sessionId: string) {
    try {
      const response = await fetch(`/api/sessioni/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        this.sessionId = null
        this.stopAutoSave()
        return true
      }

      return false
    } catch (error) {
      console.error('Errore annullamento sessione:', error)
      throw error
    }
  }
}
