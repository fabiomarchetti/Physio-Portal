'use client'

import { useState, useEffect, useCallback } from 'react'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'
import { PoseOverlay } from '@/components/computer-vision/PoseOverlay'
import { PoseLegend } from '@/components/computer-vision/PoseLegend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  BarChart3, 
  Users, 
  Clock,
  Target,
  Activity,
  Monitor,
  MessageSquare
} from 'lucide-react'

// Landmark per tutto il corpo (fallback)
const POSE_LANDMARKS = {
  // Testa
  0: 'Naso', 1: 'Occhio sinistro interno', 2: 'Occhio sinistro', 3: 'Occhio sinistro esterno',
  4: 'Occhio destro interno', 5: 'Occhio destro', 6: 'Occhio destro esterno', 7: 'Orecchio sinistro',
  8: 'Orecchio destro', 9: 'Bocca sinistra', 10: 'Bocca destra',
  // Torso e braccia
  11: 'Spalla sinistra', 12: 'Spalla destra', 13: 'Gomito sinistro', 14: 'Gomito destro', 
  15: 'Polso sinistro', 16: 'Polso destro', 17: 'Mignolo sinistro', 18: 'Mignolo destro', 
  19: 'Indice sinistro', 20: 'Indice destro', 21: 'Pollice sinistro', 22: 'Pollice destro',
  // Gambe
  23: 'Anca sinistra', 24: 'Anca destra', 25: 'Ginocchio sinistro', 26: 'Ginocchio destro', 
  27: 'Caviglia sinistra', 28: 'Caviglia destra', 29: 'Tallone sinistro', 30: 'Tallone destro', 
  31: 'Alluce sinistro', 32: 'Alluce destro'
}

// Landmark per la mano (con mappatura numerica per evitare conflitti)
const HAND_LANDMARKS = {
  100: 'Polso', 101: 'Pollice metacarpo', 102: 'Pollice falange prossimale', 
  103: 'Pollice falange intermedia', 104: 'Pollice falange distale',
  105: 'Indice metacarpo', 106: 'Indice falange prossimale', 107: 'Indice falange intermedia', 
  108: 'Indice falange distale', 109: 'Medio metacarpo', 110: 'Medio falange prossimale', 
  111: 'Medio falange intermedia', 112: 'Medio falange distale', 113: 'Anulare metacarpo', 
  114: 'Anulare falange prossimale', 115: 'Anulare falange intermedia', 116: 'Anulare falange distale',
  117: 'Mignolo metacarpo', 118: 'Mignolo falange prossimale', 119: 'Mignolo falange intermedia', 
  120: 'Mignolo falange distale'
}

// Connessioni per il corpo
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [27, 31], [24, 26], [26, 28], [28, 30], [28, 32],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22], [13, 15], [14, 16]
]

// Connessioni per la mano (con mappatura numerica)
const HAND_CONNECTIONS = [
  [100, 101], [101, 102], [102, 103], [103, 104], [100, 105], [105, 106], 
  [106, 107], [107, 108], [100, 109], [109, 110], [110, 111], [111, 112], 
  [100, 113], [113, 114], [114, 115], [115, 116], [100, 117], 
  [117, 118], [118, 119], [119, 120]
]

interface TherapistViewProps {
  sessionId: string
  esercizio?: {
    id_esercizio: number
    nome_esercizio: string
    descrizione_esecuzione: string
    note?: string
    landmark?: number[]
    id_categoria: number
  } | null
}

interface PoseDetectionResult {
  landmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  worldLandmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  segmentationMasks?: ImageData[]
}

