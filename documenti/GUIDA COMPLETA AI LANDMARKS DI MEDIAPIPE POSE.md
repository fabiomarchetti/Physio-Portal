/**
 * GUIDA COMPLETA AI LANDMARKS DI MEDIAPIPE
 * 
 * MediaPipe offre diverse soluzioni per il rilevamento di punti chiave:
 * 
 * 1. MediaPipe Pose: rileva 33 punti sul corpo umano (0-32)
 * 2. MediaPipe Hands (Mani): rileva 21 punti chiave per ogni mano
 * 3. MediaPipe Face Mesh (Volto): rileva 478 punti per una griglia dettagliata del volto
 * 
 * Ogni landmark ha coordinate x, y, z e un valore di visibility (confidenza).
 */

// TUTTI I 33 LANDMARKS DI MEDIAPIPE
export const POSE_LANDMARKS_COMPLETE = {
  // TESTA (0-10)
  NOSE: 0,                    // Naso
  LEFT_EYE_INNER: 1,         // Angolo interno occhio sinistro
  LEFT_EYE: 2,               // Centro occhio sinistro
  LEFT_EYE_OUTER: 3,         // Angolo esterno occhio sinistro
  RIGHT_EYE_INNER: 4,        // Angolo interno occhio destro
  RIGHT_EYE: 5,              // Centro occhio destro
  RIGHT_EYE_OUTER: 6,        // Angolo esterno occhio destro
  LEFT_EAR: 7,               // Orecchio sinistro
  RIGHT_EAR: 8,              // Orecchio destro
  MOUTH_LEFT: 9,             // Angolo sinistro della bocca
  MOUTH_RIGHT: 10,           // Angolo destro della bocca

  // PARTE SUPERIORE DEL CORPO (11-22)
  LEFT_SHOULDER: 11,         // Spalla sinistra
  RIGHT_SHOULDER: 12,        // Spalla destra
  LEFT_ELBOW: 13,           // Gomito sinistro
  RIGHT_ELBOW: 14,          // Gomito destro
  LEFT_WRIST: 15,           // Polso sinistro
  RIGHT_WRIST: 16,          // Polso destro
  LEFT_PINKY: 17,           // Mignolo sinistro
  RIGHT_PINKY: 18,          // Mignolo destro
  LEFT_INDEX: 19,           // Indice sinistro
  RIGHT_INDEX: 20,          // Indice destro
  LEFT_THUMB: 21,           // Pollice sinistro
  RIGHT_THUMB: 22,          // Pollice destro

  // PARTE INFERIORE DEL CORPO (23-32)
  LEFT_HIP: 23,             // Anca sinistra
  RIGHT_HIP: 24,            // Anca destra
  LEFT_KNEE: 25,            // Ginocchio sinistro
  RIGHT_KNEE: 26,           // Ginocchio destro
  LEFT_ANKLE: 27,           // Caviglia sinistra
  RIGHT_ANKLE: 28,          // Caviglia destra
  LEFT_HEEL: 29,            // Tallone sinistro
  RIGHT_HEEL: 30,           // Tallone destro
  LEFT_FOOT_INDEX: 31,      // Punta piede sinistro
  RIGHT_FOOT_INDEX: 32      // Punta piede destro
} as const

/**
 * STRUTTURA DI UN LANDMARK
 * 
 * Ogni landmark restituito da MediaPipe ha questa struttura:
 * {
 *   x: number,      // Coordinata X normalizzata (0-1) rispetto alla larghezza dell'immagine
 *   y: number,      // Coordinata Y normalizzata (0-1) rispetto all'altezza dell'immagine
 *   z: number,      // Profondità stimata (più piccolo = più vicino alla camera)
 *   visibility?: number  // Confidenza del rilevamento (0-1), opzionale
 * }
 */

// ESEMPIO DI UTILIZZO
interface PoseLandmark {
  x: number      // Es: 0.5 = centro orizzontale dell'immagine
  y: number      // Es: 0.3 = 30% dall'alto dell'immagine
  z: number      // Es: -0.1 = leggermente davanti al piano di riferimento
  visibility?: number  // Es: 0.95 = 95% di confidenza che il punto sia visibile
}

