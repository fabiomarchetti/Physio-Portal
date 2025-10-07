'use client'

import { useState, useEffect, useCallback } from 'react'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'
import { PoseOverlay } from '@/components/computer-vision/PoseOverlay'
import { PoseLegend } from '@/components/computer-vision/PoseLegend'

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

interface PatientViewProps {
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

export default function PatientView({ sessionId, esercizio }: PatientViewProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [currentExercise, setCurrentExercise] = useState<string>(
    esercizio ? esercizio.nome_esercizio : 'In attesa di istruzioni...'
  )
  const [feedback, setFeedback] = useState<string>('')
  const [feedbackColor, setFeedbackColor] = useState<'green' | 'yellow' | 'red'>('green')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [showLines, setShowLines] = useState(false) // Toggle per mostrare/nascondere le linee
  const [currentPose, setCurrentPose] = useState<PoseDetectionResult | null>(null)
  const [forceColorMode, setForceColorMode] = useState(false)
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

  // Simula feedback real-time (poi sarà sostituito con WebSocket)
  useEffect(() => {
    const feedbackMessages = [
      { text: 'Ottimo! Continua così!', color: 'green' as const },
      { text: 'Alza un po\' di più il braccio destro', color: 'yellow' as const },
      { text: 'Perfetto! Movimento fluido', color: 'green' as const },
      { text: 'Mantieni la posizione per 3 secondi', color: 'yellow' as const }
    ]

    const interval = setInterval(() => {
      const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]
      setFeedback(randomFeedback.text)
      setFeedbackColor(randomFeedback.color)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Determina i landmark attivi in base all'esercizio
  useEffect(() => {
    if (esercizio) {
      console.log('🔍 DEBUG PatientView: Esercizio ricevuto:', {
        id: esercizio.id_esercizio,
        nome: esercizio.nome_esercizio,
        landmark: esercizio.landmark,
        landmarkLength: esercizio.landmark?.length || 0
      })
      
      let landmarks: {[key: number]: string} = {}
      let connections: number[][] = []
      
      if (esercizio.landmark && esercizio.landmark.length > 0) {
        
        // Usa i landmark configurati per l'esercizio
        console.log('🔍 DEBUG PatientView: Processando landmark configurati:', esercizio.landmark)
        
        esercizio.landmark.forEach(id => {
          console.log(`🔍 DEBUG PatientView: Processando landmark ${id}`)
          
          if (HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS]) {
            // CORREZIONE: Mappa da 100-120 a 0-20 per MediaPipe
            const mappedId = id - 100
            landmarks[mappedId] = HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS]
            console.log(`✅ DEBUG PatientView: Landmark ${id} mappato a ${mappedId} come mano:`, HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS])
          } else if (POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]) {
            landmarks[id] = POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]
            console.log(`✅ DEBUG PatientView: Landmark ${id} aggiunto come corpo:`, POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS])
          } else {
            console.log(`⚠️ DEBUG PatientView: Landmark ${id} non trovato in nessuna mappa`)
          }
        })
        
        console.log('🔍 DEBUG PatientView: Landmarks processati:', landmarks)
        
        // Determina se è un esercizio per la mano o per il corpo
        const hasHandLandmarks = esercizio.landmark.some(id => id >= 100)
        const hasBodyLandmarks = esercizio.landmark.some(id => id >= 0 && id <= 32)
        
        console.log('🔍 DEBUG PatientView: Analisi tipo esercizio:', {
          hasHandLandmarks,
          hasBodyLandmarks,
          landmarkRange: {
            min: Math.min(...esercizio.landmark),
            max: Math.max(...esercizio.landmark)
          }
        })
        
        if (hasHandLandmarks) {
          console.log('🔍 DEBUG PatientView: Esercizio mano con landmark specifici configurati')
          console.log('🔍 DEBUG PatientView: Landmark configurati originali:', esercizio.landmark)
          console.log('🔍 DEBUG PatientView: Landmark mano mappati per MediaPipe:', Object.keys(landmarks).length)
        } else if (hasBodyLandmarks) {
          console.log('🔍 DEBUG PatientView: Esercizio corpo con landmark specifici configurati')
          console.log('🔍 DEBUG PatientView: Landmark corpo configurati:', Object.keys(landmarks).length)
        }
        
        // Determina le connessioni in base ai landmark attivi
        if (hasHandLandmarks) {
          // Per esercizi mano, usa solo le connessioni tra i landmark configurati
          console.log('🔍 DEBUG PatientView: Esercizio mano, creo connessioni solo tra landmark configurati')
          
          // Filtra le connessioni della mano per usare solo quelle tra landmark configurati
          const configuredHandLandmarks = esercizio.landmark.filter(id => id >= 100).map(id => id - 100)
          connections = HAND_CONNECTIONS.filter(conn => 
            configuredHandLandmarks.includes(conn[0] - 100) && configuredHandLandmarks.includes(conn[1] - 100)
          ).map(conn => [conn[0] - 100, conn[1] - 100])
          
          console.log('🔗 DEBUG PatientView: Connessioni mano filtrate per landmark configurati:', connections.length)
        } else if (hasBodyLandmarks) {
          // Per esercizi corpo, usa solo le connessioni tra i landmark configurati
          console.log('🔍 DEBUG PatientView: Esercizio corpo, creo connessioni solo tra landmark configurati')
          
          // CORREZIONE: Filtra le connessioni per usare solo quelle tra landmark configurati
          // Questo evita di mostrare troppe linee sovrapposte
          connections = POSE_CONNECTIONS.filter(conn => 
            esercizio.landmark!.includes(conn[0]) && esercizio.landmark!.includes(conn[1])
          )
          
          console.log('🔗 DEBUG PatientView: Connessioni corpo filtrate per landmark configurati:', connections.length)
        }
        
        // OPZIONE: Mostra solo i punti senza linee per maggiore chiarezza
        // Per disabilitare le linee e mostrare solo i punti, decommenta la riga sotto:
        connections = [] // Solo punti, nessuna linea
        
        // Per ora manteniamo le connessioni filtrate, ma puoi facilmente disabilitarle
      } else {

        // Fallback: determina in base al nome della categoria
        const categoriaNome = esercizio.nome_esercizio.toLowerCase()
        console.log('🔍 DEBUG PatientView: Fallback - analisi nome esercizio:', {
          nome: esercizio.nome_esercizio,
          categoriaNome,
          isHand: categoriaNome.includes('mano'),
          isBody: categoriaNome.includes('spalla') || categoriaNome.includes('gomito') || categoriaNome.includes('anca') || categoriaNome.includes('ginocchio') || categoriaNome.includes('polso') || categoriaNome.includes('cervicale') || categoriaNome.includes('lombare')
        })
        
        if (categoriaNome.includes('mano')) {
          console.log('🔍 DEBUG PatientView: Nome indica esercizio mano, uso landmark mano')
          // Esercizi per la mano: usa tutti i landmark della mano
          landmarks = HAND_LANDMARKS
          connections = HAND_CONNECTIONS
        } else if (categoriaNome.includes('spalla') || categoriaNome.includes('gomito') || categoriaNome.includes('anca') || categoriaNome.includes('ginocchio') || categoriaNome.includes('polso') || categoriaNome.includes('cervicale') || categoriaNome.includes('lombare')) {
          console.log('🔍 DEBUG PatientView: Nome indica esercizio corpo, uso landmark corpo')
          // Esercizi per il corpo: usa tutti i landmark del corpo
          landmarks = POSE_LANDMARKS
          // CORREZIONE: Per la pagina di test, non mostrare linee per evitare confusione
          connections = []
        } else {
          console.log('🔍 DEBUG PatientView: Nome non specifico, default a corpo')
          // Default: usa tutti i landmark del corpo
          landmarks = POSE_LANDMARKS
          // CORREZIONE: Per la pagina di test, non mostrare linee per evitare confusione
          connections = []
        }
        
        // OPZIONE: Mostra solo i punti senza linee per maggiore chiarezza
        // Per disabilitare le linee e mostrare solo i punti, decommenta la riga sotto:
        // connections = [] // Solo punti, nessuna linea
      }
      
      console.log('🔍 DEBUG PatientView: Prima di setState - landmarks:', landmarks)
      console.log('🔍 DEBUG PatientView: Prima di setState - connections:', connections)
      
      setActiveLandmarks(landmarks)
      setActiveConnections(connections)
      console.log('🎯 DEBUG PatientView: Landmark attivi impostati:', { landmarks, connections })
    }
  }, [esercizio])

  // Mappa i landmark rilevati da MediaPipe ai nostri ID personalizzati
  const mapDetectedLandmarks = useCallback((detectedLandmarks: any[]) => {
    console.log('🔍 DEBUG: Landmark rilevati da MediaPipe:', {
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
      console.log('🎯 DEBUG: Esercizio usa landmark mano, mappando...')
      
      // Ora PoseDetection combina automaticamente pose + mano
      // I landmark della mano sono nelle posizioni 33-53 (dopo i 33 del corpo)
      const bodyLandmarks = detectedLandmarks.slice(0, 33)
      const handLandmarks = detectedLandmarks.slice(33, 54) // 21 landmark mano
      
      console.log('🔍 DEBUG: Landmark separati:', {
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
      
      console.log('🎯 DEBUG: Landmark mano mappati:', {
        mappedCount: mappedHandLandmarks.length,
        firstMapped: mappedHandLandmarks[0]
      })
      
      // Combina corpo + mano mappata
      const result = [...bodyLandmarks, ...mappedHandLandmarks]
      console.log('🎯 DEBUG: Risultato finale:', {
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
    console.log('Pose detected in patient view:', result)
  }

  // Funzione per attivare fullscreen
  const enterFullscreen = () => {
    const element = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }
    
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  }

  // Monitora lo stato fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Rilevamento caratteristiche schermo e adattamento dinamico
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

      // Log per debugging
      console.log('🖥️ Screen Info:', {
        resolution: `${width}x${height}`,
        aspectRatio: aspectRatio.toFixed(2),
        pixelRatio,
        isTouch,
        orientation,
        screenType: getScreenType(width, height, aspectRatio)
      })
    }

    const getScreenType = (w: number, h: number, ratio: number) => {
      if (w <= 768) return 'mobile/small-tablet'
      if (w <= 1024) return 'tablet/small-laptop'
      if (w <= 1366) return 'laptop'
      if (w <= 1919) return 'desktop'
      if (w <= 2559) return 'large-desktop'
      if (ratio > 2.1) return 'ultra-wide'
      return '4K+'
    }

    // Inizializzazione
    updateScreenInfo()

    // Listener per cambiamenti
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenInfo, 100) // Delay per orientationchange
    })

    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [])

  // Adattamento dinamico della webcam in base allo schermo
  const getOptimalVideoSettings = useCallback(() => {
    const { width, height, pixelRatio } = screenInfo
    
    // Calcola risoluzione ottimale basata sullo schermo
    let idealWidth = 1280
    let idealHeight = 720
    
    if (width >= 2560) {
      idealWidth = 1920
      idealHeight = 1080
    } else if (width >= 1920) {
      idealWidth = 1280
      idealHeight = 720
    } else if (width <= 768) {
      idealWidth = 640
      idealHeight = 480
    }

    // Adatta per schermi ad alta densità
    if (pixelRatio >= 2) {
      idealWidth = Math.min(idealWidth * 1.5, 1920)
      idealHeight = Math.min(idealHeight * 1.5, 1080)
    }

    return {
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
      frameRate: { ideal: width >= 1920 ? 30 : 24 },
      facingMode: 'user'
    }
  }, [screenInfo])

  return (
    <div className="fixed inset-0 bg-black patient-view gpu-accelerated border-0" style={{ width: '100vw', height: '100vh', overflow: 'hidden', border: 'none !important', outline: 'none !important' }}>
      {/* Header con istruzioni - sempre visibile */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Sessione Riabilitazione
          </h1>
          <p className="text-xl text-gray-200 mb-2">
            {currentExercise}
          </p>
          
          {/* Informazioni aggiuntive esercizio se disponibile */}
          {esercizio && (
            <div className="text-sm text-gray-300 space-y-1">
              {esercizio.descrizione_esecuzione && (
                <p className="max-w-2xl mx-auto">
                  {esercizio.descrizione_esecuzione}
                </p>
              )}
              {esercizio.landmark && esercizio.landmark.length > 0 && (
                <p>
                  Landmarks configurati: {esercizio.landmark.length} punti
                </p>
              )}
              {esercizio.note && (
                <p className="italic">
                  Note: {esercizio.note}
                </p>
              )}
            </div>
          )}
          
          {/* Toggle per forzare modalità colore */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setForceColorMode(!forceColorMode)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                forceColorMode 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
            >
              {forceColorMode ? '🎨 Colore Forzato' : '⚫ Modalità Auto'}
            </button>
            <div className="text-xs text-gray-400 mt-1">
              💡 <strong>Consiglio:</strong> Aumenta la luce per mantenere i colori
            </div>
          </div>
        </div>
      </div>

      {/* Area video principale - fullscreen */}
      <div className="absolute inset-0 w-full h-full bg-black border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        {/* Video element diretto per il paziente */}
        <video
          ref={(video) => {
            if (video && !videoElement) {
              console.log('🎥 Inizializzazione webcam paziente...')
              // Avvia webcam con impostazioni ottimizzate per il colore
              navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: 'user',
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 }
                  // Le altre impostazioni sono specifiche del browser e non supportate da TypeScript
                },
                audio: false
              }).then(stream => {
                video.srcObject = stream
                video.play()
                setVideoElement(video)
                console.log('✅ Webcam paziente avviata con impostazioni colore!')
              }).catch(err => {
                console.error('❌ Errore webcam paziente:', err)
                // Fallback con impostazioni minime ma con colore
                navigator.mediaDevices.getUserMedia({
                  video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                  },
                  audio: false
                }).then(stream => {
                  video.srcObject = stream
                  video.play()
                  setVideoElement(video)
                  console.log('✅ Webcam paziente avviata (fallback con colore)')
                }).catch(fallbackErr => {
                  console.error('❌ Errore fallback webcam paziente:', fallbackErr)
                })
              })
            }
          }}
          className="w-full h-full object-cover"
          style={{ 
            transform: 'scaleX(-1)', // Effetto specchio
            filter: 'none', // Rimuove eventuali filtri CSS
            WebkitFilter: 'none' // Per Safari
          }}
          autoPlay
          muted
          playsInline
        />

        {/* Pose detection (nascosto) + Overlay visibile */}
        {videoElement && (
          <>
            {/* PoseDetection nascosto per il rilevamento */}
            <div className="absolute inset-0 w-full h-full pose-landmarks" style={{ opacity: 0, pointerEvents: 'none' }}>
              <PoseDetection
                videoElement={videoElement}
                onPoseDetected={handlePoseDetected}
                isActive={true}
                enableRecording={false}
                pazienteId="patient-view"
                tipoEsercizio="Vista paziente"
                obiettivi="Visualizzazione pose"
                activeLandmarks={activeLandmarks}
                activeConnections={activeConnections}
              />
            </div>
            
            {/* Overlay visibile con punti colorati */}
            {currentPose && currentPose.landmarks && (
              <>
                {/* DEBUG: Log delle connessioni prima di PoseOverlay */}
                {console.log('🔍 DEBUG PatientView: showLines:', showLines)}
                {console.log('🔍 DEBUG PatientView: activeConnections.length:', activeConnections.length)}
                {console.log('🔍 DEBUG PatientView: POSE_CONNECTIONS.length:', POSE_CONNECTIONS.length)}
                {console.log('🔍 DEBUG PatientView: Connessioni finali:', 
                  showLines 
                    ? (activeConnections.length > 0 
                        ? activeConnections 
                        : POSE_CONNECTIONS)
                    : []
                )}
                <PoseOverlay
                  landmarks={currentPose.landmarks}
                  videoElement={videoElement}
                  confidence={currentPose.landmarks.reduce((acc, landmark) => acc + (landmark.visibility || 0), 0) / currentPose.landmarks.length}
                  className="pose-overlay"
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
              </>
            )}
            

          </>
        )}
      </div>

      {/* Feedback area - bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        <div className="text-center">
          {feedback && (
            <div className={`inline-block px-8 py-4 rounded-full text-2xl font-semibold feedback-message patient-feedback ${
              feedbackColor === 'green'
                ? 'bg-green-500/90 text-white'
                : feedbackColor === 'yellow'
                ? 'bg-yellow-500/90 text-black'
                : 'bg-red-500/90 text-white'
            }`}>
              {feedback}
            </div>
          )}
        </div>
      </div>

      {/* Indicatori di stato - corner overlay */}
      <div className="absolute top-6 right-6 z-30 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        <div className="flex items-center space-x-3">
          {/* Indicatore connessione */}
          <div className="flex items-center bg-black/50 rounded-full px-3 py-2 status-indicator active">
            <div className="w-3 h-3 bg-green-400 rounded-full connection-pulse mr-2"></div>
            <span className="text-white text-sm">Connesso</span>
          </div>
          
          {/* Indicatore sessione */}
          <div className="bg-black/50 rounded-full px-3 py-2">
            <span className="text-white text-sm">ID: {sessionId}</span>
          </div>
        </div>
      </div>

      {/* Istruzioni per il paziente + Controlli */}
      <div className="absolute bottom-20 left-6 z-20 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        <div className="bg-black/50 rounded-lg p-4 max-w-sm">
          <p className="text-white text-sm mb-3">
            💡 <strong>Suggerimento:</strong> Posizionati al centro dello schermo e segui le istruzioni del fisioterapista
          </p>
          <div className="flex gap-2">
            {!isFullscreen && (
              <button
                onClick={enterFullscreen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                📺 Schermo Intero
              </button>
            )}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              🎨 {showLegend ? 'Nascondi' : 'Mostra'} Colori
            </button>
            <button
              onClick={() => {
                console.log('🔍 DEBUG: Click su toggle linee, stato attuale:', showLines)
                setShowLines(!showLines)
                console.log('🔍 DEBUG: Nuovo stato impostato:', !showLines)
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              📏 {showLines ? 'Nascondi' : 'Mostra'} Linee
            </button>
          </div>
        </div>
      </div>

      {/* Legenda colori (opzionale per paziente) */}
      {showLegend && (
        <div className="absolute top-20 right-6 z-20 border-0" style={{ border: 'none !important', outline: 'none !important' }}>
          <div className="bg-black/80 rounded-lg p-1">
            <PoseLegend className="bg-transparent" />
          </div>
        </div>
      )}
    </div>
  )
}