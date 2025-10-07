'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BODY_LANDMARKS, BODY_CONNECTIONS } from './body/landmarks'
import { HAND_LANDMARKS, HAND_CONNECTIONS } from './hands/landmarks'
import { FACE_LANDMARKS, FACE_CONNECTIONS } from './face/landmarks'

interface LandmarkImageSelectorProps {
  type: 'body' | 'hands' | 'face'
  suggested: number[]
  selected: number[]
  onLandmarkChange: (landmarks: number[]) => void
}

export const LandmarkImageSelector = ({
  type,
  suggested,
  selected,
  onLandmarkChange
}: LandmarkImageSelectorProps) => {
  const [hoveredLandmark, setHoveredLandmark] = useState<number | null>(null)

  // Seleziona i landmark appropriati in base al tipo
  const getLandmarks = useCallback(() => {
    switch (type) {
      case 'body':
        return BODY_LANDMARKS
      case 'hands':
        return HAND_LANDMARKS
      case 'face':
        return FACE_LANDMARKS
      default:
        return {}
    }
  }, [type])

  const getConnections = useCallback(() => {
    switch (type) {
      case 'body':
        return BODY_CONNECTIONS
      case 'hands':
        return HAND_CONNECTIONS
      case 'face':
        return FACE_CONNECTIONS
      default:
        return []
    }
  }, [type])

  const getImageSrc = useCallback(() => {
    switch (type) {
      case 'body':
        return '/img/corpo.svg'
      case 'hands':
        return '/img/mano.svg'
      case 'face':
        return '/img/viso.svg'
      default:
        return '/img/corpo.svg'
    }
  }, [type])

  const getImageAlt = useCallback(() => {
    switch (type) {
      case 'body':
        return 'Anatomia del corpo umano'
      case 'hands':
        return 'Anatomia della mano'
      case 'face':
        return 'Anatomia del viso'
      default:
        return 'Anatomia'
    }
  }, [type])

  // Gestisce il click su un landmark
  const handleLandmarkClick = useCallback((landmarkId: number) => {
    const newSelected = selected.includes(landmarkId)
      ? selected.filter(id => id !== landmarkId)
      : [...selected, landmarkId]
    
    onLandmarkChange(newSelected)
  }, [selected, onLandmarkChange])

  // Gestisce il click sull'immagine per aggiungere landmark
  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Trova il landmark più vicino al click
    const landmarks = getLandmarks()
    let closestLandmark: number | null = null
    let minDistance = Infinity
    
    Object.entries(landmarks).forEach(([id, name]) => {
      const landmarkId = parseInt(id)
      const landmarkPosition = getLandmarkPosition(landmarkId, type)
      
      if (landmarkPosition) {
        const distance = Math.sqrt(
          Math.pow(x - landmarkPosition.x, 2) + Math.pow(y - landmarkPosition.y, 2)
        )
        
        if (distance < minDistance && distance < 30) { // Raggio di 30px
          minDistance = distance
          closestLandmark = landmarkId
        }
      }
    })
    
    if (closestLandmark !== null) {
      handleLandmarkClick(closestLandmark)
    }
  }, [type, getLandmarks, handleLandmarkClick])

  // Ottiene la posizione di un landmark sull'immagine
  const getLandmarkPosition = (landmarkId: number, landmarkType: string) => {
    // Posizioni predefinite per ogni tipo di landmark
    const positions: { [key: string]: { [key: number]: { x: number; y: number } } } = {
      body: {
        0: { x: 50, y: 10 },   // Naso
        11: { x: 25, y: 25 },  // Spalla sinistra
        14: { x: 75, y: 25 },  // Spalla destra
        23: { x: 30, y: 70 },  // Anca sinistra
        26: { x: 70, y: 70 },  // Anca destra
        24: { x: 25, y: 85 },  // Ginocchio sinistro
        27: { x: 75, y: 85 },  // Ginocchio destro
        25: { x: 20, y: 95 },  // Caviglia sinistra
        28: { x: 80, y: 95 }   // Caviglia destra
      },
      hands: {
        0: { x: 50, y: 50 },   // Polso
        1: { x: 35, y: 40 },   // Pollice metacarpo
        4: { x: 25, y: 30 },   // Pollice falange distale
        5: { x: 60, y: 45 },   // Indice metacarpo
        8: { x: 70, y: 35 },   // Indice falange distale
        9: { x: 65, y: 50 },   // Medio metacarpo
        12: { x: 75, y: 40 },  // Medio falange distale
        13: { x: 70, y: 55 },  // Anulare metacarpo
        16: { x: 80, y: 45 },  // Anulare falange distale
        17: { x: 75, y: 60 },  // Mignolo metacarpo
        20: { x: 85, y: 50 }   // Mignolo falange distale
      },
      face: {
        0: { x: 50, y: 30 },   // Naso
        1: { x: 40, y: 25 },   // Occhio sinistro interno
        4: { x: 60, y: 25 },   // Occhio destro interno
        9: { x: 45, y: 40 },   // Bocca sinistra
        10: { x: 55, y: 40 },  // Bocca destra
        15: { x: 50, y: 50 }   // Mento
      }
    }
    
    return positions[landmarkType]?.[landmarkId] || null
  }

  const landmarks = getLandmarks()
  const connections = getConnections()

  return (
    <div className="space-y-4">
      {/* Immagine interattiva */}
      <div className="relative">
        <div
          className="relative cursor-crosshair select-none"
          onClick={handleImageClick}
          style={{ width: '100%', height: 'auto' }}
        >
          <img
            src={getImageSrc()}
            alt={getImageAlt()}
            className="w-full h-auto max-h-[400px] object-contain"
          />
          
          {/* Disegna le connessioni */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
          >
            {connections.map((connection, index) => {
              const start = getLandmarkPosition(connection[0], type)
              const end = getLandmarkPosition(connection[1], type)
              
              if (start && end) {
                return (
                  <line
                    key={index}
                    x1={`${start.x}%`}
                    y1={`${start.y}%`}
                    x2={`${end.x}%`}
                    y2={`${end.y}%`}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                )
              }
              return null
            })}
          </svg>
          
          {/* Disegna i landmark */}
          {Object.entries(landmarks).map(([id, name]) => {
            const landmarkId = parseInt(id)
            const position = getLandmarkPosition(landmarkId, type)
            
            if (!position) return null
            
            const isSelected = selected.includes(landmarkId)
            const isSuggested = suggested.includes(landmarkId)
            const isHovered = hoveredLandmark === landmarkId
            
            let bgColor = '#6b7280' // Default grigio
            let borderColor = '#374151'
            
            if (isSelected) {
              bgColor = '#10b981' // Verde per selezionati
              borderColor = '#047857'
            } else if (isSuggested) {
              bgColor = '#3b82f6' // Blu per suggeriti
              borderColor = '#1d4ed8'
            }
            
            if (isHovered) {
              bgColor = '#f59e0b' // Arancione per hover
              borderColor = '#d97706'
            }
            
            return (
              <div
                key={landmarkId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  zIndex: 20
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLandmarkClick(landmarkId)
                }}
                onMouseEnter={() => setHoveredLandmark(landmarkId)}
                onMouseLeave={() => setHoveredLandmark(null)}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-all duration-200"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  {landmarkId}
                </div>
                
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-30">
                    {name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Lista landmark selezionati */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">
          Punti selezionati ({selected.length}):
        </h4>
        
        {selected.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nessun punto selezionato. Clicca sull'immagine o sui punti per selezionarli.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map(landmarkId => (
              <Badge
                key={landmarkId}
                variant="secondary"
                className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                onClick={() => handleLandmarkClick(landmarkId)}
              >
                {landmarkId}: {landmarks[landmarkId]}
                <span className="ml-1 text-red-500">×</span>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Azioni rapide */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allLandmarks = Object.keys(landmarks).map(Number)
            onLandmarkChange(allLandmarks)
          }}
        >
          Seleziona tutti
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLandmarkChange([])}
        >
          Deseleziona tutti
        </Button>
        
        {suggested.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLandmarkChange(suggested)}
          >
            Solo suggeriti
          </Button>
        )}
      </div>
    </div>
  )
}
