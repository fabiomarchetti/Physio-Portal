'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, RotateCcw, Info } from 'lucide-react'
import { toast } from 'sonner'

// Definizione dei 33 landmark di MediaPipe Pose
const POSE_LANDMARKS = {
  // Viso (0-10)
  0: { name: 'Naso', x: 500, y: 80 },
  1: { name: 'Occhio interno sinistro', x: 480, y: 60 },
  2: { name: 'Occhio sinistro', x: 465, y: 60 },
  3: { name: 'Occhio esterno sinistro', x: 450, y: 60 },
  4: { name: 'Occhio interno destro', x: 520, y: 60 },
  5: { name: 'Occhio destro', x: 535, y: 60 },
  6: { name: 'Occhio esterno destro', x: 550, y: 60 },
  7: { name: 'Orecchio sinistro', x: 430, y: 80 },
  8: { name: 'Orecchio destro', x: 570, y: 80 },
  9: { name: 'Bocca sinistra', x: 480, y: 110 },
  10: { name: 'Bocca destra', x: 520, y: 110 },
  
  // Spalle e braccia (11-22)
  11: { name: 'Spalla sinistra', x: 400, y: 180 },
  12: { name: 'Spalla destra', x: 600, y: 180 },
  13: { name: 'Gomito sinistro', x: 350, y: 280 },
  14: { name: 'Gomito destro', x: 650, y: 280 },
  15: { name: 'Polso sinistro', x: 300, y: 380 },
  16: { name: 'Polso destro', x: 700, y: 380 },
  17: { name: 'Mignolo sinistro', x: 270, y: 410 },
  18: { name: 'Mignolo destro', x: 730, y: 410 },
  19: { name: 'Indice sinistro', x: 260, y: 390 },
  20: { name: 'Indice destro', x: 740, y: 390 },
  21: { name: 'Pollice sinistro', x: 290, y: 360 },
  22: { name: 'Pollice destro', x: 710, y: 360 },
  
  // Bacino e gambe (23-32)
  23: { name: 'Anca sinistra', x: 450, y: 410 },
  24: { name: 'Anca destra', x: 550, y: 410 },
  25: { name: 'Ginocchio sinistro', x: 420, y: 560 },
  26: { name: 'Ginocchio destro', x: 580, y: 560 },
  27: { name: 'Caviglia sinistra', x: 400, y: 710 },
  28: { name: 'Caviglia destra', x: 600, y: 710 },
  29: { name: 'Tallone sinistro', x: 370, y: 760 },
  30: { name: 'Tallone destro', x: 630, y: 760 },
  31: { name: 'Alluce sinistro', x: 420, y: 780 },
  32: { name: 'Alluce destro', x: 580, y: 780 }
}

// Connessioni per disegnare lo scheletro
const POSE_CONNECTIONS = [
  // Viso
  [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6],
  [0, 9], [0, 10], [9, 10],
  
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  
  // Braccio sinistro
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19],
  
  // Braccio destro
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [18, 20],
  
  // Gamba sinistra
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  
  // Gamba destra
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
]
 
// Helpers scaling orizzontale per aumentare la separazione dei punti senza alzare l'altezza
const VIEWBOX = { WIDTH: 1000, HEIGHT: 800, CX: 500 }
const H_STRETCH = 1.5
const sx = (x: number) => VIEWBOX.CX + (x - VIEWBOX.CX) * H_STRETCH

