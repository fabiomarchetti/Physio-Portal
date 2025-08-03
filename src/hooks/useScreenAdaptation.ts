'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ScreenInfo {
  width: number
  height: number
  aspectRatio: number
  pixelRatio: number
  isTouch: boolean
  orientation: 'landscape' | 'portrait'
  screenType: string
  isUltraWide: boolean
  isHighDPI: boolean
}

export function useScreenAdaptation() {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: 0,
    height: 0,
    aspectRatio: 0,
    pixelRatio: 1,
    isTouch: false,
    orientation: 'landscape',
    screenType: 'unknown',
    isUltraWide: false,
    isHighDPI: false
  })

  const getScreenType = useCallback((width: number, height: number, aspectRatio: number): string => {
    if (width <= 768) return 'mobile/small-tablet'
    if (width <= 1024) return 'tablet/small-laptop'
    if (width <= 1366) return 'laptop'
    if (width <= 1919) return 'desktop'
    if (width <= 2559) return 'large-desktop'
    if (aspectRatio > 2.1) return 'ultra-wide'
    return '4K+'
  }, [])

  const updateScreenInfo = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const aspectRatio = width / height
    const pixelRatio = window.devicePixelRatio || 1
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const orientation = width > height ? 'landscape' : 'portrait'
    const screenType = getScreenType(width, height, aspectRatio)
    const isUltraWide = aspectRatio > 2.1
    const isHighDPI = pixelRatio >= 2

    const newScreenInfo: ScreenInfo = {
      width,
      height,
      aspectRatio,
      pixelRatio,
      isTouch,
      orientation,
      screenType,
      isUltraWide,
      isHighDPI
    }

    setScreenInfo(newScreenInfo)

    // Log per debugging (solo in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🖥️ Screen Adaptation:', {
        resolution: `${width}x${height}`,
        aspectRatio: aspectRatio.toFixed(2),
        pixelRatio,
        isTouch,
        orientation,
        screenType,
        isUltraWide,
        isHighDPI
      })
    }

    return newScreenInfo
  }, [getScreenType])

  useEffect(() => {
    // Inizializzazione
    updateScreenInfo()

    // Listener per cambiamenti
    const handleResize = () => updateScreenInfo()
    const handleOrientationChange = () => {
      // Delay per orientationchange per permettere al browser di aggiornare le dimensioni
      setTimeout(updateScreenInfo, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [updateScreenInfo])

  // Funzioni utility per impostazioni video ottimali
  const getOptimalVideoSettings = useCallback((isPatient: boolean = true) => {
    const { width, pixelRatio, screenType } = screenInfo
    
    let idealWidth = 1280
    let idealHeight = 720
    let frameRate = 30

    if (isPatient) {
      // Impostazioni per vista paziente (qualità più alta)
      switch (screenType) {
        case '4K+':
          idealWidth = 1920
          idealHeight = 1080
          frameRate = 30
          break
        case 'ultra-wide':
        case 'large-desktop':
          idealWidth = 1280
          idealHeight = 720
          frameRate = 30
          break
        case 'desktop':
          idealWidth = 1280
          idealHeight = 720
          frameRate = 30
          break
        case 'laptop':
          idealWidth = 1280
          idealHeight = 720
          frameRate = 24
          break
        case 'tablet/small-laptop':
          idealWidth = 960
          idealHeight = 540
          frameRate = 24
          break
        case 'mobile/small-tablet':
          idealWidth = 640
          idealHeight = 480
          frameRate = 20
          break
      }

      // Adatta per schermi ad alta densità
      if (pixelRatio >= 2 && screenType !== 'mobile/small-tablet') {
        idealWidth = Math.min(idealWidth * 1.2, 1920)
        idealHeight = Math.min(idealHeight * 1.2, 1080)
      }
    } else {
      // Impostazioni per vista fisioterapista (performance ottimizzata)
      switch (screenType) {
        case '4K+':
        case 'ultra-wide':
        case 'large-desktop':
          idealWidth = 1280
          idealHeight = 720
          frameRate = 30
          break
        case 'desktop':
        case 'laptop':
          idealWidth = 1280
          idealHeight = 720
          frameRate = 30
          break
        case 'tablet/small-laptop':
          idealWidth = 960
          idealHeight = 540
          frameRate = 24
          break
        case 'mobile/small-tablet':
          idealWidth = 640
          idealHeight = 480
          frameRate = 20
          break
      }
    }

    return {
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
      frameRate: { ideal: frameRate },
      facingMode: 'user'
    }
  }, [screenInfo])

  // Funzione per ottenere classi CSS dinamiche
  const getResponsiveClasses = useCallback(() => {
    const { screenType, isTouch, orientation, isUltraWide } = screenInfo
    
    const classes = []
    
    // Classi base per tipo schermo
    classes.push(`screen-${screenType.replace(/[^a-zA-Z0-9]/g, '-')}`)
    
    // Classi per touch
    if (isTouch) classes.push('touch-device')
    
    // Classi per orientamento
    classes.push(`orientation-${orientation}`)
    
    // Classi per ultra-wide
    if (isUltraWide) classes.push('ultra-wide')
    
    return classes.join(' ')
  }, [screenInfo])

  return {
    screenInfo,
    getOptimalVideoSettings,
    getResponsiveClasses,
    updateScreenInfo
  }
}