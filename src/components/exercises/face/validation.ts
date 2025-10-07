export const FACE_VALIDATIONS = {
  expression: {
    name: 'Espressione Facciale',
    description: 'Rileva espressioni facciali specifiche',
    requiredLandmarks: 5,
    validation: { 
      type: 'expression', 
      targetExpression: 'smile', 
      confidence: 0.7 
    }
  },
  movement: {
    name: 'Movimento Facciale',
    description: 'Rileva movimenti specifici del viso',
    requiredLandmarks: 3,
    validation: { 
      type: 'movement', 
      movementType: 'blink', 
      minDuration: 100 
    }
  },
  symmetry: {
    name: 'Simmetria Facciale',
    description: 'Verifica la simmetria tra i lati del viso',
    requiredLandmarks: 6,
    validation: { 
      type: 'symmetry', 
      tolerance: 0.1, 
      targetRatio: 1.0 
    }
  }
}

export type FaceValidationType = keyof typeof FACE_VALIDATIONS
