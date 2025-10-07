export const FACE_EXERCISES = {
  smile: {
    name: 'Sorriso',
    description: 'Esercizio per il sorriso',
    landmarks: [0, 1, 2, 3, 4], // Punti della bocca
    validation: { type: 'expression', targetExpression: 'smile', confidence: 0.7 }
  },
  blink: {
    name: 'Ammiccamento',
    description: 'Esercizio per l\'ammiccamento',
    landmarks: [5, 6, 7, 8], // Punti degli occhi
    validation: { type: 'movement', movementType: 'blink', minDuration: 100 }
  },
  eyebrow: {
    name: 'Movimento Sopracciglia',
    description: 'Sollevamento delle sopracciglia',
    landmarks: [9, 10, 11, 12], // Punti delle sopracciglia
    validation: { type: 'movement', movementType: 'eyebrow', minDuration: 500 }
  }
}

export type FaceExerciseType = keyof typeof FACE_EXERCISES
