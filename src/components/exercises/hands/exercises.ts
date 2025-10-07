// Esercizi specifici per le mani
export const HAND_EXERCISES = {
  thumbFlexion: {
    name: 'Flessione Pollice',
    description: 'Piegamento del pollice verso il palmo',
    landmarks: [0, 1, 2, 3, 4], // Polso + pollice completo
    validation: { type: 'angleMeasurement', minAngle: 0, maxAngle: 90, targetAngle: 45 }
  },
  fingerSpread: {
    name: 'Apertura Dita',
    description: 'Apertura e chiusura delle dita',
    landmarks: [0, 5, 9, 13, 17], // Polso + punte delle dita
    validation: { type: 'distance', minDistance: 50, maxDistance: 150, targetDistance: 100 }
  },
  wristFlexion: {
    name: 'Flessione Polso',
    description: 'Movimento su e giù del polso',
    landmarks: [0, 5, 9], // Polso + dita medie
    validation: { type: 'movement', movementType: 'flexion', minDuration: 2000 }
  },
  pinchGrip: {
    name: 'Presa a Pinza',
    description: 'Toccare pollice e indice',
    landmarks: [0, 4, 8], // Polso + pollice + indice
    validation: { type: 'grip', gripType: 'pinch', confidence: 0.8 }
  }
}

export type HandExerciseType = keyof typeof HAND_EXERCISES
