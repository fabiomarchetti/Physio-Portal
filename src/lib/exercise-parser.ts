import { BODY_LANDMARKS, BODY_LANDMARK_GROUPS } from '@/components/exercises/body'
import { HAND_LANDMARKS, HAND_LANDMARK_GROUPS } from '@/components/exercises/hands'
import { FACE_LANDMARKS, FACE_LANDMARK_GROUPS } from '@/components/exercises/face'

export interface ParsedExercise {
  areas: string[]
  suggestedLandmarks: {
    body: number[]
    hands: number[]
    face: number[]
  }
  validation: {
    type: string
    handLandmark?: number
    bodyLandmark?: number
    faceLandmark?: number
    maxDistance?: number
    minDuration?: number
    minAngle?: number
    maxAngle?: number
  }
  confidence: number
}

export interface ExercisePattern {
  keywords: string[]
  areas: string[]
  landmarks: {
    body: number[]
    hands: number[]
    face: number[]
  }
  validation: any
  confidence: number
}

// Pattern predefiniti per esercizi comuni
const EXERCISE_PATTERNS: ExercisePattern[] = [
  // Pattern: "tocca con la mano il [parte del corpo]"
  {
    keywords: ['tocca', 'mano', 'ginocchio'],
    areas: ['hands', 'body'],
    landmarks: {
      body: [24, 25, 26], // Ginocchio + caviglia + piede
      hands: [0, 1, 2, 3, 4], // Polso + pollice
      face: []
    },
    validation: {
      type: 'handToBody',
      handLandmark: 0, // Polso
      bodyLandmark: 24, // Ginocchio
      maxDistance: 100,
      minDuration: 3000
    },
    confidence: 0.95
  },
  
  // Pattern: "tocca con la mano la [parte del viso]"
  {
    keywords: ['tocca', 'mano', 'naso'],
    areas: ['hands', 'face'],
    landmarks: {
      body: [],
      hands: [0, 1, 2, 3, 4], // Polso + pollice
      face: [0, 1, 4] // Naso + occhi (riferimento)
    },
    validation: {
      type: 'handToFace',
      handLandmark: 0, // Polso
      faceLandmark: 0, // Naso
      maxDistance: 80,
      minDuration: 2000
    },
    confidence: 0.90
  },
  
  // Pattern: "flessione [parte del corpo]"
  {
    keywords: ['flessione', 'ginocchio'],
    areas: ['body'],
    landmarks: {
      body: [23, 24, 25, 26, 27, 28], // Anche + ginocchia + caviglie
      hands: [],
      face: []
    },
    validation: {
      type: 'angleMeasurement',
      bodyLandmarks: [23, 24, 25], // Anca, ginocchio, caviglia
      minAngle: 45,
      maxAngle: 120,
      targetAngle: 90
    },
    confidence: 0.85
  },
  
  // Pattern: "rotazione [parte del corpo]"
  {
    keywords: ['rotazione', 'collo', 'testa'],
    areas: ['body'],
    landmarks: {
      body: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Testa completa
      hands: [],
      face: []
    },
    validation: {
      type: 'rotation',
      bodyLandmarks: [0, 11, 14], // Naso, spalle
      minRotation: -45,
      maxRotation: 45,
      targetRotation: 0
    },
    confidence: 0.80
  },
  
  // Pattern: "movimento [parte del viso]"
  {
    keywords: ['movimento', 'bocca', 'espressione'],
    areas: ['face'],
    landmarks: {
      body: [],
      hands: [],
      face: [0, 9, 10, 15] // Naso, bocca, mento
    },
    validation: {
      type: 'faceExpression',
      faceLandmarks: [9, 10], // Bocca
      minMovement: 10,
      maxMovement: 50
    },
    confidence: 0.75
  }
]

// Funzione principale per analizzare la descrizione
export const parseExerciseDescription = (description: string): ParsedExercise => {
  const lowerDesc = description.toLowerCase()
  
  // Trova il pattern più adatto
  let bestMatch: ExercisePattern | null = null
  let bestScore = 0
  
  for (const pattern of EXERCISE_PATTERNS) {
    const score = calculatePatternScore(lowerDesc, pattern)
    if (score > bestScore) {
      bestScore = score
      bestMatch = pattern
    }
  }
  
  // Se non trova match perfetto, usa fallback intelligente
  if (!bestMatch || bestScore < 0.5) {
    return createFallbackConfig(lowerDesc)
  }
  
  // Personalizza il pattern in base alla descrizione
  return customizePattern(bestMatch, lowerDesc)
}

