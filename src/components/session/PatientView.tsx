'use client'

import { useState, useEffect, useCallback } from 'react'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'
import { PoseOverlay } from '@/components/computer-vision/PoseOverlay'
import { PoseLegend } from '@/components/computer-vision/PoseLegend'

interface PatientViewProps {
  sessionId: string
}

interface PoseDetectionResult {
  landmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  worldLandmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  segmentationMasks?: ImageData[]
}

export default function PatientView({ sessionId }: PatientViewProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [currentExercise, setCurrentExercise] = useState<string>('In attesa di istruzioni...')
  const [feedback, setFeedback] = useState<string>('')
  const [feedbackColor, setFeedbackColor] = useState<'green' | 'yellow' | 'red'>('green')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [currentPose, setCurrentPose] = useState<PoseDetectionResult | null>(null)
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

  const handlePoseDetected = (result: PoseDetectionResult) => {
    // Aggiorna lo stato con i nuovi dati pose per la visualizzazione
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
          <p className="text-xl text-gray-200">
            {currentExercise}
          </p>
        </div>
      </div>

      {/* Area video principale - fullscreen */}
      <div className="absolute inset-0 w-full h-full bg-black border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        {/* Video element diretto per il paziente */}
        <video
          ref={(video) => {
            if (video && !videoElement) {
              console.log('🎥 Inizializzazione webcam paziente...')
              // Avvia webcam immediatamente senza aspettare screenInfo
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
                console.log('✅ Webcam paziente avviata!')
              }).catch(err => {
                console.error('❌ Errore webcam paziente:', err)
                // Fallback con impostazioni minime
                navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: false
                }).then(stream => {
                  video.srcObject = stream
                  video.play()
                  setVideoElement(video)
                  console.log('✅ Webcam paziente avviata (fallback)')
                }).catch(fallbackErr => {
                  console.error('❌ Errore fallback webcam paziente:', fallbackErr)
                })
              })
            }
          }}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Effetto specchio
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
              />
            </div>
            
            {/* Overlay visibile con punti colorati */}
            {currentPose && currentPose.landmarks && (
              <PoseOverlay
                landmarks={currentPose.landmarks}
                videoElement={videoElement}
                confidence={currentPose.landmarks.reduce((acc, landmark) => acc + (landmark.visibility || 0), 0) / currentPose.landmarks.length}
                className="pose-overlay"
              />
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