export default function TherapistView({ sessionId, esercizio }: TherapistViewProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [currentExercise, setCurrentExercise] = useState(
    esercizio ? esercizio.nome_esercizio : 'Valutazione iniziale'
  )
  const [sessionDuration, setSessionDuration] = useState(0)
  const [patientFeedback, setPatientFeedback] = useState('')
  const [currentPose, setCurrentPose] = useState<PoseDetectionResult | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [forceColorMode, setForceColorMode] = useState(false)
  const [showLines, setShowLines] = useState(false) // Toggle per mostrare/nascondere le linee
  const [activeLandmarks, setActiveLandmarks] = useState<{[key: number]: string}>({})
  const [activeConnections, setActiveConnections] = useState<number[][]>([])
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    aspectRatio: 0,
    pixelRatio: 1,
    isTouch: false,
    orientation: 'landscape' as 'landscape' | 'portrait'
  })

  // Timer per durata sessione
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isSessionActive])

  // Determina i landmark attivi in base all'esercizio
  useEffect(() => {
    if (esercizio) {
      let landmarks: {[key: number]: string} = {}
      let connections: number[][] = []
      
      if (esercizio.landmark && esercizio.landmark.length > 0) {
        // Usa i landmark configurati per l'esercizio
        console.log('🔍 DEBUG TherapistView: Processando landmark configurati:', esercizio.landmark)
        
        esercizio.landmark.forEach(id => {
          console.log(`🔍 DEBUG TherapistView: Processando landmark ${id}`)
          
          if (HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS]) {
            // CORREZIONE: Mappa da 100-120 a 0-20 per MediaPipe
            const mappedId = id - 100
            landmarks[mappedId] = HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS]
            console.log(`✅ DEBUG TherapistView: Landmark ${id} mappato a ${mappedId} come mano:`, HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS])
          } else if (POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]) {
            landmarks[id] = POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]
            console.log(`✅ DEBUG TherapistView: Landmark ${id} mappato a ${id} come corpo:`, POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS])
          } else {
            console.log(`⚠️ DEBUG TherapistView: Landmark ${id} non trovato in nessuna mappa`)
          }
        })
        
        console.log('🔍 DEBUG TherapistView: Landmarks processati:', landmarks)
        console.log('🔍 DEBUG TherapistView: Chiavi landmark attive:', Object.keys(landmarks))
        console.log('🔍 DEBUG TherapistView: Range landmark:', {
          min: Math.min(...Object.keys(landmarks).map(k => parseInt(k))),
          max: Math.max(...Object.keys(landmarks).map(k => parseInt(k)))
        })
        
        // Determina se è un esercizio per la mano o per il corpo
        const hasHandLandmarks = esercizio.landmark.some(id => id >= 100)
        const hasBodyLandmarks = esercizio.landmark.some(id => id >= 0 && id <= 32)
        
        console.log('🔍 DEBUG TherapistView: Analisi tipo esercizio:', {
          hasHandLandmarks,
          hasBodyLandmarks,
          landmarkRange: {
            min: Math.min(...esercizio.landmark),
            max: Math.max(...esercizio.landmark)
          }
        })
        
        if (hasHandLandmarks) {
          console.log('🔍 DEBUG TherapistView: Esercizio mano con landmark specifici configurati')
        } else if (hasBodyLandmarks) {
          console.log('🔍 DEBUG TherapistView: Esercizio corpo con landmark specifici configurati')
        }
        
        // Per esercizi mano, usa SOLO i landmark configurati, non tutti
        if (esercizio.landmark.some(id => id >= 100)) {
          console.log('🔍 DEBUG TherapistView: Esercizio mano con landmark specifici configurati')
          // NON aggiungere tutti i landmark della mano, usa solo quelli configurati
          // Questo evita di mostrare punti non necessari per l'esercizio specifico
        }
        
        // Determina le connessioni in base ai landmark attivi
        if (hasHandLandmarks) {
          // Per esercizi mano, usa solo le connessioni tra i landmark configurati
          console.log('🔍 DEBUG TherapistView: Esercizio mano, creo connessioni solo tra landmark configurati')
          
          // Filtra le connessioni della mano per usare solo quelle tra landmark configurati
          const configuredHandLandmarks = esercizio.landmark.filter(id => id >= 100).map(id => id - 100)
          connections = HAND_CONNECTIONS.filter(conn => 
            configuredHandLandmarks.includes(conn[0] - 100) && configuredHandLandmarks.includes(conn[1] - 100)
          ).map(conn => [conn[0] - 100, conn[1] - 100])
          
          console.log('🔗 DEBUG TherapistView: Connessioni mano filtrate per landmark configurati:', connections.length)
        } else if (hasBodyLandmarks) {
          // Per esercizi corpo, usa solo le connessioni tra i landmark configurati
          console.log('🔍 DEBUG TherapistView: Esercizio corpo, creo connessioni solo tra landmark configurati')
          
          // DEBUG: Verifica quali landmark sono configurati per il corpo
          const bodyLandmarks = esercizio.landmark.filter(id => id >= 0 && id <= 32)
          console.log('🔍 DEBUG TherapistView: Landmark corpo configurati:', bodyLandmarks)
          
          connections = POSE_CONNECTIONS.filter(conn => 
            esercizio.landmark!.includes(conn[0]) && esercizio.landmark!.includes(conn[1])
          )
          
          console.log('🔗 DEBUG TherapistView: Connessioni corpo filtrate per landmark configurati:', connections.length)
          console.log('🔗 DEBUG TherapistView: Connessioni trovate:', connections)
        }
      } else {
        // Fallback: determina in base al nome della categoria
        const categoriaNome = esercizio.nome_esercizio.toLowerCase()
        console.log('🔍 DEBUG TherapistView: Fallback - analisi nome esercizio:', {
          nome: esercizio.nome_esercizio,
          categoriaNome,
          isHand: categoriaNome.includes('mano'),
          isBody: categoriaNome.includes('spalla') || categoriaNome.includes('gomito') || categoriaNome.includes('anca') || categoriaNome.includes('ginocchio') || categoriaNome.includes('polso') || categoriaNome.includes('cervicale') || categoriaNome.includes('lombare')
        })
        
        if (categoriaNome.includes('mano')) {
          console.log('🔍 DEBUG TherapistView: Nome indica esercizio mano, uso landmark mano')
          // Esercizi per la mano: usa tutti i landmark della mano
          landmarks = HAND_LANDMARKS
          connections = HAND_CONNECTIONS
        } else if (categoriaNome.includes('spalla') || categoriaNome.includes('gomito') || categoriaNome.includes('anca') || categoriaNome.includes('ginocchio') || categoriaNome.includes('polso') || categoriaNome.includes('cervicale') || categoriaNome.includes('lombare')) {
          console.log('🔍 DEBUG TherapistView: Nome indica esercizio corpo, uso landmark corpo')
          // Esercizi per il corpo: usa tutti i landmark del corpo
          landmarks = POSE_LANDMARKS
          // CORREZIONE: Per la pagina di test, non mostrare linee per evitare confusione
          connections = []
        } else {
          console.log('🔍 DEBUG TherapistView: Nome non specifico, default a corpo')
          // Default: usa tutti i landmark del corpo
          landmarks = POSE_LANDMARKS
          // CORREZIONE: Per la pagina di test, non mostrare linee per evitare confusione
          connections = []
        }
      }
      
      // OPZIONE: Mostra solo i punti senza linee per maggiore chiarezza
      // Per disabilitare le linee e mostrare solo i punti, decommenta la riga sotto:
      // connections = [] // Solo punti, nessuna linea
      
      // Toggle per mostrare/nascondere le linee
      if (!showLines) {
        connections = [] // Nascondi linee se showLines è false
      }
      
      setActiveLandmarks(landmarks)
      setActiveConnections(connections)
      console.log('🎯 Landmark attivi per esercizio (Therapist):', { landmarks, connections })
    }
  }, [esercizio])

  // Mappa i landmark rilevati da MediaPipe ai nostri ID personalizzati
  const mapDetectedLandmarks = useCallback((detectedLandmarks: any[]) => {
    console.log('🔍 DEBUG TherapistView: Landmark rilevati da MediaPipe:', {
      total: detectedLandmarks.length,
      firstFew: detectedLandmarks.slice(0, 5),
      hasHandLandmarks: Object.keys(activeLandmarks).some(key => parseInt(key) >= 0 && parseInt(key) <= 20)
    })

    if (!activeLandmarks || Object.keys(activeLandmarks).length === 0) {
      return detectedLandmarks
    }

    // Se abbiamo landmark della mano (>= 0 e <= 20), mappa da MediaPipe 0-20 a nostri 0-20
    const hasHandLandmarks = Object.keys(activeLandmarks).some(key => parseInt(key) >= 0 && parseInt(key) <= 20)
    
    if (hasHandLandmarks) {
      console.log('🎯 DEBUG TherapistView: Esercizio usa landmark mano, mappando...')
      
      // Ora PoseDetection combina automaticamente pose + mano
      // I landmark della mano sono nelle posizioni 33-53 (dopo i 33 del corpo)
      const bodyLandmarks = detectedLandmarks.slice(0, 33)
      const handLandmarks = detectedLandmarks.slice(33, 54) // 21 landmark mano
      
      console.log('🔍 DEBUG TherapistView: Landmark separati:', {
        bodyCount: bodyLandmarks.length,
        handCount: handLandmarks.length,
        handLandmarks: handLandmarks.slice(0, 3)
      })
      
      // Mappa i landmark della mano da 0-20 a 0-20 (nessuna mappatura necessaria)
      const mappedHandLandmarks = handLandmarks.map((landmark, index) => ({
        ...landmark,
        originalIndex: index,
        mappedIndex: index // Nessuna mappatura, usa direttamente 0-20
      }))
      
      console.log('🎯 DEBUG TherapistView: Landmark mano mappati:', {
        mappedCount: mappedHandLandmarks.length,
        firstMapped: mappedHandLandmarks[0]
      })
      
      // Combina corpo + mano mappata
      const result = [...bodyLandmarks, ...mappedHandLandmarks]
      console.log('🎯 DEBUG TherapistView: Risultato finale:', {
        totalResult: result.length,
        hasMappedHand: result.some(l => (l as any).mappedIndex >= 0 && (l as any).mappedIndex <= 20)
      })
      
      return result
    }
    
    return detectedLandmarks
  }, [activeLandmarks])

  const handlePoseDetected = (result: PoseDetectionResult) => {
    // PoseDetection già combina corpo + mano, non serve rimappare
    setCurrentPose(result)
    console.log('🎯 THERAPIST VIEW - Pose detected:', {
      landmarksCount: result.landmarks?.length || 0,
      confidence: result.landmarks ? result.landmarks.reduce((acc, landmark) => acc + (landmark.visibility || 0), 0) / result.landmarks.length : 0,
      firstLandmark: result.landmarks?.[0] ? { x: result.landmarks[0].x, y: result.landmarks[0].y } : null
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleSession = async () => {
    if (isSessionActive) {
      // STOP: Ferma webcam e pose detection
      setIsSessionActive(false)
      
      // Ferma lo stream della webcam
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop()
          console.log('📹 Track fermato:', track.kind)
        })
        setMediaStream(null)
      }
      
      // Pulisci il video element
      if (videoElement) {
        videoElement.srcObject = null
      }
      
      console.log('🛑 Webcam e pose detection fermati')
      
    } else {
      // START: Riavvia webcam e pose detection
      if (videoElement && screenInfo.width > 0) {
        try {
          const videoSettings = getOptimalVideoSettings()
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoSettings,
            audio: false
          })
          
          videoElement.srcObject = stream
          await videoElement.play()
          setMediaStream(stream)
          setIsSessionActive(true)
          
          console.log('▶️ Webcam riavviata con impostazioni:', videoSettings)
          
        } catch (err) {
          console.error('❌ Errore riavvio webcam:', err)
          // Fallback
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: false
            })
            
            videoElement.srcObject = stream
            await videoElement.play()
            setMediaStream(stream)
            setIsSessionActive(true)
            
          } catch (fallbackErr) {
            console.error('❌ Errore fallback webcam:', fallbackErr)
          }
        }
      }
    }
  }

  const sendFeedbackToPatient = (message: string) => {
    setPatientFeedback(message)
    // Qui invieremo il feedback via WebSocket
    console.log('Sending feedback to patient:', message)
  }

  // Rilevamento caratteristiche schermo per vista fisioterapista
  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspectRatio = width / height
      const pixelRatio = window.devicePixelRatio || 1
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const orientation = width > height ? 'landscape' : 'portrait'

      setScreenInfo({
        width,
        height,
        aspectRatio,
        pixelRatio,
        isTouch,
        orientation
      })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenInfo, 100)
    })

    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [])

  // Cleanup webcam quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop()
          console.log('🧹 Cleanup: Track fermato:', track.kind)
        })
      }
    }
  }, [mediaStream])

  // Impostazioni video ottimali per fisioterapista (risoluzione più bassa per performance)
  const getOptimalVideoSettings = useCallback(() => {
    const { width, pixelRatio } = screenInfo
    
    let idealWidth = 1280
    let idealHeight = 720
    
    // Per fisioterapista usiamo risoluzioni più conservative per performance
    if (width >= 2560) {
      idealWidth = 1280
      idealHeight = 720
    } else if (width >= 1920) {
      idealWidth = 1280
      idealHeight = 720
    } else if (width <= 1024) {
      idealWidth = 640
      idealHeight = 480
    }

    return {
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    }
  }, [screenInfo])

  return (
    <div className="h-screen flex bg-gray-50 therapist-view border-0" style={{ border: 'none !important', outline: 'none !important' }}>
      {/* Lato sinistro - Video del paziente (2/3 - 66.67%) */}
      <div className="w-2/3 bg-black relative therapist-video-panel border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        {/* Header video */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-semibold">Vista Paziente</h2>
              <p className="text-sm text-gray-300">Sessione ID: {sessionId}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={isSessionActive ? "destructive" : "secondary"}>
                {isSessionActive ? 'ATTIVA' : 'IN PAUSA'}
              </Badge>
              <div className="text-right">
                <div className="text-lg font-mono">{formatTime(sessionDuration)}</div>
                <div className="text-xs text-gray-300">Durata</div>
              </div>
            </div>
          </div>
        </div>

        {/* Area video */}
        <div className="h-full relative bg-black overflow-hidden border-0" style={{ border: 'none !important', outline: 'none !important' }}>
          {/* Video element diretto per il fisioterapista */}
          <video
            ref={(video) => {
              if (video && !videoElement) {
                console.log('🎥 Inizializzazione webcam therapist...')
                // Avvia webcam immediatamente come nella vista paziente
                navigator.mediaDevices.getUserMedia({
                  video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  },
                  audio: false
                }).then(stream => {
                  video.srcObject = stream
                  video.play()
                  setVideoElement(video)
                  setMediaStream(stream)
                  console.log('✅ Webcam therapist avviata!')
                }).catch(err => {
                  console.error('❌ Errore webcam therapist:', err)
                  // Fallback con impostazioni minime
                  navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                  }).then(stream => {
                    video.srcObject = stream
                    video.play()
                    setVideoElement(video)
                    setMediaStream(stream)
                    console.log('✅ Webcam therapist avviata (fallback)')
                  }).catch(fallbackErr => {
                    console.error('❌ Errore fallback webcam therapist:', fallbackErr)
                  })
                })
              }
            }}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            style={{ transform: 'scaleX(-1)', zIndex: 1 }}
          />

          {/* Pose detection (nascosto) + Overlay visibile */}
          {videoElement && (
            <>
              {/* PoseDetection nascosto per il rilevamento */}
              <div className="absolute inset-0 w-full h-full pose-landmarks" style={{ opacity: 0, pointerEvents: 'none' }}>
                <PoseDetection
                  videoElement={videoElement}
                  onPoseDetected={handlePoseDetected}
                  isActive={isSessionActive}
                  enableRecording={true}
                  pazienteId="therapist-view"
                  tipoEsercizio={currentExercise}
                  obiettivi="Miglioramento mobilità spalla destra"
                  activeLandmarks={activeLandmarks}
                  activeConnections={activeConnections}
                />
              </div>
              
              {/* Overlay visibile con punti colorati - CACHE REFRESH */}
              {currentPose && currentPose.landmarks && (
                <PoseOverlay
                  landmarks={currentPose.landmarks}
                  videoElement={videoElement}
                  confidence={currentPose.landmarks.reduce((acc, landmark) => acc + (landmark.visibility || 0), 0) / currentPose.landmarks.length}
                  className="pose-overlay therapist-overlay"
                  activeLandmarks={activeLandmarks}
                  activeConnections={
                    showLines 
                      ? (activeConnections.length > 0 
                          ? activeConnections 
                          : POSE_CONNECTIONS)
                      : []
                  }
                  disableBodyFallback={Object.keys(activeLandmarks).some(k => parseInt(k) >= 0 && parseInt(k) <= 20)}
                />
              )}
              
              
            </>
          )}
        </div>

        {/* Pulsante Start/Stop nella parte destra del video */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2" style={{ zIndex: 50 }}>
          <Button
            onClick={toggleSession}
            variant={isSessionActive ? "destructive" : "default"}
            size="lg"
            className="shadow-2xl bg-white/90 hover:bg-white text-black border-2 border-gray-300"
          >
            {isSessionActive ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Stop Cattura
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Cattura
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lato destro - Controlli e Analytics (1/3 - 33.33%) */}
      <div className="w-1/3 flex flex-col therapist-controls-panel border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        {/* Header controlli */}
        <div className="bg-white p-4 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pannello Fisioterapista</h1>
              <p className="text-gray-600">Controllo sessione e monitoraggio real-time</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Impostazioni
              </Button>
            </div>
          </div>
        </div>

        {/* Contenuto principale con tabs */}
        <div className="flex-1 p-4 overflow-auto">
          <Tabs defaultValue="controls" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="controls">
                <Target className="h-4 w-4 mr-2" />
                Controlli
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="patient">
                <Users className="h-4 w-4 mr-2" />
                Paziente
              </TabsTrigger>
              <TabsTrigger value="session">
                <Clock className="h-4 w-4 mr-2" />
                Sessione
              </TabsTrigger>
            </TabsList>

            {/* Tab Controlli */}
            <TabsContent value="controls" className="space-y-4 mt-4">
              {/* Legenda colori parti del corpo */}
              <PoseLegend className="mb-4" />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Controllo Esercizio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informazioni esercizio se disponibile */}
                  {esercizio && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Esercizio Configurato: {esercizio.nome_esercizio}
                      </h4>
                      {esercizio.descrizione_esecuzione && (
                        <p className="text-sm text-blue-800 mb-2">
                          {esercizio.descrizione_esecuzione}
                        </p>
                      )}
                      {esercizio.landmark && esercizio.landmark.length > 0 && (
                        <p className="text-sm text-blue-700">
                          <strong>Landmarks:</strong> {esercizio.landmark.length} punti configurati
                        </p>
                      )}
                      {esercizio.note && (
                        <p className="text-sm text-blue-700 italic">
                          <strong>Note:</strong> {esercizio.note}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">Esercizio Corrente</label>
                    <select
                      className="w-full mt-1 p-2 rounded-md border-0"
                      style={{ border: 'none !important', outline: 'none !important', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                      value={currentExercise}
                      onChange={(e) => setCurrentExercise(e.target.value)}
                    >
                      <option value="Valutazione iniziale">Valutazione iniziale</option>
                      <option value="Mobilità spalle">Mobilità spalle</option>
                      <option value="Flessione gomiti">Flessione gomiti</option>
                      <option value="Equilibrio statico">Equilibrio statico</option>
                      <option value="Coordinazione">Coordinazione</option>
                    </select>
                  </div>
                  
                  {/* Toggle per forzare modalità colore */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-yellow-800">Modalità Video</label>
                      <p className="text-xs text-yellow-700 mt-1">
                        💡 Forza i colori anche con poca luce
                      </p>
                    </div>
                    <button
                      onClick={() => setForceColorMode(!forceColorMode)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        forceColorMode 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      }`}
                    >
                      {forceColorMode ? '🎨 Colore' : '⚫ Auto'}
                    </button>
                  </div>
                  
                  {/* Toggle per mostrare/nascondere le linee */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-blue-800">Visualizzazione Linee</label>
                      <p className="text-xs text-blue-700 mt-1">
                        📏 Mostra/nascondi le connessioni tra i punti
                      </p>
                    </div>
                    <button
                      onClick={() => setShowLines(!showLines)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        showLines 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      }`}
                    >
                      {showLines ? '📏 Linee ON' : '📏 Linee OFF'}
                    </button>
                  </div>

                  <div className="therapist-quick-actions">
                    <Button
                      onClick={() => sendFeedbackToPatient('Ottimo! Continua così!')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      👍 Bravo!
                    </Button>
                    <Button
                      onClick={() => sendFeedbackToPatient('Alza un po\' di più il braccio')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      ⚠️ Correggi
                    </Button>
                    <Button
                      onClick={() => sendFeedbackToPatient('Mantieni la posizione')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      ⏸️ Mantieni
                    </Button>
                    <Button
                      onClick={() => sendFeedbackToPatient('Rilassati e riposa')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      😌 Riposa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Feedback Personalizzato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Scrivi un messaggio per il paziente..."
                      className="flex-1 p-2 rounded-md border-0"
                      style={{ border: 'none !important', outline: 'none !important', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          sendFeedbackToPatient(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button>Invia</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Analytics */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ROM Spalla Destra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142°</div>
                    <Progress value={78} className="mt-2" />
                    <p className="text-xs text-gray-600 mt-1">78% del target</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Stabilità</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <Progress value={85} className="mt-2" />
                    <p className="text-xs text-gray-600 mt-1">Buona stabilità</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Simmetria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">92%</div>
                    <Progress value={92} className="mt-2" />
                    <p className="text-xs text-gray-600 mt-1">Ottima simmetria</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fluidità</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">76%</div>
                    <Progress value={76} className="mt-2" />
                    <p className="text-xs text-gray-600 mt-1">Da migliorare</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Paziente */}
            <TabsContent value="patient" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Paziente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-lg">Mario Rossi</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Condizione</label>
                    <p>Riabilitazione post-operatoria spalla destra</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Obiettivi</label>
                    <p>Recupero ROM completo, miglioramento forza</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Sessione */}
            <TabsContent value="session" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli Sessione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Durata:</span>
                    <span className="font-mono">{formatTime(sessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Esercizi completati:</span>
                    <span>3/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qualità movimento:</span>
                    <Badge variant="secondary">Buona</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}