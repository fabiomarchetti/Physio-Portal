'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
// import { Badge } from '@/components/ui/badge' // Temporaneamente commentato
import { 
  Camera, 
  CameraOff, 
  Play, 
  Pause, 
  Square,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react'

interface WebcamCaptureProps {
  onVideoReady?: (video: HTMLVideoElement) => void
  onError?: (error: string) => void
  className?: string
}

interface MediaDeviceInfo {
  deviceId: string
  label: string
}

export function WebcamCapture({ onVideoReady, onError, className }: WebcamCaptureProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // State
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [streamStats, setStreamStats] = useState({
    width: 0,
    height: 0,
    fps: 0
  })

  // Configurazione video ottimizzata per MediaPipe
  const videoConstraints = {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user' // Camera frontale preferita
  }

  // Carica dispositivi video disponibili
  const loadVideoDevices = useCallback(async () => {
    try {
      // Prima richiedi permessi per accedere ai label dei dispositivi
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          // Ferma immediatamente lo stream di test
          stream.getTracks().forEach(track => track.stop())
        })
        .catch(() => {
          // Ignora errori di permessi per ora
        })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substr(0, 8)}`
        }))
      
      console.log('📹 Dispositivi video trovati:', videoDevices)
      setDevices(videoDevices)
      
      // Seleziona automaticamente la prima camera se disponibile
      if (videoDevices.length > 0 && !selectedDevice) {
        console.log('🎯 Seleziono automaticamente:', videoDevices[0].label)
        setSelectedDevice(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error('Errore nel caricamento dispositivi:', err)
      setError('Impossibile accedere ai dispositivi video')
    }
  }, [selectedDevice])

  // Avvia lo streaming video
  const startStreaming = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verifica supporto MediaDevices
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Il browser non supporta l\'accesso alla webcam')
      }

      // Ferma stream esistente se presente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Configurazione stream
      const constraints: MediaStreamConstraints = {
        video: selectedDevice 
          ? { ...videoConstraints, deviceId: { exact: selectedDevice } }
          : videoConstraints,
        audio: false // Non serve audio per la computer vision
      }

      // Richiedi accesso alla camera
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Assegna stream al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true // Importante per mobile
        
        // Aspetta che il video sia pronto
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!
          
          const handleLoadedMetadata = () => {
            // Aggiorna statistiche stream
            const track = stream.getVideoTracks()[0]
            const settings = track.getSettings()
            
            setStreamStats({
              width: settings.width || video.videoWidth,
              height: settings.height || video.videoHeight,
              fps: settings.frameRate || 30
            })

            setIsStreaming(true)
            setIsLoading(false)
            
            // Notifica parent component
            onVideoReady?.(video)
            resolve()
          }

          const handleError = (err: Event) => {
            reject(new Error('Errore nel caricamento del video'))
          }

          video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
          video.addEventListener('error', handleError, { once: true })
          
          // Avvia riproduzione
          video.play().catch(reject)
        })
      }

    } catch (err) {
      console.error('Errore avvio streaming:', err)
      
      // Type-safe error handling
      let errorMessage = 'Errore sconosciuto nell\'accesso alla webcam'
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Accesso alla webcam negato. Abilita i permessi per la camera.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Nessuna webcam trovata. Collega una camera e riprova.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Webcam in uso da un\'altra applicazione.'
        } else {
          errorMessage = err.message || 'Errore sconosciuto nell\'accesso alla webcam'
        }
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [selectedDevice, onVideoReady, onError])

  // Ferma lo streaming
  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setStreamStats({ width: 0, height: 0, fps: 0 })
  }, [])

  // Cambia dispositivo video
  const changeDevice = useCallback(async (deviceId: string) => {
    setSelectedDevice(deviceId)
    if (isStreaming) {
      stopStreaming()
      // Piccolo delay per permettere al dispositivo di liberarsi
      setTimeout(() => {
        setSelectedDevice(deviceId)
      }, 100)
    }
  }, [isStreaming, stopStreaming])

  // Effetti
  useEffect(() => {
    loadVideoDevices()
    
    // Cleanup on unmount
    return () => {
      stopStreaming()
    }
  }, [loadVideoDevices, stopStreaming])

  // Auto-start quando il dispositivo è selezionato
  useEffect(() => {
    if (selectedDevice && !isStreaming && !isLoading) {
      console.log('🚀 Auto-avvio camera con dispositivo:', selectedDevice)
      startStreaming()
    }
  }, [selectedDevice, isStreaming, isLoading, startStreaming])

  // Debug: Log dello stato
  useEffect(() => {
    console.log('📊 WebcamCapture State:', {
      devices: devices.length,
      selectedDevice,
      isStreaming,
      isLoading,
      error
    })
  }, [devices, selectedDevice, isStreaming, isLoading, error])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Webcam Capture
            </CardTitle>
            <CardDescription>
              Accesso video per computer vision
            </CardDescription>
          </div>
          
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isStreaming 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {isStreaming ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                Attiva
              </>
            ) : (
              <>
                <CameraOff className="h-3 w-3 mr-1 inline" />
                Inattiva
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selezione Dispositivo */}
        {devices.length > 1 && (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <select 
              value={selectedDevice}
              onChange={(e) => changeDevice(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md bg-background"
              disabled={isLoading}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Element */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-auto max-h-96 object-cover"
            autoPlay
            muted
            playsInline
          />
          
          {/* Overlay per loading/errori */}
          {(isLoading || error) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              {isLoading && (
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Caricamento webcam...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistiche Stream */}
        {isStreaming && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Risoluzione: {streamStats.width}x{streamStats.height}</span>
            <span>FPS: {streamStats.fps}</span>
          </div>
        )}

        {/* Controlli */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button 
              onClick={startStreaming} 
              disabled={isLoading || !selectedDevice}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Avvia Camera
            </Button>
          ) : (
            <Button 
              onClick={stopStreaming}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Ferma Camera
            </Button>
          )}
          
          <Button 
            onClick={loadVideoDevices}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Errori */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info dispositivi */}
        {devices.length === 0 && !isLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nessuna webcam rilevata. Assicurati di avere una camera collegata.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}