// =====================
// Landmark Mano (MediaPipe Hands - 21 punti)
// =====================
const HAND_LANDMARKS = {
  0: { name: 'Polso', x: 500, y: 720 },
  1: { name: 'Pollice CMC (carpo-metacarpale)', x: 430, y: 640 },
  2: { name: 'Pollice MCP (metacarpo-falangea)', x: 380, y: 560 },
  3: { name: 'Pollice IP (interfalangea)', x: 340, y: 490 },
  4: { name: 'Pollice Punta', x: 310, y: 440 },
  5: { name: 'Indice MCP', x: 520, y: 520 },
  6: { name: 'Indice PIP', x: 520, y: 430 },
  7: { name: 'Indice DIP', x: 520, y: 360 },
  8: { name: 'Indice Punta', x: 520, y: 300 },
  9: { name: 'Medio MCP', x: 580, y: 520 },
  10: { name: 'Medio PIP', x: 580, y: 410 },
  11: { name: 'Medio DIP', x: 580, y: 330 },
  12: { name: 'Medio Punta', x: 580, y: 260 },
  13: { name: 'Anulare MCP', x: 635, y: 540 },
  14: { name: 'Anulare PIP', x: 640, y: 430 },
  15: { name: 'Anulare DIP', x: 645, y: 350 },
  16: { name: 'Anulare Punta', x: 650, y: 290 },
  17: { name: 'Mignolo MCP', x: 690, y: 580 },
  18: { name: 'Mignolo PIP', x: 720, y: 490 },
  19: { name: 'Mignolo DIP', x: 740, y: 430 },
  20: { name: 'Mignolo Punta', x: 760, y: 380 }
} as const

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
] as const

const CATEGORIE_LANDMARKS_MANO = {
  pollice: [1, 2, 3, 4],
  indice: [5, 6, 7, 8],
  medio: [9, 10, 11, 12],
  anulare: [13, 14, 15, 16],
  mignolo: [17, 18, 19, 20],
  palmo: [0, 5, 9, 13, 17]
}

// Categorizzazione landmarks per parti del corpo
export const CATEGORIE_LANDMARKS = {
  testa: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  tronco: [11, 12, 23, 24],
  braccia: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  gambe: [25, 26, 27, 28, 29, 30, 31, 32]
}

// Colori per le parti del corpo
export const COLORI_PARTI_CORPO = {
  testa: 'bg-blue-500',
  tronco: 'bg-green-500',
  braccia: 'bg-orange-500',
  gambe: 'bg-purple-500'
}

interface LandmarkSelectorProps {
  onSave?: (esercizio: EsercizioPerDatabase) => void
  onCancel?: () => void
  onChange?: (data: { parti_corpo_coinvolte: string[], configurazione_mediapipe: any }) => void
  esercizioEsistente?: EsercizioConfigurato
  categoriaEsercizio?: {
    id: number
    nome_categoria: string
  }
  landmarkType?: 'pose' | 'hand'
  hideForm?: boolean
}

export interface EsercizioConfigurato {
  nome: string
  descrizione: string
  istruzioni: string
  difficolta: 'facile' | 'medio' | 'difficile'
  durata_consigliata_minuti: number
  landmarks_selezionati: number[]
  parti_corpo_coinvolte: string[]
  configurazione_mediapipe: {
    landmarks_target: number[]
    soglia_confidenza: number
    range_movimento_min: number
    range_movimento_max: number
    tipo_esercizio: 'angle' | 'distance' | 'movement'
    parametriCalcolo?: {
      angolo_target?: number
      distanza_target?: number
      range_movimento?: number
    }
  }
}

export interface EsercizioPerDatabase {
  nome_esercizio: string
  descrizione_esecuzione: string
  note?: string
  parti_corpo_coinvolte?: string[]
  configurazione_mediapipe?: {
    landmarks_target: number[]
    soglia_confidenza: number
    range_movimento_min: number
    range_movimento_max: number
    tipo_esercizio: 'angle' | 'distance' | 'movement'
    parametriCalcolo?: {
      angolo_target?: number
      distanza_target?: number
      range_movimento?: number
    }
  }
}

