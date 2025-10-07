export const HAND_VALIDATIONS = {
  angleMeasurement: {
    name: 'Misurazione Angolo',
    description: 'Calcola l\'angolo tra tre punti della mano',
    requiredLandmarks: 3,
    validation: { 
      type: 'angleMeasurement', 
      minAngle: 0, 
      maxAngle: 180, 
      targetAngle: 90, 
      tolerance: 5 
    }
  },
  distance: {
    name: 'Misurazione Distanza',
    description: 'Misura la distanza tra due punti della mano',
    requiredLandmarks: 2,
    validation: { 
      type: 'distance', 
      minDistance: 0, 
      maxDistance: 200, 
      targetDistance: 100 
    }
  },
  movement: {
    name: 'Movimento Mano',
    description: 'Rileva movimenti specifici della mano',
    requiredLandmarks: 4,
    validation: { 
      type: 'movement', 
      movementType: 'flexion', 
      minDuration: 1000 
    }
  },
  grip: {
    name: 'Presa',
    description: 'Rileva la chiusura della presa',
    requiredLandmarks: 5,
    validation: { 
      type: 'grip', 
      gripType: 'pinch', 
      confidence: 0.8 
    }
  }
}

export type HandValidationType = keyof typeof HAND_VALIDATIONS
