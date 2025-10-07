// src/components/computer-vision/PoseOverlaySimple.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PoseOverlayProps {
  videoElement: HTMLVideoElement
  isActive: boolean
  onPoseDetected?: (result: { landmarks: PoseLandmark[], worldLandmarks: PoseLandmark[] }) => void
}

// MediaPipe Pose landmark indices
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

export function PoseOverlaySimple({ videoElement, isActive, onPoseDetected }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const poseDetectorRef = useRef<any>(null)
  const lastFrameTimeRef = useRef<number>(0)

  // Initialize MediaPipe
  const initializeMediaPipe = useCallback(async () => {
    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      )

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputSegmentationMasks: false
      })

      poseDetectorRef.current = poseLandmarker
      console.log('✅ MediaPipe Pose inizializzato')
    } catch (err) {
      console.error('❌ Errore MediaPipe:', err)
    }
  }, [])

  // Draw landmarks on canvas
  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], width: number, height: number) => {
    const alpha = 0.8
    const pointRadius = 8
    const lineWidth = 4

    // Colori per le diverse parti del corpo
    const bodyPartColors = {
      head: `rgba(255, 50, 50, ${alpha})`,
      leftArm: `rgba(50, 150, 255, ${alpha})`,
      rightArm: `rgba(255, 50, 150, ${alpha})`,
      torso: `rgba(50, 255, 150, ${alpha})`,
      leftLeg: `rgba(255, 200, 50, ${alpha})`,
      rightLeg: `rgba(150, 50, 255, ${alpha})`
    }

    // Connessioni
    const connections = [
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.RIGHT_SHOULDER, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_ELBOW, color: bodyPartColors.leftArm },
      { start: POSE_LANDMARKS.LEFT_ELBOW, end: POSE_LANDMARKS.LEFT_WRIST, color: bodyPartColors.leftArm },
      { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_ELBOW, color: bodyPartColors.rightArm },
      { start: POSE_LANDMARKS.RIGHT_ELBOW, end: POSE_LANDMARKS.RIGHT_WRIST, color: bodyPartColors.rightArm },
      { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_HIP, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.RIGHT_HIP, color: bodyPartColors.torso },
      { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.LEFT_KNEE, color: bodyPartColors.leftLeg },
      { start: POSE_LANDMARKS.LEFT_KNEE, end: POSE_LANDMARKS.LEFT_ANKLE, color: bodyPartColors.leftLeg },
      { start: POSE_LANDMARKS.RIGHT_HIP, end: POSE_LANDMARKS.RIGHT_KNEE, color: bodyPartColors.rightLeg },
      { start: POSE_LANDMARKS.RIGHT_KNEE, end: POSE_LANDMARKS.RIGHT_ANKLE, color: bodyPartColors.rightLeg }
    ]

    // Disegna connessioni
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    connections.forEach(({ start, end, color }) => {
      const startLandmark = landmarks[start]
      const endLandmark = landmarks[end]

      if (startLandmark && endLandmark &&
          (startLandmark.visibility || 0) > 0.5 &&
          (endLandmark.visibility || 0) > 0.5) {
        ctx.strokeStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 5
        ctx.beginPath()
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height)
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })

    // Disegna punti
    const landmarkColorMap: { [key: number]: string } = {
      [POSE_LANDMARKS.NOSE]: bodyPartColors.head,
      [POSE_LANDMARKS.LEFT_SHOULDER]: bodyPartColors.leftArm,
      [POSE_LANDMARKS.RIGHT_SHOULDER]: bodyPartColors.rightArm,
      [POSE_LANDMARKS.LEFT_ELBOW]: bodyPartColors.leftArm,
      [POSE_LANDMARKS.RIGHT_ELBOW]: bodyPartColors.rightArm,
      [POSE_LANDMARKS.LEFT_WRIST]: bodyPartColors.leftArm,
      [POSE_LANDMARKS.RIGHT_WRIST]: bodyPartColors.rightArm,
      [POSE_LANDMARKS.LEFT_HIP]: bodyPartColors.leftLeg,
      [POSE_LANDMARKS.RIGHT_HIP]: bodyPartColors.rightLeg,
      [POSE_LANDMARKS.LEFT_KNEE]: bodyPartColors.leftLeg,
      [POSE_LANDMARKS.RIGHT_KNEE]: bodyPartColors.rightLeg,
      [POSE_LANDMARKS.LEFT_ANKLE]: bodyPartColors.leftLeg,
      [POSE_LANDMARKS.RIGHT_ANKLE]: bodyPartColors.rightLeg
    }

    Object.entries(landmarkColorMap).forEach(([indexStr, color]) => {
      const index = parseInt(indexStr)
      const landmark = landmarks[index]

      if (landmark && (landmark.visibility || 0) > 0.5) {
        const x = landmark.x * width
        const y = landmark.y * height

        // Glow esterno
        ctx.shadowColor = color
        ctx.shadowBlur = 12

        // Cerchio esterno
        ctx.fillStyle = color.replace(alpha.toString(), '0.3')
        ctx.beginPath()
        ctx.arc(x, y, pointRadius + 3, 0, 2 * Math.PI)
        ctx.fill()

        // Cerchio principale
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
        ctx.fill()

        // Highlight centrale
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(x, y, pointRadius * 0.4, 0, 2 * Math.PI)
        ctx.fill()

        ctx.shadowBlur = 0
      }
    })
  }, [])

  // Process frame
  const processFrame = useCallback(async () => {
    if (!videoElement || !poseDetectorRef.current || !canvasRef.current || !isActive) {
      return
    }

    const now = performance.now()
    const frameInterval = 1000 / 30 // 30 FPS

    if (now - lastFrameTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Usa le dimensioni RENDERIZZATE del video element (getBoundingClientRect)
    const videoRect = videoElement.getBoundingClientRect()
    const displayWidth = Math.floor(videoRect.width)
    const displayHeight = Math.floor(videoRect.height)

    // Aggiorna SEMPRE posizione e dimensioni del canvas per seguire il video
    canvas.style.top = `${videoRect.top}px`
    canvas.style.left = `${videoRect.left}px`
    canvas.style.width = `${videoRect.width}px`
    canvas.style.height = `${videoRect.height}px`

    // Imposta dimensioni canvas alle dimensioni VISUALIZZATE del video
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
      console.log('📐 Canvas ridimensionato:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoNative: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        videoDisplay: `${displayWidth}x${displayHeight}`,
        videoPosition: {
          top: videoRect.top,
          left: videoRect.left
        }
      })
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // MediaPipe detection
      const results = await poseDetectorRef.current.detectForVideo(videoElement, now)

      if (results?.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const worldLandmarks = results.worldLandmarks[0]

        // Disegna landmarks
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height)

        // Callback
        if (onPoseDetected) {
          onPoseDetected({ landmarks, worldLandmarks })
        }
      }

      lastFrameTimeRef.current = now
    } catch (err) {
      console.error('Errore detection:', err)
    }

    // Next frame
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }
  }, [videoElement, isActive, drawLandmarks, onPoseDetected])

  // Initialize
  useEffect(() => {
    if (videoElement && !poseDetectorRef.current) {
      initializeMediaPipe()
    }
  }, [videoElement, initializeMediaPipe])

  // Start/stop detection
  useEffect(() => {
    if (isActive && poseDetectorRef.current && videoElement) {
      lastFrameTimeRef.current = performance.now()
      processFrame()
    } else if (!isActive && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, videoElement, processFrame])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: 'fixed',
        zIndex: 999,
        pointerEvents: 'none'
      }}
    />
  )
}