export function LandmarkSelector({ onSave, onCancel, onChange, esercizioEsistente, categoriaEsercizio, landmarkType = 'pose', hideForm = false }: LandmarkSelectorProps) {
  const [selectedPoints, setSelectedPoints] = useState<number[]>(
    esercizioEsistente?.landmarks_selezionati || []
  )
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [exerciseMode, setExerciseMode] = useState<'angle' | 'distance' | 'movement'>(
    esercizioEsistente?.configurazione_mediapipe?.tipo_esercizio || 'movement'
  )
  const [zoom, setZoom] = useState(1)
  const [esercizio, setEsercizio] = useState({
    nome: esercizioEsistente?.nome || '',
    descrizione: esercizioEsistente?.descrizione || '',
    istruzioni: esercizioEsistente?.istruzioni || ''
  })

  // Pre-compila la categoria se fornita
  React.useEffect(() => {
    if (categoriaEsercizio) {
      setEsercizio(prev => ({
        ...prev,
        nome: prev.nome || `Esercizio ${categoriaEsercizio.nome_categoria}`,
        descrizione: prev.descrizione || `Esercizio per ${categoriaEsercizio.nome_categoria.toLowerCase()}`,
        istruzioni: prev.istruzioni || `Esegui l'esercizio seguendo le istruzioni per ${categoriaEsercizio.nome_categoria.toLowerCase()}`
      }))
    }
  }, [categoriaEsercizio])
 
  // Riduci zoom e altezza quando si lavora con la mano
  React.useEffect(() => {
    if (landmarkType === 'hand') {
      setZoom(0.9)
    } else {
      setZoom(1)
    }
  }, [landmarkType])

  // Dataset dinamico per corpo/mano
  const LANDMARKS: Record<number, { name: string; x: number; y: number }> = (landmarkType === 'hand' ? HAND_LANDMARKS : POSE_LANDMARKS)
  const CONNECTIONS: Array<[number, number]> = (landmarkType === 'hand' ? HAND_CONNECTIONS as unknown as Array<[number, number]> : POSE_CONNECTIONS as unknown as Array<[number, number]>)
  const topY = Math.min(...Object.values(LANDMARKS).map(p => p.y))
  const desiredTop = 120 // Desired top margin for the highest landmark
  const vOffset = landmarkType === 'hand' ? Math.max(0, topY - desiredTop) : 0
  const currentZoom = landmarkType === 'hand' ? 0.9 : 1; // Smaller zoom for hand
  const currentViewBoxHeight = landmarkType === 'hand' ? 520 : 800; // Smaller height for hand

  // Funzione per calcolare l'angolo tra tre punti
  const calculateAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const a = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    const b = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2))
    const c = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2))
    
    const angle = Math.acos((a * a + b * b - c * c) / (2 * a * b))
    return Math.round((angle * 180) / Math.PI)
  }

  // Funzione per calcolare la distanza tra due punti
  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.round(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)))
  }

  // Funzione per calcolare il range di movimento
  const calculateMovementRange = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return 0
    
    let totalDistance = 0
    for (let i = 1; i < points.length; i++) {
      totalDistance += calculateDistance(points[i - 1], points[i])
    }
    return Math.round(totalDistance)
  }

  const handlePointClick = (pointId: number) => {
    setSelectedPoints(prev => {
      if (prev.includes(pointId)) {
        return prev.filter(id => id !== pointId)
      } else {
        if (exerciseMode === 'angle' && prev.length >= 3) {
          return [pointId]
        } else if (exerciseMode === 'distance' && prev.length >= 2) {
          return [pointId]
        } else {
          return [...prev, pointId]
        }
      }
    })
  }

  // Funzione per determinare le parti del corpo coinvolte (DETTAGLIATA)
  const getSelectedBodyParts = (): string[] => {
    const partiCorpoCoinvolte: string[] = []

    if (landmarkType === 'hand') {
      // Per le mani, aggiungi i nomi specifici dei landmark
      selectedPoints.forEach(pointId => {
        const landmark = HAND_LANDMARKS[pointId as keyof typeof HAND_LANDMARKS]
        if (landmark) {
          partiCorpoCoinvolte.push(landmark.name)
        }
      })
    } else {
      // Per il corpo, aggiungi i nomi specifici dei landmark MediaPipe Pose
      selectedPoints.forEach(pointId => {
        const landmark = POSE_LANDMARKS[pointId as keyof typeof POSE_LANDMARKS]
        if (landmark) {
          partiCorpoCoinvolte.push(landmark.name)
        }
      })
    }

    return partiCorpoCoinvolte
  }

  // Funzione per calcolare parametri specifici per tipo esercizio
  const getParametriCalcolo = () => {
    let parametriCalcolo: any = {}

    if (exerciseMode === 'angle' && selectedPoints.length === 3) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const angle = calculateAngle(points[0], points[1], points[2])
      parametriCalcolo = { angolo_target: angle }
    } else if (exerciseMode === 'distance' && selectedPoints.length === 2) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const distance = calculateDistance(points[0], points[1])
      parametriCalcolo = { distanza_target: distance }
    }

    return parametriCalcolo
  }

  // Notifica cambiamenti in tempo reale quando onChange è fornito
  React.useEffect(() => {
    if (onChange && selectedPoints.length > 0) {
      const partiCorpo = getSelectedBodyParts()
      const configurazione = {
        landmarks_target: selectedPoints,
        soglia_confidenza: 0.7,
        range_movimento_min: 0,
        range_movimento_max: 180,
        tipo_esercizio: exerciseMode,
        parametriCalcolo: getParametriCalcolo()
      }

      onChange({
        parti_corpo_coinvolte: partiCorpo,
        configurazione_mediapipe: configurazione
      })
    }
  }, [selectedPoints, exerciseMode, onChange])

  const getCalculationResult = () => {
    if (exerciseMode === 'angle' && selectedPoints.length === 3) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const angle = calculateAngle(points[0], points[1], points[2])
      return `Angolo: ${angle.toFixed(1)}°`
    } else if (exerciseMode === 'distance' && selectedPoints.length === 2) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const distance = calculateDistance(points[0], points[1])
      return `Distanza: ${distance.toFixed(1)} pixel`
    }
    return ''
  }

  const clearSelection = () => {
    setSelectedPoints([])
  }

  const getExerciseInstructions = () => {
    switch (exerciseMode) {
      case 'angle':
        return 'Seleziona 3 punti per misurare un angolo (vertice al centro)'
      case 'distance':
        return 'Seleziona 2 punti per misurare la distanza'
      case 'movement':
        return 'Seleziona punti per creare un esercizio di movimento'
      default:
        return ''
    }
  }

  // Aggiorna parti del corpo coinvolte quando cambiano i landmarks
  React.useEffect(() => {
    const partiCoinvolte = new Set<string>()
    
    if (landmarkType === 'hand') {
      selectedPoints.forEach(landmarkId => {
        if (CATEGORIE_LANDMARKS_MANO.pollice.includes(landmarkId)) partiCoinvolte.add('pollice')
        if (CATEGORIE_LANDMARKS_MANO.indice.includes(landmarkId)) partiCoinvolte.add('indice')
        if (CATEGORIE_LANDMARKS_MANO.medio.includes(landmarkId)) partiCoinvolte.add('medio')
        if (CATEGORIE_LANDMARKS_MANO.anulare.includes(landmarkId)) partiCoinvolte.add('anulare')
        if (CATEGORIE_LANDMARKS_MANO.mignolo.includes(landmarkId)) partiCoinvolte.add('mignolo')
        if (CATEGORIE_LANDMARKS_MANO.palmo.includes(landmarkId)) partiCoinvolte.add('palmo')
      })
    } else {
      selectedPoints.forEach(landmarkId => {
        if (CATEGORIE_LANDMARKS.testa.includes(landmarkId)) partiCoinvolte.add('testa')
        if (CATEGORIE_LANDMARKS.tronco.includes(landmarkId)) partiCoinvolte.add('tronco')
        if (CATEGORIE_LANDMARKS.braccia.includes(landmarkId)) partiCoinvolte.add('braccia')
        if (CATEGORIE_LANDMARKS.gambe.includes(landmarkId)) partiCoinvolte.add('gambe')
      })
    }

    setEsercizio(prev => ({
      ...prev,
      parti_corpo_coinvolte: Array.from(partiCoinvolte)
    }))
  }, [selectedPoints])

  // Gestione input form
  const handleInputChange = (field: keyof EsercizioConfigurato, value: string | number) => {
    setEsercizio(prev => ({ ...prev, [field]: value }))
  }

  // Salvataggio esercizio
  const handleSave = () => {
    if (!esercizio.nome?.trim()) {
      toast.error('Inserisci un nome per l\'esercizio')
      return
    }

    if (!esercizio.descrizione?.trim()) {
      toast.error('Inserisci una descrizione per l\'esercizio')
      return
    }

    // Determina automaticamente le parti del corpo coinvolte basandosi sui landmarks selezionati
    const partiCorpoCoinvolte: string[] = []
    
    if (landmarkType === 'hand') {
      // Per i landmark della mano, determina le dita/palmo coinvolti
      const ditaCoinvolte = new Set<string>()
      
      selectedPoints.forEach(pointId => {
        if (pointId >= 1 && pointId <= 4) ditaCoinvolte.add('pollice')
        else if (pointId >= 5 && pointId <= 8) ditaCoinvolte.add('indice')
        else if (pointId >= 9 && pointId <= 12) ditaCoinvolte.add('medio')
        else if (pointId >= 13 && pointId <= 16) ditaCoinvolte.add('anulare')
        else if (pointId >= 17 && pointId <= 20) ditaCoinvolte.add('mignolo')
        else if (pointId === 0) ditaCoinvolte.add('polso')
      })
      
      if (ditaCoinvolte.size > 0) {
        partiCorpoCoinvolte.push('mano')
        ditaCoinvolte.forEach(dito => partiCorpoCoinvolte.push(dito))
      }
    } else {
      // Per i landmark del corpo, determina le parti coinvolte
      const partiCoinvolte = new Set<string>()
      
      selectedPoints.forEach(pointId => {
        if (pointId >= 0 && pointId <= 10) partiCoinvolte.add('testa')
        else if (pointId >= 11 && pointId <= 12 || pointId >= 23 && pointId <= 24) partiCoinvolte.add('tronco')
        else if (pointId >= 13 && pointId <= 22) partiCoinvolte.add('braccia')
        else if (pointId >= 25 && pointId <= 32) partiCoinvolte.add('gambe')
      })
      
      partiCoinvolte.forEach(parte => partiCorpoCoinvolte.push(parte))
    }

    // Calcola parametri specifici per il tipo di esercizio
    let parametriCalcolo = {}
    if (exerciseMode === 'angle' && selectedPoints.length === 3) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const angle = calculateAngle(points[0], points[1], points[2])
      parametriCalcolo = { angolo_target: angle }
    } else if (exerciseMode === 'distance' && selectedPoints.length === 2) {
      const points = selectedPoints.map(id => (landmarkType === 'hand' ? HAND_LANDMARKS[id as keyof typeof HAND_LANDMARKS] : POSE_LANDMARKS[id as keyof typeof POSE_LANDMARKS]))
      const distance = calculateDistance(points[0], points[1])
      parametriCalcolo = { distanza_target: distance }
    }

    const esercizioCompleto = {
      nome: esercizio.nome,
      descrizione: esercizio.descrizione || '',
      istruzioni: esercizio.istruzioni || ''
    }

    // Costruisci la configurazione MediaPipe completa
    const configurazione_mediapipe = {
      landmarks_target: selectedPoints,
      soglia_confidenza: 0.7,
      range_movimento_min: 0,
      range_movimento_max: 180,
      tipo_esercizio: exerciseMode,
      parametriCalcolo
    }

    // Mappa i campi per il database
    const esercizioPerDatabase: EsercizioPerDatabase = {
      nome_esercizio: esercizioCompleto.nome,
      descrizione_esecuzione: esercizioCompleto.istruzioni,
      note: esercizioCompleto.descrizione,
      parti_corpo_coinvolte: partiCorpoCoinvolte,
      configurazione_mediapipe
    }

    console.log('Salvando esercizio con landmark:', esercizioPerDatabase)
    onSave?.(esercizioPerDatabase)
    toast.success('Configurazione landmark salvata!')
  }

  // Reset selezione
  const handleReset = () => {
    setSelectedPoints([])
    setEsercizio({
      nome: '',
      descrizione: '',
      istruzioni: ''
    })
  }

  return (
    <div className="w-full max-w-8xl mx-auto p-2 bg-white">
      <div className="mb-1">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          {/* Titolo + istruzioni inline */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-semibold text-gray-800 truncate">
              {landmarkType === 'hand' ? 'Sistema Landmarks Mano (MediaPipe Hands)' : 'Sistema di Landmark MediaPipe per Fisioterapia'}
            </h1>
            <span className="hidden md:inline text-xs text-gray-500 truncate">
              {getExerciseInstructions()}
            </span>
          </div>
          {/* Toolbar su un'unica riga (no wrap) */}
          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
            <div className="flex gap-1">
              <button
                onClick={() => setExerciseMode('angle')}
                className={`px-2 py-1 rounded text-xs ${exerciseMode === 'angle' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Misura Angoli
              </button>
              <button
                onClick={() => setExerciseMode('distance')}
                className={`px-2 py-1 rounded text-xs ${exerciseMode === 'distance' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Misura Distanze
              </button>
              <button
                onClick={() => setExerciseMode('movement')}
                className={`px-2 py-1 rounded text-xs ${exerciseMode === 'movement' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Movimento
              </button>
            </div>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Pulisci Selezione
            </button>
            {/* Zoom controls */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setZoom(z => Math.max(0.8, +(z - 0.1).toFixed(1)))}
                className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-50"
                title="Zoom -"
              >
                -
              </button>
              <span className="text-xs w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(1.25, +(z + 0.1).toFixed(1)))}
                className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-50"
                title="Zoom +"
              >
                +
              </button>
            </div>
          </div>
        </div>
        {getCalculationResult() && (
          <div className="mt-1 text-sm font-semibold text-blue-600">
            {getCalculationResult()}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-2 h-full">
        {/* Form Configurazione Esercizio - Nascosto se hideForm=true */}
        {!hideForm && (
        <div className="lg:w-64 flex-shrink-0">
          <Card className="w-full h-full">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-3 w-3" />
                Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div>
                <Label htmlFor="nome" className="text-xs">Nome Esercizio *</Label>
                <Input
                  id="nome"
                  value={esercizio.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Es. Flessione Gomito"
                  className="text-xs py-1"
                />
              </div>

              <div>
                <Label htmlFor="descrizione" className="text-xs">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  value={esercizio.descrizione}
                  onChange={(e) => handleInputChange('descrizione', e.target.value)}
                  placeholder="Descrizione breve dell'esercizio"
                  rows={1}
                  className="text-xs py-1"
                />
              </div>

              <div>
                <Label htmlFor="istruzioni" className="text-xs">Istruzioni</Label>
                <Textarea
                  id="istruzioni"
                  value={esercizio.istruzioni}
                  onChange={(e) => handleInputChange('istruzioni', e.target.value)}
                  placeholder="Istruzioni dettagliate per l'esecuzione"
                  rows={2}
                  className="text-xs py-1"
                />
              </div>



              {/* Statistiche Selezione */}
              <div className="bg-gray-50 p-1 rounded-lg">
                <h4 className="font-medium mb-1 text-xs">Statistiche</h4>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div>Landmarks: <span className="font-semibold text-blue-600">{selectedPoints.length}</span></div>
                </div>
                {selectedPoints.length > 0 && (
                  <div className="mt-0.5 text-xs text-gray-600">
                    {selectedPoints.map(id => LANDMARKS[id]?.name).slice(0, 2).join(', ')}
                    {selectedPoints.length > 2 && ` +${selectedPoints.length - 2}`}
                  </div>
                )}
              </div>

              {/* Azioni */}
              <div className="flex gap-1">
                <Button onClick={handleSave} size="sm" className="flex-1 text-xs py-0.5">
                  <Save className="h-3 w-3 mr-1" />
                  Salva
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs py-0.5">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                {onCancel && (
                  <Button variant="outline" size="sm" onClick={onCancel} className="text-xs py-0.5">
                    Annulla
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Area principale con i landmark */}
        <div className="flex-1 min-w-0">
          <Card className="h-full">
            <CardHeader className="py-1 border-b border-gray-100">
              <CardTitle className="text-sm">Selezione Landmarks MediaPipe</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
                style={{ width: '100%', height: landmarkType === 'hand' ? '70vh' : '75vh' }}
              >
                <svg
                  className="w-full h-full"
                  viewBox="0 0 1000 800"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g transform={`scale(${zoom})`}>
                    <g transform={`translate(0, -${vOffset})`}>
                  {/* Disegna le connessioni dello scheletro */}
                  {CONNECTIONS.map(([start, end], index) => (
                    <line
                      key={index}
                      x1={sx(LANDMARKS[start].x)}
                      y1={LANDMARKS[start].y}
                      x2={sx(LANDMARKS[end].x)}
                      y2={LANDMARKS[end].y}
                      stroke="#374151"
                      strokeWidth="2.75"
                      opacity="0.6"
                    />
                  ))}
                  
                  {/* Disegna le linee tra punti selezionati */}
                  {selectedPoints.length > 1 && (
                    selectedPoints.slice(1).map((pointId, index) => (
                      <line
                        key={`selected-${index}`}
                        x1={sx(LANDMARKS[selectedPoints[index]].x)}
                        y1={LANDMARKS[selectedPoints[index]].y}
                        x2={sx(LANDMARKS[pointId].x)}
                        y2={LANDMARKS[pointId].y}
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    ))
                  )}
                  
                  {/* Disegna i punti landmark */}
                  {(Object.entries(LANDMARKS) as Array<[string, { name: string; x: number; y: number }]>).map(([id, landmark]) => {
                    const pointId = parseInt(id)
                    const isSelected = selectedPoints.includes(pointId)
                    const isHovered = hoveredPoint === pointId
                    
                    return (
                      <g key={id}>
                        {/* Area di click invisibile più ampia */}
                        <circle
                          cx={sx(landmark.x)}
                          cy={landmark.y}
                          r="24"
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={() => handlePointClick(pointId)}
                          onMouseEnter={() => setHoveredPoint(pointId)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        
                        {/* Landmark visibile */}
                        <circle
                          cx={sx(landmark.x)}
                          cy={landmark.y}
                          r={isSelected ? 18 : isHovered ? 16 : 14}
                          fill={isSelected ? '#ef4444' : isHovered ? '#f87171' : '#dc2626'}
                          stroke={isSelected ? '#ffffff' : isHovered ? '#fecaca' : '#ffffff'}
                          strokeWidth={isSelected ? 4 : isHovered ? 3.5 : 3}
                          className="transition-all duration-150 ease-out pointer-events-none"
                        />
                        
                        {/* Numero del landmark */}
                        <text
                          x={sx(landmark.x)}
                          y={landmark.y + 5}
                          textAnchor="middle"
                          style={{ fontSize: 14, fontWeight: 800 }}
                          fill="#ffffff"
                          className="pointer-events-none"
                        >
                          {id}
                        </text>
                        
                        {/* Tooltip con nome del landmark */}
                        {isHovered && (
                          <g>
                            <rect
                              x={sx(landmark.x) - 60}
                              y={landmark.y - 35}
                              width="120"
                              height="20"
                              fill="#1f2937"
                              rx="4"
                              opacity="0.9"
                            />
                            <text
                              x={sx(landmark.x)}
                              y={landmark.y - 20}
                              textAnchor="middle"
                              className="text-xs fill-white font-medium"
                            >
                              {landmark.name}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                    </g>
                  </g>
                </svg>
              </div>
              
              {/* Informazioni sui punti selezionati */}
              {selectedPoints.length > 0 && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Punti Selezionati:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPoints.map(pointId => (
                      <span
                        key={pointId}
                        className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm"
                      >
                        {pointId}: {LANDMARKS[pointId]?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Legenda */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Legenda Landmark:</h3>
                {landmarkType === 'hand' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Dita</h4>
                      <p className="text-gray-600">Pollice (1-4), Indice (5-8), Medio (9-12), Anulare (13-16), Mignolo (17-20)</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Palmo</h4>
                      <p className="text-gray-600">Polso (0) e basi delle dita (5, 9, 13, 17)</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Viso (0-10)</h4>
                      <p className="text-gray-600">Naso, occhi, orecchie, bocca</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Braccia (11-22)</h4>
                      <p className="text-gray-600">Spalle, gomiti, polsi, dita</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Gambe (23-32)</h4>
                      <p className="text-gray-600">Anche, ginocchia, caviglie, piedi</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
