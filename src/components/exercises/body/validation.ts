// Validazioni specifiche per esercizi del corpo
export const BODY_VALIDATIONS = {
  angleMeasurement: {
    name: 'Misurazione Angolo',
    description: 'Calcola l\'angolo tra tre punti del corpo',
    requiredLandmarks: 3,
    validation: { 
      type: 'angleMeasurement', 
      minAngle: 0, 
      maxAngle: 180, 
      targetAngle: 90, 
      tolerance: 5 
    }
  },
  rotation: {
    name: 'Rotazione',
    description: 'Misura la rotazione di un segmento corporeo',
    requiredLandmarks: 3,
    validation: { 
      type: 'rotation', 
      minAngle: -90, 
      maxAngle: 90, 
      targetAngle: 0, 
      tolerance: 10 
    }
  },
  movement: {
    name: 'Movimento',
    description: 'Rileva movimenti specifici del corpo',
    requiredLandmarks: 4,
    validation: { 
      type: 'movement', 
      movementType: 'flexion', 
      minDuration: 2000 
    }
  },
  posture: {
    name: 'Postura',
    description: 'Verifica la corretta postura',
    requiredLandmarks: 6,
    validation: { 
      type: 'posture', 
      postureType: 'standing', 
      confidence: 0.8 
    }
  }
}

export type BodyValidationType = keyof typeof BODY_VALIDATIONS
