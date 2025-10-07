// Landmark MediaPipe Hands per le mani
export const HAND_LANDMARKS = {
  0: 'Polso',
  1: 'Pollice metacarpo',
  2: 'Pollice falange prossimale',
  3: 'Pollice falange intermedia',
  4: 'Pollice falange distale',
  5: 'Indice metacarpo',
  6: 'Indice falange prossimale',
  7: 'Indice falange intermedia',
  8: 'Indice falange distale',
  9: 'Medio metacarpo',
  10: 'Medio falange prossimale',
  11: 'Medio falange intermedia',
  12: 'Medio falange distale',
  13: 'Anulare metacarpo',
  14: 'Anulare falange prossimale',
  15: 'Anulare falange intermedia',
  16: 'Anulare falange distale',
  17: 'Mignolo metacarpo',
  18: 'Mignolo falange prossimale',
  19: 'Mignolo falange intermedia',
  20: 'Mignolo falange distale'
}

export const HAND_CONNECTIONS = [
  // Pollice
  [0, 1], [1, 2], [2, 3], [3, 4],
  
  // Indice
  [0, 5], [5, 6], [6, 7], [7, 8],
  
  // Medio
  [0, 9], [9, 10], [10, 11], [11, 12],
  
  // Anulare
  [0, 13], [13, 14], [14, 15], [15, 16],
  
  // Mignolo
  [0, 17], [17, 18], [18, 19], [19, 20],
  
  // Connessioni trasversali (palmo)
  [5, 9], [9, 13], [13, 17]
]

export const HAND_LANDMARK_GROUPS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
  wrist: [0],
  palm: [0, 5, 9, 13, 17]
}
