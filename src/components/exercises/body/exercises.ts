// Esercizi specifici per il corpo
export const BODY_EXERCISES = {
  kneeFlexion: {
    name: 'Flessione Ginocchio',
    description: 'Flessione e estensione del ginocchio',
    landmarks: [23, 24, 25], // Anca, ginocchio, caviglia
    validation: { type: 'angleMeasurement', minAngle: 45, maxAngle: 120, targetAngle: 90 }
  },
  elbowFlexion: {
    name: 'Flessione Gomito',
    description: 'Flessione e estensione del gomito',
    landmarks: [11, 12, 14], // Spalla, gomito, polso
    validation: { type: 'angleMeasurement', minAngle: 30, maxAngle: 150, targetAngle: 90 }
  },
  shoulderRotation: {
    name: 'Rotazione Spalla',
    description: 'Rotazione interna ed esterna della spalla',
    landmarks: [11, 12, 14], // Spalla, gomito, polso
    validation: { type: 'rotation', minAngle: -45, maxAngle: 45, targetAngle: 0 }
  },
  hipFlexion: {
    name: 'Flessione Anca',
    description: 'Flessione dell\'anca',
    landmarks: [23, 24, 25], // Anca, ginocchio, caviglia
    validation: { type: 'angleMeasurement', minAngle: 0, maxAngle: 90, targetAngle: 45 }
  }
}

export type BodyExerciseType = keyof typeof BODY_EXERCISES
