// src/components/computer-vision/PoseDetection.tsx - VERSIONE COMBINATA
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  AlertCircle,
  Zap,
  Target,
  Database,
  BarChart
} from 'lucide-react'
import { useSessionRecording } from '@/hooks/useSessionRecording'
import { toast } from 'sonner'
import { BODY_LANDMARKS, BODY_CONNECTIONS } from '@/components/exercises/body/landmarks'
import { HAND_LANDMARKS, HAND_CONNECTIONS } from '@/components/exercises/hands/landmarks'
import { FACE_LANDMARKS, FACE_CONNECTIONS } from '@/components/exercises/face/landmarks'

// Types per MediaPipe
interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface HandLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PoseDetectionResult {
  landmarks: PoseLandmark[]
  worldLandmarks: PoseLandmark[]
  segmentationMasks?: ImageData[]
  handLandmarks?: HandLandmark[][] // Array di array: una mano per array
}

interface PoseDetectionProps {
  videoElement: HTMLVideoElement | null
  onPoseDetected?: (result: PoseDetectionResult) => void
  onError?: (error: string) => void
  isActive?: boolean
  // Props per database
  enableRecording?: boolean
  pazienteId?: string
  tipoEsercizio?: string
  obiettivi?: string
  onSessionComplete?: (sessionId: string) => void
  // Props per landmark attivi
  activeLandmarks?: {[key: number]: string}
  activeConnections?: number[][]
}

// Performance settings - OTTIMIZZATO per fluidità video
const PERFORMANCE_SETTINGS = {
  TARGET_FPS: 30,
  MIN_CONFIDENCE: 0.4,
  DRAWING_THROTTLE: 2,
  STATS_UPDATE_INTERVAL: 1000,
  CANVAS_SCALE: 0.8, // Ridotto per performance
}



// MediaPipe Pose landmark indices (mantenuti per compatibilità)
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

