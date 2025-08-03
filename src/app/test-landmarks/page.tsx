'use client'

import { useState, useEffect } from 'react'
import { PoseDetection } from '@/components/computer-vision/PoseDetection'
import { PoseOverlay } from '@/components/computer-vision/PoseOverlay'

interface PoseDetectionResult {
  landmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  worldLandmarks: Array<{x: number, y: number, z: number, visibility?: number}>
  segmentationMasks?: ImageData[]
}

// Pagina di test SENZA autenticazione
export default function TestLandmarks() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [currentPose, setCurrentPose] = useState<PoseDetectionResult | null>(null)

  const handlePoseDetected = (result: PoseDetectionResult) => {
    setCurrentPose(result)
    console.log('🧪 TEST - Pose detected:', {
      landmarksCount: result.landmarks?.length || 0,
      firstLandmark: result.landmarks?.[0] ? { x: result.landmarks[0].x, y: result.landmarks[0].y } : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black patient-view gpu-accelerated border-0" style={{ width: '100vw', height: '100vh', overflow: 'hidden', border: 'none !important', outline: 'none !important' }}>
      <h1 className="absolute top-4 left-4 text-white z-50">TEST LANDMARKS ALIGNMENT</h1>
      
      {/* Area video principale - fullscreen IDENTICA alla vista paziente */}
      <div className="absolute inset-0 w-full h-full bg-black border-0" style={{ border: 'none !important', outline: 'none !important' }}>
        {/* Video element diretto IDENTICO alla vista paziente */}
        <video
          ref={(video) => {
            if (video && !videoElement) {
              console.log('🧪 TEST - Inizializzazione webcam...')
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
                console.log('🧪 TEST - Webcam avviata!')
              }).catch(err => {
                console.error('🧪 TEST - Errore webcam:', err)
              })
            }
          }}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Effetto specchio IDENTICO
          autoPlay
          muted
          playsInline
        />

        {/* Pose detection (nascosto) + Overlay visibile IDENTICO */}
        {videoElement && (
          <>
            {/* PoseDetection nascosto per il rilevamento */}
            <div className="absolute inset-0 w-full h-full pose-landmarks" style={{ opacity: 0, pointerEvents: 'none' }}>
              <PoseDetection
                videoElement={videoElement}
                onPoseDetected={handlePoseDetected}
                isActive={true}
                enableRecording={false}
                pazienteId="test-landmarks"
                tipoEsercizio="Test allineamento"
                obiettivi="Test"
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
    </div>
  )
}