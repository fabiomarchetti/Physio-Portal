// Landmark MediaPipe Pose per il corpo completo
export const BODY_LANDMARKS = {
  0: 'Naso',
  1: 'Occhio sinistro interno',
  2: 'Occhio sinistro',
  3: 'Occhio sinistro esterno',
  4: 'Occhio destro interno',
  5: 'Occhio destro',
  6: 'Occhio destro esterno',
  7: 'Orecchio sinistro',
  8: 'Orecchio destro',
  9: 'Bocca sinistra',
  10: 'Bocca destra',
  11: 'Spalla sinistra',
  12: 'Gomito sinistro',
  13: 'Polso sinistro',
  14: 'Spalla destra',
  15: 'Gomito destro',
  16: 'Polso destro',
  17: 'Mignolo sinistro',
  18: 'Indice sinistro',
  19: 'Pollice sinistro',
  20: 'Mignolo destro',
  21: 'Indice destro',
  22: 'Pollice destro',
  23: 'Anca sinistra',
  24: 'Ginocchio sinistro',
  25: 'Caviglia sinistra',
  26: 'Anca destra',
  27: 'Ginocchio destro',
  28: 'Caviglia destra',
  29: 'Tallone sinistro',
  30: 'Tallone destro',
  31: 'Piede sinistro',
  32: 'Piede destro'
}

export const BODY_CONNECTIONS = [
  // Testa
  [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6],
  [0, 7], [0, 8], [9, 10],
  
  // Braccia sinistre
  [11, 12], [12, 13], [13, 17], [13, 18], [13, 19],
  
  // Braccia destre
  [14, 15], [15, 16], [16, 20], [16, 21], [16, 22],
  
  // Torso
  [11, 14], [11, 23], [14, 26],
  
  // Gambe sinistre
  [23, 24], [24, 25], [25, 29], [25, 31],
  
  // Gambe destre
  [26, 27], [27, 28], [28, 30], [28, 32]
]

export const BODY_LANDMARK_GROUPS = {
  head: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  leftArm: [11, 12, 13, 17, 18, 19],
  rightArm: [14, 15, 16, 20, 21, 22],
  torso: [11, 14, 23, 26],
  leftLeg: [23, 24, 25, 29, 31],
  rightLeg: [26, 27, 28, 30, 32]
}
