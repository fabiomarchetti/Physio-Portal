'use client'

import { useState, useEffect } from 'react'
import { WebcamCapture } from '@/components/computer-vision/WebcamCapture'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'

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
    // Qui processeremo i dati pose per feedback real-time
    console.log('Pose detected in patient view:', result)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col patient-view gpu-accelerated">
      {/* Header con istruzioni - sempre visibile */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
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
      <div className="flex-1 relative">
        {/* Webcam capture nascosta */}
        <div className="absolute -top-full opacity-0 pointer-events-none">
          <WebcamCapture
            onVideoReady={setVideoElement}
            onError={(error) => console.error('Webcam error:', error)}
          />
        </div>

        {/* Pose detection con overlay fullscreen */}
        {videoElement && (
          <div className="absolute inset-0">
            <PoseDetection
              videoElement={videoElement}
              onPoseDetected={handlePoseDetected}
              isActive={true}
              enableRecording={false} // Il recording sarà gestito dal fisioterapista
            />
          </div>
        )}

        {/* Overlay per il video - effetto mirror applicato via CSS */}
        <div className="absolute inset-0 pose-landmarks" />
      </div>

      {/* Feedback area - bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
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
      <div className="absolute top-6 right-6 z-30">
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

      {/* Istruzioni per il paziente - se necessario */}
      <div className="absolute bottom-20 left-6 z-20">
        <div className="bg-black/50 rounded-lg p-4 max-w-sm">
          <p className="text-white text-sm">
            💡 <strong>Suggerimento:</strong> Posizionati al centro dello schermo e segui le istruzioni del fisioterapista
          </p>
        </div>
      </div>
    </div>
  )
}