// CONNESSIONI TRA I LANDMARKS (per disegnare lo scheletro)
export const POSE_CONNECTIONS = [
  // Faccia
  [0, 1], [1, 2], [2, 3], [3, 7],     // Occhio sinistro
  [0, 4], [4, 5], [5, 6], [6, 8],     // Occhio destro
  [9, 10],                              // Bocca

  // Torso
  [11, 12],                             // Spalle
  [11, 23], [12, 24],                   // Spalle-anche
  [23, 24],                             // Anche

  // Braccio sinistro
  [11, 13], [13, 15],                   // Spalla-gomito-polso
  [15, 17], [15, 19], [15, 21],        // Polso-dita
  [17, 19],                             // Mignolo-indice

  // Braccio destro
  [12, 14], [14, 16],                   // Spalla-gomito-polso
  [16, 18], [16, 20], [16, 22],        // Polso-dita
  [18, 20],                             // Mignolo-indice

  // Gamba sinistra
  [23, 25], [25, 27],                   // Anca-ginocchio-caviglia
  [27, 29], [29, 31],                   // Caviglia-tallone-punta
  [27, 31],                             // Caviglia-punta

  // Gamba destra
  [24, 26], [26, 28],                   // Anca-ginocchio-caviglia
  [28, 30], [30, 32],                   // Caviglia-tallone-punta
  [28, 32]                              // Caviglia-punta
]

/**
 * PERCHÉ ABBIAMO SELEZIONATO SOLO ALCUNI LANDMARKS?
 * 
 * Nel codice originale abbiamo estratto solo i landmarks principali perché:
 * 
 * 1. PERFORMANCE: Meno punti = calcoli più veloci
 * 2. RILEVANZA: Per la fisioterapia, le articolazioni principali sono più importanti
 * 3. AFFIDABILITÀ: I punti delle articolazioni maggiori hanno visibility più alta
 * 4. SEMPLICITÀ: Più facile calcolare angoli e metriche con punti chiave
 */

// LANDMARKS ESSENZIALI PER FISIOTERAPIA
export const ESSENTIAL_LANDMARKS = {
  // Punti di riferimento centrale
  NOSE: 0,           // Per orientamento testa

  // Articolazioni superiori
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,

  // Articolazioni inferiori
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
} as const

/**
 * CALCOLO DEGLI ANGOLI TRA TRE PUNTI
 * 
 * Per calcolare il ROM (Range of Motion) di un'articolazione,
 * usiamo tre punti per formare un angolo:
 * 
 * Esempio per il gomito:
 * - Punto A: Spalla (SHOULDER)
 * - Punto B: Gomito (ELBOW) <- vertice dell'angolo
 * - Punto C: Polso (WRIST)
 * 
 * L'angolo ABC ci dà il grado di flessione del gomito
 */

// ESEMPI DI CALCOLO ANGOLI PER DIVERSE ARTICOLAZIONI
export const JOINT_ANGLE_DEFINITIONS = {
  // Arto superiore
  SHOULDER_FLEXION: {
    pointA: 'ELBOW',
    vertex: 'SHOULDER', 
    pointC: 'HIP',
    normalRange: { min: 0, max: 180 }  // Gradi
  },
  
  ELBOW_FLEXION: {
    pointA: 'SHOULDER',
    vertex: 'ELBOW',
    pointC: 'WRIST',
    normalRange: { min: 0, max: 150 }
  },

  // Arto inferiore
  HIP_FLEXION: {
    pointA: 'SHOULDER',
    vertex: 'HIP',
    pointC: 'KNEE',
    normalRange: { min: 0, max: 125 }
  },

  KNEE_FLEXION: {
    pointA: 'HIP',
    vertex: 'KNEE',
    pointC: 'ANKLE',
    normalRange: { min: 0, max: 140 }
  }
}

/**
 * COORDINATE E SISTEMI DI RIFERIMENTO
 * 
 * 1. COORDINATE IMMAGINE (poseLandmarks):
 *    - x, y: normalizzate 0-1
 *    - (0,0) = angolo superiore sinistro
 *    - (1,1) = angolo inferiore destro
 *    - z: profondità relativa
 * 
 * 2. COORDINATE MONDO (worldLandmarks):
 *    - x, y, z in metri
 *    - Origine al centro delle anche
 *    - x: destra/sinistra
 *    - y: alto/basso 
 *    - z: avanti/dietro
 */

// FUNZIONI UTILITY PER LAVORARE CON I LANDMARKS
export const LandmarkUtils = {
  // Converte coordinate normalizzate in pixel
  toPixelCoords: (landmark: PoseLandmark, width: number, height: number) => ({
    x: landmark.x * width,
    y: landmark.y * height,
    z: landmark.z
  }),

  // Calcola distanza euclidea tra due landmarks
  distance: (a: PoseLandmark, b: PoseLandmark) => {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    )
  },

  // Verifica se un landmark è affidabile
  isReliable: (landmark: PoseLandmark, threshold = 0.5) => {
    return landmark.visibility !== undefined && landmark.visibility > threshold
  },

  // Calcola il centro tra due landmarks
  midpoint: (a: PoseLandmark, b: PoseLandmark): PoseLandmark => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility || 0, b.visibility || 0)
  })
}

