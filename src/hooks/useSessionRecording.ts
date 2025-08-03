// src/hooks/useSessionRecording.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { SessionDataService } from '@/lib/supabase/session-service'
import { MotionMetricsCalculator, MotionMetrics } from '@/lib/computer-vision/motion-metrics'
import { toast } from 'sonner'

// Types per MediaPipe
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

interface UseSessionRecordingProps {
  pazienteId: string
  tipoEsercizio: string
  obiettivi?: string
}

interface SessionRecordingState {
  isRecording: boolean
  isPaused: boolean
  sessionId: string | null
  frameCount: number
  duration: number
  currentMetrics: MotionMetrics | null
  error: string | null
}

export function useSessionRecording({
  pazienteId,
  tipoEsercizio,
  obiettivi
}: UseSessionRecordingProps) {
  const [state, setState] = useState<SessionRecordingState>({
    isRecording: false,
    isPaused: false,
    sessionId: null,
    frameCount: 0,
    duration: 0,
    currentMetrics: null,
    error: null
  })

  const sessionServiceRef = useRef<SessionDataService | null>(null)
  const metricsCalculatorRef = useRef<MotionMetricsCalculator | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inizializza i servizi
  useEffect(() => {
    sessionServiceRef.current = new SessionDataService()
    metricsCalculatorRef.current = new MotionMetricsCalculator()

    return () => {
      // Cleanup
      if (sessionServiceRef.current) {
        sessionServiceRef.current.stopAutoSave()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  // Aggiorna la durata ogni secondo
  useEffect(() => {
    if (state.isRecording && !state.isPaused && startTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000)
        setState(prev => ({ ...prev, duration: elapsed }))
      }, 1000)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [state.isRecording, state.isPaused])

  // Avvia la registrazione
  const startRecording = useCallback(async () => {
    if (!sessionServiceRef.current || !pazienteId) return

    try {
      // Crea una nuova sessione
      const session = await sessionServiceRef.current.createSession(
        pazienteId,
        tipoEsercizio,
        obiettivi
      )

      if (!session) {
        throw new Error('Impossibile creare la sessione')
      }

      startTimeRef.current = Date.now()
      
      setState({
        isRecording: true,
        isPaused: false,
        sessionId: session.id,
        frameCount: 0,
        duration: 0,
        currentMetrics: null,
        error: null
      })

      toast.success("Registrazione avviata", {
        description: "La sessione è iniziata correttamente"
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }))
      
      toast.error("Impossibile avviare la registrazione")
    }
  }, [pazienteId, tipoEsercizio, obiettivi])

  // Ferma la registrazione
  const stopRecording = useCallback(async (punteggioFinale?: number, note?: string) => {
    if (!sessionServiceRef.current || !state.sessionId) return

    try {
      await sessionServiceRef.current.endSession(
        state.sessionId,
        punteggioFinale,
        note
      )

      setState({
        isRecording: false,
        isPaused: false,
        sessionId: null,
        frameCount: 0,
        duration: 0,
        currentMetrics: null,
        error: null
      })

      toast.success("Registrazione completata", {
        description: `Sessione salvata con successo (${state.frameCount} frame registrati)`
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }))
      
      toast.error("Errore nel salvare la sessione")
    }
  }, [state.sessionId, state.frameCount])

  // Pausa/Riprendi la registrazione
  const togglePause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }))
  }, [])

  // Processa un nuovo frame
  const processFrame = useCallback(async (frameData: FrameData) => {
    if (!state.isRecording || state.isPaused || !state.sessionId) return
    if (!sessionServiceRef.current || !metricsCalculatorRef.current) return

    try {
      // Salva il frame
      await sessionServiceRef.current.addFrame(
        state.sessionId,
        frameData,
        state.frameCount
      )

      // Calcola le metriche
      const metrics = metricsCalculatorRef.current.calculateMetrics(frameData.poseLandmarks)

      // Salva le metriche ogni 30 frame (circa 1 secondo)
      if (state.frameCount % 30 === 0) {
        const metricsToSave = [
          { tipo: 'ROM' as const, valore: metrics.rom.shoulderLeft, articolazione: 'spalla_sinistra', unitaMisura: 'gradi' },
          { tipo: 'ROM' as const, valore: metrics.rom.shoulderRight, articolazione: 'spalla_destra', unitaMisura: 'gradi' },
          { tipo: 'velocita' as const, valore: metrics.velocity.avgVelocity, unitaMisura: 'px/s' },
          { tipo: 'stabilita' as const, valore: metrics.stability.balanceScore, unitaMisura: 'punti' },
          { tipo: 'accuratezza' as const, valore: metrics.symmetry.overall, unitaMisura: 'percentuale' }
        ]
        
        await sessionServiceRef.current.addMetrics(state.sessionId, metricsToSave)
      }

      setState(prev => ({
        ...prev,
        frameCount: prev.frameCount + 1,
        currentMetrics: metrics
      }))
    } catch (error) {
      console.error('Errore nel processare il frame:', error)
    }
  }, [state.isRecording, state.isPaused, state.sessionId, state.frameCount])

  // Ottieni i dati della sessione
  const getSessionData = useCallback(async () => {
    if (!sessionServiceRef.current || !state.sessionId) return null

    try {
      const [movements, metrics] = await Promise.all([
        sessionServiceRef.current.getSessionData(state.sessionId),
        sessionServiceRef.current.getSessionMetrics(state.sessionId)
      ])

      return { movements, metrics }
    } catch (error) {
      console.error('Errore nel recuperare i dati:', error)
      return null
    }
  }, [state.sessionId])

  // Formatta la durata in MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    // State
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    sessionId: state.sessionId,
    frameCount: state.frameCount,
    duration: state.duration,
    formattedDuration: formatDuration(state.duration),
    currentMetrics: state.currentMetrics,
    error: state.error,
    
    // Actions
    startRecording,
    stopRecording,
    togglePause,
    processFrame,
    getSessionData
  }
}