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

interface TherapistViewProps {
  sessionId: string
}

interface PoseDetectionResult {
  landmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  worldLandmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  segmentationMasks?: ImageData[]
}

export default function TherapistView({ sessionId }: TherapistViewProps) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [currentExercise, setCurrentExercise] = useState('Valutazione iniziale')
  const [sessionDuration, setSessionDuration] = useState(0)
  const [patientFeedback, setPatientFeedback] = useState('')
  const [currentPose, setCurrentPose] = useState<PoseDetectionResult | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
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

  const handlePoseDetected = (result: PoseDetectionResult) => {
    // Aggiorna lo stato con i nuovi dati pose per la visualizzazione
    setCurrentPose(result)
    console.log('🎯 THERAPIST VIEW - Pose detected (CACHE REFRESH):', {
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
      {/* Lato sinistro - Video del paziente (50%) */}
      <div className="w-1/2 bg-black relative therapist-video-panel border-0" style={{ border: 'none !important', outline: 'none !important' }}>
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
              <div className="absolute inset-0 w-full h-full" style={{ opacity: 0, pointerEvents: 'none' }}>
                <PoseDetection
                  videoElement={videoElement}
                  onPoseDetected={handlePoseDetected}
                  isActive={isSessionActive}
                  enableRecording={true}
                  pazienteId="patient-123" // Sarà dinamico
                  tipoEsercizio={currentExercise}
                  obiettivi="Miglioramento mobilità spalla destra"
                />
              </div>
              
              {/* Overlay visibile con punti colorati - CACHE REFRESH */}
              {currentPose && currentPose.landmarks && (
                <PoseOverlay
                  landmarks={currentPose.landmarks}
                  videoElement={videoElement}
                  confidence={currentPose.landmarks.reduce((acc, landmark) => acc + (landmark.visibility || 0), 0) / currentPose.landmarks.length}
                  className="pose-overlay therapist-overlay"
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

      {/* Lato destro - Controlli e Analytics (50%) */}
      <div className="w-1/2 flex flex-col therapist-controls-panel border-0" style={{ border: 'none !important', outline: 'none !important' }}>
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
                    Esercizi e Istruzioni
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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