/**
 * MEDIAPIPE HANDS - LANDMARKS DELLE MANI
 * 
 * Ogni mano rilevata ha 21 landmarks (0-20):
 * 
 * POLSO E POLLICE (0-4):
 * 0: WRIST - Polso
 * 1: THUMB_CMC - Articolazione carpometacarpale del pollice
 * 2: THUMB_MCP - Articolazione metacarpofalangea del pollice  
 * 3: THUMB_IP - Articolazione interfalangea del pollice
 * 4: THUMB_TIP - Punta del pollice
 * 
 * DITO INDICE (5-8):
 * 5: INDEX_FINGER_MCP - Metacarpofalangea indice
 * 6: INDEX_FINGER_PIP - Interfalangea prossimale indice
 * 7: INDEX_FINGER_DIP - Interfalangea distale indice
 * 8: INDEX_FINGER_TIP - Punta dell'indice
 * 
 * DITO MEDIO (9-12):
 * 9: MIDDLE_FINGER_MCP - Metacarpofalangea medio
 * 10: MIDDLE_FINGER_PIP - Interfalangea prossimale medio
 * 11: MIDDLE_FINGER_DIP - Interfalangea distale medio
 * 12: MIDDLE_FINGER_TIP - Punta del medio
 * 
 * DITO ANULARE (13-16):
 * 13: RING_FINGER_MCP - Metacarpofalangea anulare
 * 14: RING_FINGER_PIP - Interfalangea prossimale anulare
 * 15: RING_FINGER_DIP - Interfalangea distale anulare
 * 16: RING_FINGER_TIP - Punta dell'anulare
 * 
 * DITO MIGNOLO (17-20):
 * 17: PINKY_MCP - Metacarpofalangea mignolo
 * 18: PINKY_PIP - Interfalangea prossimale mignolo
 * 19: PINKY_DIP - Interfalangea distale mignolo
 * 20: PINKY_TIP - Punta del mignolo
 */

export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5, INDEX_FINGER_PIP: 6, INDEX_FINGER_DIP: 7, INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9, MIDDLE_FINGER_PIP: 10, MIDDLE_FINGER_DIP: 11, MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13, RING_FINGER_PIP: 14, RING_FINGER_DIP: 15, RING_FINGER_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
} as const

/**
 * MEDIAPIPE FACE MESH - LANDMARKS DEL VOLTO
 * 
 * Face Mesh rileva 478 punti di riferimento che mappano la geometria 3D del viso.
 * I punti sono organizzati in regioni specifiche:
 * 
 * REGIONI PRINCIPALI:
 * - Contorno del viso: punti per il perimetro facciale
 * - Occhi: landmarks dettagliati per palpebra superiore e inferiore, pupilla
 * - Sopracciglia: punti lungo l'arco sopraccigliare
 * - Naso: dalle narici alla punta, compresi i lati
 * - Labbra: contorno esterno e interno della bocca
 * - Interno bocca: denti e lingua quando visibili
 * 
 * I 478 punti forniscono una griglia triangolare che permette:
 * - Ricostruzione 3D accurata del volto
 * - Tracking delle espressioni facciali
 * - Analisi dei movimenti muscolari facciali
 * - Applicazioni AR/VR per sovrapposizione di oggetti virtuali
 */

/**
 * USO NEL CONTESTO FISIOTERAPICO
 * 
 * 1. MEDIAPIPE POSE - VALUTAZIONE POSTURALE:
 *    - Allineamento spalle (11 vs 12)
 *    - Allineamento anche (23 vs 24)
 *    - Inclinazione testa (0 rispetto a linea spalle)
 * 
 * 2. RANGE OF MOTION:
 *    - Flessione/estensione articolazioni
 *    - Abduzione/adduzione arti
 *    - Rotazioni
 * 
 * 3. MEDIAPIPE HANDS - RIABILITAZIONE MANO:
 *    - Analisi presa e pinza
 *    - Range di movimento dita
 *    - Coordinazione fine
 *    - Recupero post-trauma o chirurgia
 * 
 * 4. MEDIAPIPE FACE MESH - RIABILITAZIONE FACCIALE:
 *    - Paralisi facciale (Bell, ictus)
 *    - Asimmetrie muscolari
 *    - Esercizi di mimica facciale
 *    - Valutazione deglutizione
 * 
 * 5. SIMMETRIA E PROGRESSI:
 *    - Confronto lato destro vs sinistro
 *    - Miglioramento ROM nel tempo
 *    - Riduzione compensazioni
 *    - Aumento stabilità e controllo
 */