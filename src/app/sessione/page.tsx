// src/app/sessione/page.tsx - VERSIONE INTEGRATA
'use client'

import { useState, useCallback } from 'react'
import { WebcamCapture } from '@/components/computer-vision/WebcamCapture'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Square, 
  Activity, 
  Video, 
  Zap,
  BarChart3,
  Save
} from 'lucide-react'

// Types per i dati rilevati
interface PoseDetectionResult {
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility?: number
  }>
  worldLandmarks: Array<{
    x: number
    y: number
    z: number
    visibility?: number
  }>
  segmentationMasks?: ImageData[]
}

export default function SessionePage() {
  // State management
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionData, setSessionData] = useState<{
    startTime: number | null
    endTime: number | null
    totalDetections: number
    poseData: PoseDetectionResult[]
  }>({
    startTime: null,
    endTime: null,
    totalDetections: 0,
    poseData: []
  })

  // Webcam ready handler
  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    console.log('✅ Video pronto per MediaPipe - Forzando inizializzazione PoseDetection')
    setVideoElement(video)
    
    // Auto-start sessione per debug
    setTimeout(() => {
      if (!isSessionActive) {
        console.log('🚀 Auto-avvio sessione per debug')
        setIsSessionActive(true)
        setSessionData(prev => ({
          ...prev,
          startTime: Date.now(),
          endTime: null,
          totalDetections: 0,
          poseData: []
        }))
      }
    }, 1000)
  }, [])

  // Pose detection handler
  const handlePoseDetected = useCallback((result: PoseDetectionResult) => {
    if (!isSessionActive) return

    // Aggiorna dati sessione
    setSessionData(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      poseData: [...prev.poseData.slice(-99), result] // Mantieni ultimi 100 frames
    }))

    // Log periodico (ogni 30 detection)
    if (sessionData.totalDetections % 30 === 0) {
      console.log('📊 Pose Detection Stats:', {
        totalDetections: sessionData.totalDetections,
        landmarksCount: result.landmarks.length,
        avgVisibility: result.landmarks
          .map(l => l.visibility || 0)
          .reduce((a, b) => a + b, 0) / result.landmarks.length
      })
    }
  }, [isSessionActive, sessionData.totalDetections])

  // Error handlers
  const handleWebcamError = useCallback((error: string) => {
    console.error('❌ Webcam Error:', error)
  }, [])

  const handlePoseError = useCallback((error: string) => {
    console.error('❌ Pose Detection Error:', error)
  }, [])

  // Session controls
  const startSession = useCallback(() => {
    setIsSessionActive(true)
    setSessionData(prev => ({
      ...prev,
      startTime: Date.now(),
      endTime: null,
      totalDetections: 0,
      poseData: []
    }))
    console.log('🚀 Sessione riabilitazione iniziata')
  }, [])

  const stopSession = useCallback(() => {
    setIsSessionActive(false)
    setSessionData(prev => ({
      ...prev,
      endTime: Date.now()
    }))
    console.log('⏹️ Sessione riabilitazione terminata', {
      durata: sessionData.startTime ? (Date.now() - sessionData.startTime) / 1000 : 0,
      totalDetections: sessionData.totalDetections
    })
  }, [sessionData])

  // Session duration calculation
  const getSessionDuration = () => {
    if (!sessionData.startTime) return 0
    const endTime = sessionData.endTime || Date.now()
    return Math.floor((endTime - sessionData.startTime) / 1000)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sessione Riabilitazione</h1>
            <p className="text-muted-foreground">
              Computer Vision - MediaPipe Pose Detection
            </p>
          </div>

          {/* Session Status */}
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSessionActive 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {isSessionActive ? (
                <>
                  <Activity className="h-4 w-4 mr-1 inline animate-pulse" />
                  Sessione Attiva
                </>
              ) : (
                'Sessione Inattiva'
              )}
            </div>

            {isSessionActive && (
              <div className="text-sm text-muted-foreground">
                Durata: {Math.floor(getSessionDuration() / 60)}:{(getSessionDuration() % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Webcam */}
            <WebcamCapture
              onVideoReady={handleVideoReady}
              onError={handleWebcamError}
              className="h-fit"
            />

            {/* Pose Detection */}
            <PoseDetection
              videoElement={videoElement}
              onPoseDetected={handlePoseDetected}
              onError={handlePoseError}
              isActive={isSessionActive}
            />
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Session Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Controlli Sessione
                </CardTitle>
                <CardDescription>
                  Gestisci la sessione di riabilitazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start/Stop Button */}
                {!isSessionActive ? (
                  <Button 
                    onClick={startSession}
                    disabled={!videoElement}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Inizia Sessione
                  </Button>
                ) : (
                  <Button 
                    onClick={stopSession}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Termina Sessione
                  </Button>
                )}

                {/* Save Session (quando terminata) */}
                {sessionData.endTime && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => console.log('💾 Salvataggio sessione...', sessionData)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salva Sessione
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistiche Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Durata</div>
                    <div className="font-mono text-lg">
                      {Math.floor(getSessionDuration() / 60)}:{(getSessionDuration() % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rilevamenti</div>
                    <div className="font-mono text-lg">{sessionData.totalDetections}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Frame Rate</div>
                    <div className="font-mono">
                      {sessionData.totalDetections > 0 && sessionData.startTime 
                        ? (sessionData.totalDetections / (getSessionDuration() || 1)).toFixed(1)
                        : '0'} fps
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="flex items-center gap-1">
                      {videoElement ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <span className="text-xs">
                        {videoElement ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Status Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Webcam:</span>
                    <div className={`px-2 py-1 rounded text-xs ${
                      videoElement 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {videoElement ? '✅ Attiva' : '❌ Non disponibile'}
                    </div>
                  </div>
                  
                  {videoElement && (
                    <>
                      <div className="flex justify-between">
                        <span>Risoluzione:</span>
                        <span className="font-mono">
                          {videoElement.videoWidth}x{videoElement.videoHeight}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ready State:</span>
                        <span className="font-mono">{videoElement.readyState}/4</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span>MediaPipe:</span>
                    <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      ✅ v0.10.22
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Development Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Modalità Sviluppo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>✅ Webcam Integration</p>
                  <p>✅ MediaPipe Pose Detection</p>
                  <p>🔄 Database Integration (prossimo)</p>
                  <p>📊 Metrics Calculation (prossimo)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}