export function PoseDetection({ 
  videoElement, 
  onPoseDetected, 
  onError,
  isActive = false,
  // Props per database
  enableRecording = false,
  pazienteId,
  tipoEsercizio = 'Esercizio generico',
  obiettivi,
  onSessionComplete,
  // Props per landmark attivi
  activeLandmarks,
  activeConnections
}: PoseDetectionProps) {
  // Refs per rendering
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const poseDetectorRef = useRef<unknown>(null)
  const handDetectorRef = useRef<unknown>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const drawingCountRef = useRef<number>(0)
  
  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'fast'>('balanced')
  const [stats, setStats] = useState({
    fps: 0,
    detectionTime: 0,
    totalDetections: 0,
    averageConfidence: 0,
    droppedFrames: 0
  })

  // Hook per registrazione dati - sempre chiamato per rispettare le regole degli hook
  const recording = useSessionRecording({
    pazienteId: pazienteId || '',
    tipoEsercizio,
    obiettivi
  })

  // Usa recording solo se abilitato e pazienteId è presente
  const shouldUseRecording = enableRecording && pazienteId


  // Performance configurations
  const getPerformanceConfig = useCallback(() => {
    switch (performanceMode) {
      case 'high':
        return {
          TARGET_FPS: 30,
          MIN_CONFIDENCE: 0.6,
          DRAWING_THROTTLE: 2,
          CANVAS_SCALE: 0.9
        }
      case 'fast':
        return {
          TARGET_FPS: 20,
          MIN_CONFIDENCE: 0.4,
          DRAWING_THROTTLE: 3,
          CANVAS_SCALE: 0.7
        }
      default: // balanced
        return {
          TARGET_FPS: 25,
          MIN_CONFIDENCE: 0.5,
          DRAWING_THROTTLE: 2,
          CANVAS_SCALE: 0.8
        }
    }
  }, [performanceMode])

  // Initialize MediaPipe Pose
  const initializePoseDetection = useCallback(async () => {
    try {
      setError(null)
      console.log('🚀 Inizializzazione MediaPipe Pose...')

      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      )
      
      const config = getPerformanceConfig()
      
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU' // Fallback a CPU se GPU non disponibile
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputSegmentationMasks: false
      })
      
      poseDetectorRef.current = poseLandmarker
      setIsInitialized(true)
      console.log('✅ MediaPipe Pose inizializzato con successo!')
      
    } catch (err) {
      console.error('❌ Errore inizializzazione MediaPipe:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(`Errore MediaPipe: ${errorMessage}`)
      onError?.(errorMessage)
    }
  }, [onError, getPerformanceConfig])

  // Initialize MediaPipe Hands (solo se necessario)
  const initializeHandsDetection = useCallback(async () => {
    try {
      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      )

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'CPU' // Fallback a CPU se GPU non disponibile
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
      })

      handDetectorRef.current = handLandmarker
    } catch (err) {
      console.error('❌ Errore inizializzazione MediaPipe Hands:', err)
    }
  }, [])

  // Enhanced landmark drawing con punti colorati evidenziati
  const drawPoseLandmarksOptimized = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    width: number,
    height: number,
    confidence: number
  ) => {
    const config = getPerformanceConfig()
    
    // Adaptive styling based on confidence - punti più grandi e visibili
    const alpha = Math.max(0.7, confidence)
    const pointRadius = confidence > 0.8 ? 8 : 6
    const lineWidth = confidence > 0.8 ? 4 : 3
    const glowRadius = confidence > 0.8 ? 15 : 12

    // Colori vivaci e distintivi per ogni parte del corpo
    const bodyPartColors = {
      // Testa e collo
      head: `rgba(255, 50, 50, ${alpha})`,        // Rosso brillante
      neck: `rgba(255, 100, 50, ${alpha})`,       // Arancione rosso
      
      // Torso
      torso: `rgba(50, 255, 150, ${alpha})`,      // Verde acqua
      
      // Braccio sinistro
      leftShoulder: `rgba(50, 150, 255, ${alpha})`,   // Blu cielo
      leftElbow: `rgba(100, 200, 255, ${alpha})`,     // Blu chiaro
      leftWrist: `rgba(150, 220, 255, ${alpha})`,     // Azzurro
      
      // Braccio destro
      rightShoulder: `rgba(255, 50, 150, ${alpha})`,  // Rosa magenta
      rightElbow: `rgba(255, 100, 200, ${alpha})`,    // Rosa
      rightWrist: `rgba(255, 150, 220, ${alpha})`,    // Rosa chiaro
      
      // Gamba sinistra
      leftHip: `rgba(255, 200, 50, ${alpha})`,        // Giallo oro
      leftKnee: `rgba(255, 220, 100, ${alpha})`,      // Giallo chiaro
      leftAnkle: `rgba(255, 240, 150, ${alpha})`,     // Giallo pallido
      
      // Gamba destra
      rightHip: `rgba(150, 50, 255, ${alpha})`,       // Viola
      rightKnee: `rgba(180, 100, 255, ${alpha})`,     // Viola chiaro
      rightAnkle: `rgba(200, 150, 255, ${alpha})`     // Lilla
    }

    // Connessioni con colori specifici per ogni segmento
    const connections = [
      // Spalle
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.RIGHT_SHOULDER, color: bodyPartColors.torso },
      
      // Braccio sinistro
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_ELBOW, color: bodyPartColors.leftShoulder },
      { start: POSE_LANDMARKS.LEFT_ELBOW, end: POSE_LANDMARKS.LEFT_WRIST, color: bodyPartColors.leftElbow },
      
      // Braccio destro
      { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_ELBOW, color: bodyPartColors.rightShoulder },
      { start: POSE_LANDMARKS.RIGHT_ELBOW, end: POSE_LANDMARKS.RIGHT_WRIST, color: bodyPartColors.rightElbow },
      
      // Torso
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_HIP, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
      
      // Gamba sinistra
      { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.LEFT_KNEE, color: bodyPartColors.leftHip },
      { start: POSE_LANDMARKS.LEFT_KNEE, end: POSE_LANDMARKS.LEFT_ANKLE, color: bodyPartColors.leftKnee },
      
      // Gamba destra
      { start: POSE_LANDMARKS.RIGHT_HIP, end: POSE_LANDMARKS.RIGHT_KNEE, color: bodyPartColors.rightHip },
      { start: POSE_LANDMARKS.RIGHT_KNEE, end: POSE_LANDMARKS.RIGHT_ANKLE, color: bodyPartColors.rightKnee }
    ]

    // Disegna le connessioni con colori specifici
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    connections.forEach(({ start, end, color }) => {
      const startLandmark = landmarks[start]
      const endLandmark = landmarks[end]
      
      if (startLandmark && endLandmark &&
          (startLandmark.visibility || 0) > config.MIN_CONFIDENCE &&
          (endLandmark.visibility || 0) > config.MIN_CONFIDENCE) {
        
        // Linea con gradiente
        const gradient = ctx.createLinearGradient(
          startLandmark.x * width, startLandmark.y * height,
          endLandmark.x * width, endLandmark.y * height
        )
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, color.replace(alpha.toString(), (alpha * 0.7).toString()))
        
        ctx.strokeStyle = gradient
        ctx.shadowColor = color
        ctx.shadowBlur = 3
        ctx.beginPath()
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height)
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })

    // Mappa dei punti salienti con colori specifici
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

    // Disegna i punti salienti con effetti avanzati
    Object.entries(landmarkColorMap).forEach(([indexStr, color]) => {
      const index = parseInt(indexStr)
      const landmark = landmarks[index]
      
      if (landmark && (landmark.visibility || 0) > config.MIN_CONFIDENCE) {
        const x = landmark.x * width
        const y = landmark.y * height
        
        // Effetto glow esterno
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
        
        // Reset shadow
        ctx.shadowBlur = 0
        
        // Etichetta per punti importanti (opzionale, solo per articolazioni principali)
        if ([POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
             POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
             POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
             POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
             POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,
             POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE].includes(index)) {
          
          // Piccolo indicatore di confidenza
          const confidenceBar = (landmark.visibility || 0) * 20
          ctx.fillStyle = `rgba(255, 255, 255, 0.8)`
          ctx.fillRect(x - 10, y - pointRadius - 8, confidenceBar, 2)
        }
      }
    })
  }, [getPerformanceConfig])

  // Optimized frame processing - BILANCIATO per fluidità video
  const processFrame = useCallback(async () => {
    if (!videoElement || !poseDetectorRef.current || !canvasRef.current || !isDetecting) {
      return
    }

    const now = performance.now()
    const config = getPerformanceConfig()
    const frameInterval = 1000 / config.TARGET_FPS

    // Frame rate limiting per non sovraccaricare il browser
    if (now - lastFrameTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Adaptive canvas sizing
      const targetWidth = Math.floor(videoElement.videoWidth * config.CANVAS_SCALE)
      const targetHeight = Math.floor(videoElement.videoHeight * config.CANVAS_SCALE)

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
      }

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      // MediaPipe detection
      const detectionStart = performance.now()
      let results: unknown
      
      try {
        const detector = poseDetectorRef.current
        if (detector && typeof detector === 'object' && detector !== null && 'detectForVideo' in detector) {
          const detectorWithMethod = detector as { detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown }
          results = detectorWithMethod.detectForVideo(videoElement, now)
        } else {
          return
        }
      } catch (err) {
        console.error('❌ Errore detectForVideo:', err)
        setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }))
        animationFrameRef.current = requestAnimationFrame(processFrame)
        return
      }

      const detectionTime = performance.now() - detectionStart

      // Process results
      if (results &&
          typeof results === 'object' &&
          results !== null &&
          'landmarks' in results &&
          'worldLandmarks' in results) {
        
        const resultsObj = results as {
          landmarks: PoseLandmark[][],
          worldLandmarks: PoseLandmark[][],
          segmentationMasks?: ImageData[],
          handLandmarks?: HandLandmark[][] // Aggiungo landmark mano
        }
        
        if (resultsObj.landmarks && resultsObj.landmarks.length > 0) {
          const landmarks = resultsObj.landmarks[0]
          const worldLandmarks = resultsObj.worldLandmarks[0]

          // Calculate confidence
          const visibilityScores = landmarks
            .map((landmark: PoseLandmark) => landmark.visibility || 0)
            .filter((v: number) => v > 0)
          const avgConfidence = visibilityScores.length > 0
            ? visibilityScores.reduce((a: number, b: number) => a + b, 0) / visibilityScores.length
            : 0

          // Throttled drawing per performance
          drawingCountRef.current++
          if (drawingCountRef.current % config.DRAWING_THROTTLE === 0) {
            drawPoseLandmarksOptimized(ctx, landmarks, canvas.width, canvas.height, avgConfidence)
          }

          // Update stats - OTTIMIZZATO
          frameCountRef.current++
          if (frameCountRef.current % 30 === 0) { // Aggiorna stats ogni 30 frame invece che ogni secondo
            const timeDiff = now - lastFrameTimeRef.current
            const fps = timeDiff > 0 ? Math.round((30 * 1000) / timeDiff) : 0
            setStats(prev => ({
              fps,
              detectionTime: Math.round(detectionTime * 10) / 10,
              totalDetections: prev.totalDetections + 1,
              averageConfidence: Math.round(avgConfidence * 1000) / 10,
              droppedFrames: prev.droppedFrames
            }))
            lastFrameTimeRef.current = now
          }

          // Prepara risultato per callback
          const result: PoseDetectionResult = {
            landmarks,
            worldLandmarks,
            segmentationMasks: resultsObj.segmentationMasks,
            handLandmarks: undefined
          }

          // Se l'esercizio richiede landmark della mano, esegue anche la detection delle mani e combina
          const needsHand = !!(activeLandmarks && Object.keys(activeLandmarks).some(key => parseInt(key) >= 0 && parseInt(key) <= 20))
          
          if (needsHand && !handDetectorRef.current) {
            // Se serve Hands ma non è inizializzato, aspetta il prossimo frame
            if (isDetecting) {
              animationFrameRef.current = requestAnimationFrame(processFrame)
            }
            return
          }
          
          if (needsHand && handDetectorRef.current) {
            try {
              const handDetector = handDetectorRef.current
              
              if (handDetector && typeof handDetector === 'object' && 'detectForVideo' in handDetector) {
                const handDetectorWithMethod = handDetector as { detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown }
                const handResultsUnknown = handDetectorWithMethod.detectForVideo(videoElement, now)
                
                if (handResultsUnknown && typeof handResultsUnknown === 'object' && 'landmarks' in handResultsUnknown) {
                  const handResults = handResultsUnknown as { landmarks?: HandLandmark[][] }
                  
                  if (handResults.landmarks && handResults.landmarks.length > 0) {
                    const firstHand = handResults.landmarks[0] || []
                    console.log('✅ Landmark mano rilevati:', firstHand.length)
                    
                    result.handLandmarks = handResults.landmarks
                    const combinedLandmarks = [...landmarks, ...firstHand]
                    result.landmarks = combinedLandmarks
                    
                    console.log('✅ Landmark combinati: corpo(' + landmarks.length + ') + mano(' + firstHand.length + ') = ' + combinedLandmarks.length)
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Errore rilevamento mani:', e)
            }
          }

          // Callback con risultato
          if (onPoseDetected) {
            onPoseDetected(result)
          }

          // Process for recording if enabled
          if (shouldUseRecording && recording && recording.isRecording && !recording.isPaused) {
            recording.processFrame({
              poseLandmarks: landmarks,
              worldLandmarks: worldLandmarks,
              confidence: avgConfidence
            })
          }
        }
      }

      // Schedule next frame
      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(processFrame)
      }

    } catch (err) {
      console.error('Errore processing frame:', err)
      setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }))
      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(processFrame)
      }
    }
  }, [videoElement, isDetecting, onPoseDetected, shouldUseRecording, recording, activeLandmarks])


  // Toggle detection
  const toggleDetection = useCallback(() => {
    if (!isInitialized) return
    
    if (isDetecting) {
      setIsDetecting(false)
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    } else {
      setIsDetecting(true)
    }
  }, [isInitialized, isDetecting])

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (!shouldUseRecording || !recording) return
    await recording.startRecording()
  }, [shouldUseRecording, recording])

  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    if (!shouldUseRecording || !recording) return
    await recording.stopRecording()
    if (recording.sessionId && onSessionComplete) {
      onSessionComplete(recording.sessionId)
    }
  }, [shouldUseRecording, recording, onSessionComplete])

  // Reset stats
  const resetStats = useCallback(() => {
    setStats({
      fps: 0,
      detectionTime: 0,
      totalDetections: 0,
      averageConfidence: 0,
      droppedFrames: 0
    })
    frameCountRef.current = 0
    drawingCountRef.current = 0
    lastFrameTimeRef.current = 0
  }, [])

  // Effects
  useEffect(() => {
    if (videoElement && !isInitialized) {
      initializePoseDetection()
    }
  }, [videoElement, isInitialized, initializePoseDetection])

  // Inizializza Hands quando servono landmark mano
  useEffect(() => {
    const needsHand = !!(activeLandmarks && Object.keys(activeLandmarks).some(key => parseInt(key) >= 0 && parseInt(key) <= 20))
    
    if (needsHand && !handDetectorRef.current) {
      console.log('🚀 Inizializzo MediaPipe Hands...')
      initializeHandsDetection().then(() => {
        console.log('✅ MediaPipe Hands pronto!')
      }).catch(err => {
        console.error('❌ Errore Hands:', err)
      })
    }
  }, [activeLandmarks, initializeHandsDetection])

  useEffect(() => {
    if (isActive && isInitialized && !isDetecting) {
      setIsDetecting(true)
    } else if (!isActive && isDetecting) {
      setIsDetecting(false)
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }
  }, [isActive, isInitialized, isDetecting])

  useEffect(() => {
    if (isDetecting && videoElement && poseDetectorRef.current && canvasRef.current) {
      lastFrameTimeRef.current = performance.now()
      // Avvia il loop solo se non è già attivo
      if (!animationFrameRef.current) {
        processFrame()
      }
    } else if (!isDetecting && animationFrameRef.current) {
      // Ferma il loop quando isDetecting diventa false
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
  }, [isDetecting, videoElement]) // Rimosso processFrame dalle dipendenze

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Show recording error
  useEffect(() => {
    if (shouldUseRecording && recording?.error) {
      toast.error(recording.error)
    }
  }, [shouldUseRecording, recording?.error])

  return (
    <Card className="border-0" style={{ border: 'none !important', outline: 'none !important' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Pose Detection</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Performance Mode */}
            <select
              value={performanceMode}
              onChange={(e) => setPerformanceMode(e.target.value as 'high' | 'balanced' | 'fast')}
              className="text-xs px-2 py-1 rounded border-0"
              style={{ border: 'none !important', outline: 'none !important', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              disabled={recording?.isRecording}
            >
              <option value="high">High Quality</option>
              <option value="balanced">Balanced</option>
              <option value="fast">Fast</option>
            </select>

            {/* Recording Badge */}
            {shouldUseRecording && recording?.isRecording && (
              <Badge variant={recording.isPaused ? "secondary" : "destructive"}>
                {recording.isPaused ? 'In Pausa' : 'Registrando'}
                <Database className="h-3 w-3 ml-1" />
              </Badge>
            )}

            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
              isDetecting
                ? 'bg-green-100 text-green-800'
                : isInitialized
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`} style={{ border: 'none !important', outline: 'none !important' }}>
              {isDetecting ? (
                <>
                  <Zap className="h-3 w-3 mr-1 inline" />
                  Attivo ({stats.fps} FPS)
                </>
              ) : isInitialized ? (
                <>
                  <Target className="h-3 w-3 mr-1 inline" />
                  Pronto
                </>
              ) : (
                'Inizializzazione...'
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Canvas per visualizzazione */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-96 object-cover"
            style={{ imageRendering: 'auto' }}
          />
          
          {/* Performance overlay */}
          {isDetecting && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {stats.fps} FPS | {stats.detectionTime}ms | {stats.averageConfidence}%
            </div>
          )}

          {/* Recording overlay */}
          {shouldUseRecording && recording?.isRecording && (
            <div className="absolute top-2 left-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {recording.formattedDuration} | {recording.frameCount} frames
            </div>
          )}
        </div>

        {/* Enhanced Stats + Metrics */}
        {isDetecting && (
          <>
            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">FPS:</span>
                <span className={`ml-2 font-mono ${stats.fps >= 20 ? 'text-green-600' : stats.fps >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.fps}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Detection:</span>
                <span className="ml-2 font-mono">{stats.detectionTime}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <span className="ml-2 font-mono">{stats.averageConfidence}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-mono">{stats.totalDetections}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dropped:</span>
                <span className="ml-2 font-mono">{stats.droppedFrames}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mode:</span>
                <span className="ml-2 font-mono capitalize">{performanceMode}</span>
              </div>
            </div>

            {/* Real-time Metrics (se recording attivo) */}
            {shouldUseRecording && recording?.isRecording && recording.currentMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Card className="p-3 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-medium">ROM Spalla</h5>
                    <BarChart className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>SX</span>
                      <span className="font-mono">{Math.round(recording.currentMetrics.rom.shoulderLeft)}°</span>
                    </div>
                    <Progress value={recording.currentMetrics.rom.shoulderLeft / 180 * 100} className="h-1" />
                  </div>
                </Card>

                <Card className="p-3 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-medium">Velocità</h5>
                    <Zap className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-mono">
                    {recording.currentMetrics.velocity.avgVelocity.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">px/s</div>
                </Card>

                <Card className="p-3 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-medium">Stabilità</h5>
                    <Target className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-mono">
                    {Math.round(recording.currentMetrics.stability.balanceScore)}
                  </div>
                  <Progress value={recording.currentMetrics.stability.balanceScore} className="h-1 mt-1" />
                </Card>

                <Card className="p-3 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-medium">Simmetria</h5>
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-mono">
                    {Math.round(recording.currentMetrics.symmetry.overall)}%
                  </div>
                  <Progress value={recording.currentMetrics.symmetry.overall} className="h-1 mt-1" />
                </Card>
              </div>
            )}
          </>
        )}

        {/* Controlli */}
        <div className="flex gap-2">
          <Button 
            onClick={toggleDetection}
            disabled={!isInitialized || !videoElement}
            className="flex-1"
            variant={isDetecting ? "destructive" : "default"}
          >
            {isDetecting ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Detection
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Detection
              </>
            )}
          </Button>

          {/* Recording Controls (se abilitati) */}
          {shouldUseRecording && isDetecting && (
            <>
              {!recording?.isRecording ? (
                <Button onClick={handleStartRecording} variant="default">
                  <Database className="h-4 w-4 mr-2" />
                  Inizia Registrazione
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => recording.togglePause()}
                    variant="outline"
                  >
                    {recording.isPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Termina
                  </Button>
                </>
              )}
            </>
          )}
          
          <Button 
            onClick={resetStats}
            variant="outline"
            size="icon"
            disabled={!isDetecting}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Errori */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info */}
        {!videoElement && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              In attesa del video stream per iniziare la pose detection.
            </AlertDescription>
          </Alert>
        )}

        {/* Recording Info */}
        {enableRecording && !pazienteId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Per abilitare la registrazione dei dati, è necessario specificare un ID paziente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}