// Calcola il punteggio di match per un pattern
const calculatePatternScore = (description: string, pattern: ExercisePattern): number => {
  let score = 0
  let matchedKeywords = 0
  
  for (const keyword of pattern.keywords) {
    if (description.includes(keyword)) {
      matchedKeywords++
      score += 0.3
    }
  }
  
  // Bonus per match multipli
  if (matchedKeywords >= 2) {
    score += 0.2
  }
  
  // Bonus per pattern specifici
  if (description.includes('ginocchio') && pattern.keywords.includes('ginocchio')) {
    score += 0.3
  }
  
  if (description.includes('mano') && pattern.keywords.includes('mano')) {
    score += 0.3
  }
  
  return Math.min(score, 1.0)
}

// Crea configurazione di fallback intelligente
const createFallbackConfig = (description: string): ParsedExercise => {
  const areas: string[] = []
  const bodyLandmarks: number[] = []
  const handsLandmarks: number[] = []
  const faceLandmarks: number[] = []
  
  // Analisi semantica di base
  if (description.includes('mano') || description.includes('dita') || description.includes('pollice')) {
    areas.push('hands')
    handsLandmarks.push(...HAND_LANDMARK_GROUPS.palm)
  }
  
  if (description.includes('corpo') || description.includes('braccio') || description.includes('gamba')) {
    areas.push('body')
    bodyLandmarks.push(...BODY_LANDMARK_GROUPS.torso)
  }
  
  if (description.includes('viso') || description.includes('occhio') || description.includes('bocca')) {
    areas.push('face')
    faceLandmarks.push(...FACE_LANDMARK_GROUPS.eyes, ...FACE_LANDMARK_GROUPS.mouth)
  }
  
  // Se non ha aree specifiche, usa corpo completo
  if (areas.length === 0) {
    areas.push('body')
    bodyLandmarks.push(...Object.keys(BODY_LANDMARKS).map(Number))
  }
  
  return {
    areas,
    suggestedLandmarks: {
      body: bodyLandmarks,
      hands: handsLandmarks,
      face: faceLandmarks
    },
    validation: {
      type: 'basic',
      maxDistance: 150,
      minDuration: 2000
    },
    confidence: 0.6
  }
}

// Personalizza il pattern in base alla descrizione
const customizePattern = (pattern: ExercisePattern, description: string): ParsedExercise => {
  const customized = { ...pattern }
  
  // Personalizzazioni specifiche
  if (description.includes('sinistro') || description.includes('left')) {
    // Filtra solo landmark sinistri
    customized.landmarks.body = customized.landmarks.body.filter(id => 
      [11, 12, 13, 17, 18, 19, 23, 24, 25, 29, 31].includes(id)
    )
  }
  
  if (description.includes('destro') || description.includes('right')) {
    // Filtra solo landmark destri
    customized.landmarks.body = customized.landmarks.body.filter(id => 
      [14, 15, 16, 20, 21, 22, 26, 27, 28, 30, 32].includes(id)
    )
  }
  
  if (description.includes('pollice') || description.includes('thumb')) {
    customized.landmarks.hands = [0, 1, 2, 3, 4] // Solo pollice
  }
  
  if (description.includes('indice') || description.includes('index')) {
    customized.landmarks.hands = [0, 5, 6, 7, 8] // Solo indice
  }
  
  return {
    areas: customized.areas,
    suggestedLandmarks: customized.landmarks,
    validation: customized.validation,
    confidence: customized.confidence
  }
}

// Utility per ottenere landmark per parte del corpo specifica
export const getBodyPartLandmarks = (bodyPart: string): number[] => {
  const part = bodyPart.toLowerCase()
  
  switch (part) {
    case 'testa':
    case 'head':
      return BODY_LANDMARK_GROUPS.head
    case 'braccio sinistro':
    case 'left arm':
      return BODY_LANDMARK_GROUPS.leftArm
    case 'braccio destro':
    case 'right arm':
      return BODY_LANDMARK_GROUPS.rightArm
    case 'gamba sinistra':
    case 'left leg':
      return BODY_LANDMARK_GROUPS.leftLeg
    case 'gamba destra':
    case 'right leg':
      return BODY_LANDMARK_GROUPS.rightLeg
    case 'torso':
      return BODY_LANDMARK_GROUPS.torso
    default:
      return []
  }
}

// Utility per ottenere landmark per dito specifico
export const getFingerLandmarks = (finger: string): number[] => {
  const f = finger.toLowerCase()
  
  switch (f) {
    case 'pollice':
    case 'thumb':
      return HAND_LANDMARK_GROUPS.thumb
    case 'indice':
    case 'index':
      return HAND_LANDMARK_GROUPS.index
    case 'medio':
    case 'middle':
      return HAND_LANDMARK_GROUPS.middle
    case 'anulare':
    case 'ring':
      return HAND_LANDMARK_GROUPS.ring
    case 'mignolo':
    case 'pinky':
      return HAND_LANDMARK_GROUPS.pinky
    default:
      return []
  }
}
