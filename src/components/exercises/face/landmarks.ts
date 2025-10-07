// Landmark MediaPipe Face per il viso
export const FACE_LANDMARKS = {
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
  11: 'Sopracciglio sinistro',
  12: 'Sopracciglio destro',
  13: 'Guancia sinistra',
  14: 'Guancia destra',
  15: 'Mento'
}

export const FACE_CONNECTIONS = [
  // Occhi
  [1, 2], [2, 3], [4, 5], [5, 6],
  
  // Sopracciglia
  [1, 11], [4, 12],
  
  // Naso
  [0, 1], [0, 4], [0, 15],
  
  // Bocca
  [9, 10], [9, 15], [10, 15],
  
  // Contorno viso
  [7, 13], [8, 14], [13, 15], [14, 15]
]

export const FACE_LANDMARK_GROUPS = {
  eyes: [1, 2, 3, 4, 5, 6],
  eyebrows: [11, 12],
  nose: [0],
  mouth: [9, 10],
  chin: [15],
  cheeks: [13, 14],
  ears: [7, 8]
}
