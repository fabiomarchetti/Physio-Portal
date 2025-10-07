'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PoseOverlayProps {
  landmarks: PoseLandmark[]
  videoElement: HTMLVideoElement | null
  confidence: number
  className?: string
  activeLandmarks?: {[key: number]: string}
  activeConnections?: number[][]
  disableBodyFallback?: boolean
}

// MediaPipe Pose landmark indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
}

export function PoseOverlay({ landmarks, videoElement, confidence, className = '', activeLandmarks, activeConnections, disableBodyFallback = false }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastRenderTimeRef = useRef<number>(0)

  const drawPoseLandmarks = useCallback(() => {
    const now = performance.now()
    
    // Throttle rendering a 30 FPS per fluidità video
    if (now - lastRenderTimeRef.current < 33) { // ~30 FPS
      return
    }
    lastRenderTimeRef.current = now

    if (!canvasRef.current || !videoElement || !landmarks || landmarks.length === 0) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sincronizza dimensioni canvas con video
    const rect = videoElement.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const alpha = Math.max(0.7, confidence)
    const pointRadius = confidence > 0.8 ? 8 : 6
    const lineWidth = confidence > 0.8 ? 4 : 3
    const glowRadius = confidence > 0.8 ? 15 : 12

    // Colori vivaci per ogni parte del corpo
    const bodyPartColors = {
      head: `rgba(255, 50, 50, ${alpha})`,        // Rosso brillante
      torso: `rgba(50, 255, 150, ${alpha})`,      // Verde acqua
      leftShoulder: `rgba(50, 150, 255, ${alpha})`,   // Blu cielo
      leftElbow: `rgba(100, 200, 255, ${alpha})`,     // Blu chiaro
      leftWrist: `rgba(150, 220, 255, ${alpha})`,     // Azzurro
      rightShoulder: `rgba(255, 50, 150, ${alpha})`,  // Rosa magenta
      rightElbow: `rgba(255, 100, 200, ${alpha})`,    // Rosa
      rightWrist: `rgba(255, 150, 220, ${alpha})`,    // Rosa chiaro
      leftHip: `rgba(255, 200, 50, ${alpha})`,        // Giallo oro
      leftKnee: `rgba(255, 220, 100, ${alpha})`,      // Giallo chiaro
      leftAnkle: `rgba(255, 240, 150, ${alpha})`,     // Giallo pallido
      rightHip: `rgba(150, 50, 255, ${alpha})`,       // Viola
      rightKnee: `rgba(180, 100, 255, ${alpha})`,     // Viola chiaro
      rightAnkle: `rgba(200, 150, 255, ${alpha})`     // Lilla
    }

    // Determina se abbiamo landmark della mano attivi
    const hasHandActive = !!(activeLandmarks && Object.keys(activeLandmarks).some(k => parseInt(k) >= 0 && parseInt(k) <= 20))
    const hasActive = !!(activeLandmarks && Object.keys(activeLandmarks).length > 0)

    // Prepara connessioni da disegnare
    let connectionsToDraw: { start: number, end: number, color: string }[] = []
    
    console.log('🔍 PoseOverlay DEBUG: Stato connessioni', {
      activeConnections: activeConnections,
      activeConnectionsLength: activeConnections?.length || 0,
      hasHandActive,
      hasActive,
      disableBodyFallback
    })
    
    if (activeConnections && activeConnections.length > 0) {
      // Usa le connessioni specificate per l'esercizio
      connectionsToDraw = activeConnections.map(conn => ({
        start: conn[0],
        end: conn[1],
        color: bodyPartColors.torso
      }))
      console.log('🔍 PoseOverlay: Usando connessioni specifiche:', connectionsToDraw.length)
    } else if (activeConnections && activeConnections.length === 0) {
      // IMPORTANTE: Se activeConnections è esplicitamente vuoto, non disegnare nulla
      // Questo rispetta il toggle showLines = false
      connectionsToDraw = []
      console.log('🔍 PoseOverlay: activeConnections vuoto, nessuna connessione (toggle OFF)')
    } else if (hasHandActive) {
      // Per esercizi mano senza connessioni specifiche, usa tutte le connessioni mano
      connectionsToDraw = []
      console.log('🔍 PoseOverlay: Esercizio mano, nessuna connessione')
    } else if (!hasActive) {
      // Fallback: connessioni corpo predefinite (solo se non è stato esplicitamente disabilitato)
      connectionsToDraw = [
        { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.RIGHT_SHOULDER, color: bodyPartColors.torso },
        { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_ELBOW, color: bodyPartColors.leftShoulder },
        { start: POSE_LANDMARKS.LEFT_ELBOW, end: POSE_LANDMARKS.LEFT_WRIST, color: bodyPartColors.leftElbow },
        { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_ELBOW, color: bodyPartColors.rightShoulder },
        { start: POSE_LANDMARKS.RIGHT_ELBOW, end: POSE_LANDMARKS.RIGHT_WRIST, color: bodyPartColors.rightElbow },
        { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_HIP, color: bodyPartColors.torso },
        { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
        { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
        { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.LEFT_KNEE, color: bodyPartColors.leftHip },
        { start: POSE_LANDMARKS.LEFT_KNEE, end: POSE_LANDMARKS.LEFT_ANKLE, color: bodyPartColors.leftKnee },
        { start: POSE_LANDMARKS.RIGHT_HIP, end: POSE_LANDMARKS.RIGHT_KNEE, color: bodyPartColors.rightHip },
        { start: POSE_LANDMARKS.RIGHT_KNEE, end: POSE_LANDMARKS.RIGHT_ANKLE, color: bodyPartColors.rightKnee }
      ]
      console.log('🔍 PoseOverlay: Usando connessioni fallback corpo:', connectionsToDraw.length)
    }
    
    console.log('🔍 PoseOverlay: Connessioni finali da disegnare:', connectionsToDraw.length)

    // Disegna connessioni
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    
    console.log('🔍 PoseOverlay: Iniziando a disegnare', connectionsToDraw.length, 'connessioni')
    
    try {
      connectionsToDraw.forEach(({ start, end, color }, index) => {
        console.log(`🔍 PoseOverlay: Disegnando connessione ${index + 1}/${connectionsToDraw.length}: ${start} → ${end}`)
      // CORREZIONE: Distingui tra landmark corpo e mano
      // L'array combinato ha: [0-32] = corpo, [33-53] = mano
      let startIndex = start
      let endIndex = end
      
      // Determina se questo è un esercizio per la mano o per il corpo
      // IMPORTANTE: Se non ci sono activeLandmarks, è sempre un esercizio corpo
      const activeKeys = Object.keys(activeLandmarks || {}).map(k => parseInt(k))
      const isHandExercise = activeKeys.length > 0 && activeKeys.every(key => key >= 0 && key <= 20)
      const isBodyExercise = activeKeys.length === 0 || activeKeys.every(key => key >= 0 && key <= 32)
      
      console.log(`🔍 PoseOverlay: Mappatura connessione ${start} → ${end}`, {
        activeKeys,
        isHandExercise,
        isBodyExercise,
        landmarksLength: landmarks.length
      })
      
      if (isHandExercise && start >= 0 && start <= 20) {
        // Esercizio mano: mappa 0-20 → 33-53 (posizione mano nell'array combinato)
        startIndex = 33 + start
        console.log(`🔍 PoseOverlay: Mappa mano start ${start} → ${startIndex}`)
      } else if (isBodyExercise && start >= 0 && start <= 32) {
        // Esercizio corpo: usa l'indice diretto
        startIndex = start
        console.log(`🔍 PoseOverlay: Mappa corpo start ${start} → ${startIndex}`)
      }
      
      if (isHandExercise && end >= 0 && end <= 20) {
        // Esercizio mano: mappa 0-20 → 33-53 (posizione mano nell'array combinato)
        endIndex = 33 + end
        console.log(`🔍 PoseOverlay: Mappa mano end ${end} → ${endIndex}`)
      } else if (isBodyExercise && end >= 0 && end <= 32) {
        // Esercizio corpo: usa l'indice diretto
        endIndex = end
        console.log(`🔍 PoseOverlay: Mappa corpo end ${end} → ${endIndex}`)
      }
      
      const startLandmark = landmarks[startIndex]
      const endLandmark = landmarks[endIndex]
      
      if (startLandmark && endLandmark) {
        const startVis = (startLandmark.visibility ?? 1)
        const endVis = (endLandmark.visibility ?? 1)
        
        if (startVis > 0.2 && endVis > 0.2) {
          
          // Gradiente per la linea
          const gradient = ctx.createLinearGradient(
            startLandmark.x * canvas.width, startLandmark.y * canvas.height,
            endLandmark.x * canvas.width, endLandmark.y * canvas.height
          )
          
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, color.replace(alpha.toString(), (alpha * 0.7).toString()))
          
          ctx.strokeStyle = gradient
          ctx.shadowColor = color
          ctx.shadowBlur = 3
          ctx.beginPath()
          ctx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height)
          ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      } else {
        console.log(`⚠️ PoseOverlay: Landmark mancanti per connessione ${start}(${startIndex}) → ${end}(${endIndex})`, {
          startLandmark: !!startLandmark,
          endLandmark: !!endLandmark,
          startIndex,
          endIndex,
          landmarksLength: landmarks.length
        })
      }
    })
    
    console.log('🔍 PoseOverlay: Connessioni disegnate con successo')
    
    } catch (error) {
      console.error('❌ PoseOverlay: Errore durante il disegno delle connessioni:', error)
    }

    // Mappa colori per punti
    const landmarkColorMap = {
      [POSE_LANDMARKS.NOSE]: bodyPartColors.head,
      [POSE_LANDMARKS.LEFT_SHOULDER]: bodyPartColors.leftShoulder,
      [POSE_LANDMARKS.RIGHT_SHOULDER]: bodyPartColors.rightShoulder,
      [POSE_LANDMARKS.LEFT_ELBOW]: bodyPartColors.leftElbow,
      [POSE_LANDMARKS.RIGHT_ELBOW]: bodyPartColors.rightElbow,
      [POSE_LANDMARKS.LEFT_WRIST]: bodyPartColors.leftWrist,
      [POSE_LANDMARKS.RIGHT_WRIST]: bodyPartColors.rightWrist,
      [POSE_LANDMARKS.LEFT_HIP]: bodyPartColors.leftHip,
      [POSE_LANDMARKS.RIGHT_HIP]: bodyPartColors.rightHip,
      [POSE_LANDMARKS.LEFT_KNEE]: bodyPartColors.leftKnee,
      [POSE_LANDMARKS.RIGHT_KNEE]: bodyPartColors.rightKnee,
      [POSE_LANDMARKS.LEFT_ANKLE]: bodyPartColors.leftAnkle,
      [POSE_LANDMARKS.RIGHT_ANKLE]: bodyPartColors.rightAnkle
    }

    // Disegna punti salienti
    if (hasActive) {
      console.log('🔍 PoseOverlay: Rendering landmark attivi per esercizio', {
        activeLandmarksCount: Object.keys(activeLandmarks!).length,
        activeLandmarksKeys: Object.keys(activeLandmarks!),
        landmarksLength: landmarks.length
      })
      
      // Disegna solo i landmark attivi per l'esercizio
      Object.entries(activeLandmarks!).forEach(([indexStr, name]) => {
        const index = parseInt(indexStr)
        
        // CORREZIONE: Distingui tra landmark corpo e mano
        // L'array combinato ha: [0-32] = corpo, [33-53] = mano
        let landmarkIndex = index
        
        // Determina se questo è un esercizio per la mano o per il corpo
        // Se gli indici attivi sono 0-20, è un esercizio mano
        // Se gli indici attivi sono 0-32, è un esercizio corpo
        const activeKeys = Object.keys(activeLandmarks!).map(k => parseInt(k))
        const isHandExercise = activeKeys.every(key => key >= 0 && key <= 20)
        const isBodyExercise = activeKeys.every(key => key >= 0 && key <= 32) && !isHandExercise
        
        if (isHandExercise && index >= 0 && index <= 20) {
          // Esercizio mano: mappa 0-20 → 33-53 (posizione mano nell'array combinato)
          landmarkIndex = 33 + index
          console.log(`🔍 PoseOverlay: Landmark mano ${index} → ${landmarkIndex} (${name})`)
        } else if (isBodyExercise && index >= 0 && index <= 32) {
          // Esercizio corpo: usa l'indice diretto
          landmarkIndex = index
          console.log(`🔍 PoseOverlay: Landmark corpo ${index} → ${landmarkIndex} (${name})`)
        } else {
          // Fallback: usa l'indice diretto
          landmarkIndex = index
          console.log(`🔍 PoseOverlay: Landmark fallback ${index} → ${landmarkIndex} (${name})`)
        }
        
        const landmark = landmarks[landmarkIndex]
        
        if (landmark) {
          const vis = (landmark.visibility ?? 1)
          if (vis > 0.2) {
            
            const x = landmark.x * canvas.width
            const y = landmark.y * canvas.height
            
            // Colore predefinito per landmark attivi
            const color = bodyPartColors.torso
            
            // Effetto glow
            ctx.shadowColor = color
            ctx.shadowBlur = glowRadius
            
            // Cerchio esterno (alone)
            ctx.fillStyle = color.replace(alpha.toString(), (alpha * 0.3).toString())
            ctx.beginPath()
            ctx.arc(x, y, pointRadius + 3, 0, 2 * Math.PI)
            ctx.fill()
            
            // Cerchio principale
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
            ctx.fill()
            
            // Cerchio interno (highlight)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.beginPath()
            ctx.arc(x, y, pointRadius * 0.4, 0, 2 * Math.PI)
            ctx.fill()
            
            ctx.shadowBlur = 0
            
            // Barra confidenza
            const confidenceBar = (landmark.visibility ?? 1) * 20
            ctx.fillStyle = `rgba(255, 255, 255, 0.8)`
            ctx.fillRect(x - 10, y - pointRadius - 8, confidenceBar, 2)
          }
        }
      })
    } else if (!disableBodyFallback) {
      // Fallback: disegna i landmark del corpo solo se non ci sono activeLandmarks
      Object.entries(landmarkColorMap).forEach(([indexStr, color]) => {
        const index = parseInt(indexStr)
        const landmark = landmarks[index]
        
        if (landmark && (landmark.visibility || 0) > 0.5) {
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height
          
          // Effetto glow
          ctx.shadowColor = color
          ctx.shadowBlur = glowRadius
          
          // Cerchio esterno (alone)
          ctx.fillStyle = color.replace(alpha.toString(), (alpha * 0.3).toString())
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 3, 0, 2 * Math.PI)
          ctx.fill()
          
          // Cerchio principale
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
          ctx.fill()
          
          // Cerchio interno (highlight)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.beginPath()
          ctx.arc(x, y, pointRadius * 0.4, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.shadowBlur = 0
          
          // Barra confidenza per articolazioni principali
          if ([POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, 
               POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
               POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
               POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
               POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,
               POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE].includes(index)) {
            
            const confidenceBar = (landmark.visibility || 0) * 20
            ctx.fillStyle = `rgba(255, 255, 255, 0.8)`
            ctx.fillRect(x - 10, y - pointRadius - 8, confidenceBar, 2)
          }
        }
      })
    }
    
  }, [landmarks, videoElement, confidence, activeLandmarks, activeConnections, disableBodyFallback])

  // Ridisegna quando cambiano i landmarks
  useEffect(() => {
    drawPoseLandmarks()
  }, [drawPoseLandmarks])

  // Ridisegna quando la finestra viene ridimensionata
  useEffect(() => {
    const handleResize = () => drawPoseLandmarks()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawPoseLandmarks])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        zIndex: 20,
        transform: className?.includes('therapist-overlay') ? 'scaleX(-1)' : 'none'
      }}
    />
  )
}