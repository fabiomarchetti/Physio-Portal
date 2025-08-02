// src/components/computer-vision/PoseDetection.tsx - VERSIONE OTTIMIZZATA
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw,
  AlertCircle,
  Zap,
  Target,
  Settings
} from 'lucide-react'

// Types per MediaPipe
interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PoseDetectionResult {
  landmarks: PoseLandmark[]
  worldLandmarks: PoseLandmark[]
  segmentationMasks?: ImageData[]
}

interface PoseDetectionProps {
  videoElement: HTMLVideoElement | null
  onPoseDetected?: (result: PoseDetectionResult) => void
  onError?: (error: string) => void
  isActive?: boolean
}

// Performance settings
const PERFORMANCE_SETTINGS = {
  TARGET_FPS: 30,
  MIN_CONFIDENCE: 0.5,
  DRAWING_THROTTLE: 3, // Disegna ogni N frame per performance
  STATS_UPDATE_INTERVAL: 1000, // Update stats ogni secondo
  CANVAS_SCALE: 1, // Scala canvas per performance
}

// MediaPipe Pose landmark indices (key points only for performance)
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
  isActive = false 
}: PoseDetectionProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const poseDetectorRef = useRef<unknown>(null)
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

  // Performance configurations
  const getPerformanceConfig = () => {
    switch (performanceMode) {
      case 'high':
        return {
          TARGET_FPS: 30,
          MIN_CONFIDENCE: 0.7,
          DRAWING_THROTTLE: 1,
          CANVAS_SCALE: 1
        }
      case 'fast':
        return {
          TARGET_FPS: 15,
          MIN_CONFIDENCE: 0.4,
          DRAWING_THROTTLE: 5,
          CANVAS_SCALE: 0.8
        }
      default: // balanced
        return {
          TARGET_FPS: 24,
          MIN_CONFIDENCE: 0.5,
          DRAWING_THROTTLE: 2,
          CANVAS_SCALE: 0.9
        }
    }
  }

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
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: config.MIN_CONFIDENCE,
        minPosePresenceConfidence: config.MIN_CONFIDENCE,
        minTrackingConfidence: config.MIN_CONFIDENCE,
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
  }, [onError, performanceMode])

  // Optimized frame processing
  const processFrame = useCallback(async () => {
    if (!videoElement || !poseDetectorRef.current || !canvasRef.current || !isDetecting) {
      return
    }

    const now = performance.now()
    const config = getPerformanceConfig()
    const frameInterval = 1000 / config.TARGET_FPS

    // Frame rate limiting
    if (now - lastFrameTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Adaptive canvas sizing for performance
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
          segmentationMasks?: ImageData[] 
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

          // Throttled drawing for performance
          drawingCountRef.current++
          if (drawingCountRef.current % config.DRAWING_THROTTLE === 0) {
            drawPoseLandmarksOptimized(ctx, landmarks, canvas.width, canvas.height, avgConfidence)
          }

          // Update stats
          frameCountRef.current++
          if (now - lastFrameTimeRef.current >= PERFORMANCE_SETTINGS.STATS_UPDATE_INTERVAL) {
            const fps = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current))
            setStats(prev => ({
              fps,
              detectionTime: Math.round(detectionTime * 10) / 10,
              totalDetections: prev.totalDetections + 1,
              averageConfidence: Math.round(avgConfidence * 1000) / 10,
              droppedFrames: prev.droppedFrames
            }))
            frameCountRef.current = 0
            lastFrameTimeRef.current = now
          }

          // Notify parent component (throttled)
          if (drawingCountRef.current % 3 === 0) { // Every 3rd frame
            onPoseDetected?.({
              landmarks,
              worldLandmarks,
              segmentationMasks: resultsObj.segmentationMasks
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
  }, [videoElement, isDetecting, onPoseDetected, performanceMode])

  // Optimized landmark drawing
  const drawPoseLandmarksOptimized = (
    ctx: CanvasRenderingContext2D, 
    landmarks: PoseLandmark[], 
    width: number, 
    height: number,
    confidence: number
  ) => {
    const config = getPerformanceConfig()
    
    // Adaptive styling based on confidence
    const alpha = Math.max(0.3, confidence)
    const pointRadius = confidence > 0.8 ? 5 : 3
    const lineWidth = confidence > 0.8 ? 3 : 2

    // High-contrast colors for better visibility
    const colors = {
      face: `rgba(255, 107, 107, ${alpha})`,
      torso: `rgba(78, 205, 196, ${alpha})`,
      leftArm: `rgba(69, 183, 209, ${alpha})`,
      rightArm: `rgba(150, 206, 180, ${alpha})`,
      leftLeg: `rgba(255, 234, 167, ${alpha})`,
      rightLeg: `rgba(221, 160, 221, ${alpha})`
    }

    // Key connections only for performance
    const connections = [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
      [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
      [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
      [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE]
    ]

    // Draw connections with gradient effect
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx]
      const end = landmarks[endIdx]
      
      if (start && end && 
          (start.visibility || 0) > config.MIN_CONFIDENCE && 
          (end.visibility || 0) > config.MIN_CONFIDENCE) {
        
        const gradient = ctx.createLinearGradient(
          start.x * width, start.y * height,
          end.x * width, end.y * height
        )
        gradient.addColorStop(0, colors.torso)
        gradient.addColorStop(1, colors.leftArm)
        
        ctx.strokeStyle = gradient
        ctx.beginPath()
        ctx.moveTo(start.x * width, start.y * height)
        ctx.lineTo(end.x * width, end.y * height)
        ctx.stroke()
      }
    })

    // Draw key points only
    const keyPoints = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE
    ]

    keyPoints.forEach((index) => {
      const landmark = landmarks[index]
      if (landmark && (landmark.visibility || 0) > config.MIN_CONFIDENCE) {
        const x = landmark.x * width
        const y = landmark.y * height
        
        // Color based on body part
        let color = colors.torso
        if (index === POSE_LANDMARKS.NOSE) color = colors.face
        else if ([POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST].includes(index)) color = colors.leftArm
        else if ([POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST].includes(index)) color = colors.rightArm
        else if ([POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE].includes(index)) color = colors.leftLeg
        else if ([POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE].includes(index)) color = colors.rightLeg
        
        // Draw point with glow effect
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    })
  }

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

  // Auto-start quando diventa attivo
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

  // Avvia processFrame quando isDetecting diventa true
  useEffect(() => {
    if (isDetecting && videoElement && poseDetectorRef.current && canvasRef.current) {
      lastFrameTimeRef.current = performance.now()
      processFrame()
    }
  }, [isDetecting, videoElement, processFrame])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <Card>
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
              className="text-xs px-2 py-1 border rounded"
            >
              <option value="high">High Quality</option>
              <option value="balanced">Balanced</option>
              <option value="fast">Fast</option>
            </select>

            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isDetecting 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : isInitialized
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
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
        </div>

        {/* Enhanced Stats */}
        {isDetecting && (
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
      </CardContent>
    </Card>
  )
}