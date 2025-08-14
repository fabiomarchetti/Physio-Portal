/**
 * GUIDA COMPLETA AI LANDMARKS DI MEDIAPIPE - VERSIONE ITALIANA
 * 
 * MediaPipe offre diverse soluzioni per il rilevamento di punti chiave:
 * 
 * 1. MediaPipe Pose: rileva 33 punti sul corpo umano (0-32)
 * 2. MediaPipe Hands (Mani): rileva 21 punti chiave per ogni mano
 * 3. MediaPipe Face Mesh (Volto): rileva 478 punti per una griglia dettagliata del volto
 * 
 * Ogni landmark ha coordinate x, y, z e un valore di visibilità (confidenza).
 */

// TUTTI I 33 LANDMARKS DI MEDIAPIPE TRADOTTI IN ITALIANO
export const PUNTI_POSA_COMPLETI = {
  // TESTA (0-10)
  NASO: 0,                         // Naso
  OCCHIO_SINISTRO_INTERNO: 1,      // Angolo interno occhio sinistro
  OCCHIO_SINISTRO: 2,              // Centro occhio sinistro
  OCCHIO_SINISTRO_ESTERNO: 3,      // Angolo esterno occhio sinistro
  OCCHIO_DESTRO_INTERNO: 4,        // Angolo interno occhio destro
  OCCHIO_DESTRO: 5,                // Centro occhio destro
  OCCHIO_DESTRO_ESTERNO: 6,        // Angolo esterno occhio destro
  ORECCHIO_SINISTRO: 7,            // Orecchio sinistro
  ORECCHIO_DESTRO: 8,              // Orecchio destro
  BOCCA_SINISTRA: 9,               // Angolo sinistro della bocca
  BOCCA_DESTRA: 10,                // Angolo destro della bocca

  // PARTE SUPERIORE DEL CORPO (11-22)
  SPALLA_SINISTRA: 11,             // Spalla sinistra
  SPALLA_DESTRA: 12,               // Spalla destra
  GOMITO_SINISTRO: 13,             // Gomito sinistro
  GOMITO_DESTRO: 14,               // Gomito destro
  POLSO_SINISTRO: 15,              // Polso sinistro
  POLSO_DESTRO: 16,                // Polso destro
  MIGNOLO_SINISTRO: 17,            // Mignolo sinistro
  MIGNOLO_DESTRO: 18,              // Mignolo destro
  INDICE_SINISTRO: 19,             // Indice sinistro
  INDICE_DESTRO: 20,               // Indice destro
  POLLICE_SINISTRO: 21,            // Pollice sinistro
  POLLICE_DESTRO: 22,              // Pollice destro

  // PARTE INFERIORE DEL CORPO (23-32)
  ANCA_SINISTRA: 23,               // Anca sinistra
  ANCA_DESTRA: 24,                 // Anca destra
  GINOCCHIO_SINISTRO: 25,          // Ginocchio sinistro
  GINOCCHIO_DESTRO: 26,            // Ginocchio destro
  CAVIGLIA_SINISTRA: 27,           // Caviglia sinistra
  CAVIGLIA_DESTRA: 28,             // Caviglia destra
  TALLONE_SINISTRO: 29,            // Tallone sinistro
  TALLONE_DESTRO: 30,              // Tallone destro
  PUNTA_PIEDE_SINISTRO: 31,        // Punta piede sinistro
  PUNTA_PIEDE_DESTRO: 32           // Punta piede destro
} as const

/**
 * STRUTTURA DI UN PUNTO LANDMARK
 * 
 * Ogni punto restituito da MediaPipe ha questa struttura:
 * {
 *   x: number,      // Coordinata X normalizzata (0-1) rispetto alla larghezza dell'immagine
 *   y: number,      // Coordinata Y normalizzata (0-1) rispetto all'altezza dell'immagine
 *   z: number,      // Profondità stimata (più piccolo = più vicino alla camera)
 *   visibility?: number  // Confidenza del rilevamento (0-1), opzionale
 * }
 */

// ESEMPIO DI UTILIZZO
interface PuntoPosa {
  x: number      // Es: 0.5 = centro orizzontale dell'immagine
  y: number      // Es: 0.3 = 30% dall'alto dell'immagine
  z: number      // Es: -0.1 = leggermente davanti al piano di riferimento
  visibilita?: number  // Es: 0.95 = 95% di confidenza che il punto sia visibile
}

// CONNESSIONI TRA I LANDMARKS (per disegnare lo scheletro)
export const CONNESSIONI_POSA = [
  // Volto
  [0, 1], [1, 2], [2, 3], [3, 7],     // Occhio sinistro
  [0, 4], [4, 5], [5, 6], [6, 8],     // Occhio destro
  [9, 10],                              // Bocca

  // Tronco
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
 * Nel codice originale abbiamo estratto solo i punti principali perché:
 * 
 * 1. PRESTAZIONI: Meno punti = calcoli più veloci
 * 2. RILEVANZA: Per la fisioterapia, le articolazioni principali sono più importanti
 * 3. AFFIDABILITÀ: I punti delle articolazioni maggiori hanno visibilità più alta
 * 4. SEMPLICITÀ: Più facile calcolare angoli e metriche con punti chiave
 */

// LANDMARKS ESSENZIALI PER FISIOTERAPIA TRADOTTI
export const PUNTI_ESSENZIALI = {
  // Punti di riferimento centrale
  NASO: 0,                    // Per orientamento testa

  // Articolazioni superiori
  SPALLA_SINISTRA: 11,
  SPALLA_DESTRA: 12,
  GOMITO_SINISTRO: 13,
  GOMITO_DESTRO: 14,
  POLSO_SINISTRO: 15,
  POLSO_DESTRO: 16,

  // Articolazioni inferiori
  ANCA_SINISTRA: 23,
  ANCA_DESTRA: 24,
  GINOCCHIO_SINISTRO: 25,
  GINOCCHIO_DESTRO: 26,
  CAVIGLIA_SINISTRA: 27,
  CAVIGLIA_DESTRA: 28
} as const

/**
 * CALCOLO DEGLI ANGOLI TRA TRE PUNTI
 * 
 * Per calcolare il ROM (Ampiezza di Movimento) di un'articolazione,
 * usiamo tre punti per formare un angolo:
 * 
 * Esempio per il gomito:
 * - Punto A: Spalla (SPALLA)
 * - Punto B: Gomito (GOMITO) <- vertice dell'angolo
 * - Punto C: Polso (POLSO)
 * 
 * L'angolo ABC ci dà il grado di flessione del gomito
 */

// ESEMPI DI CALCOLO ANGOLI PER DIVERSE ARTICOLAZIONI TRADOTTI
export const DEFINIZIONI_ANGOLI_ARTICOLAZIONI = {
  // Arto superiore
  FLESSIONE_SPALLA: {
    puntoA: 'GOMITO',
    vertice: 'SPALLA', 
    puntoC: 'ANCA',
    rangeNormale: { min: 0, max: 180 }  // Gradi
  },
  
  FLESSIONE_GOMITO: {
    puntoA: 'SPALLA',
    vertice: 'GOMITO',
    puntoC: 'POLSO',
    rangeNormale: { min: 0, max: 150 }
  },

  // Arto inferiore
  FLESSIONE_ANCA: {
    puntoA: 'SPALLA',
    vertice: 'ANCA',
    puntoC: 'GINOCCHIO',
    rangeNormale: { min: 0, max: 125 }
  },

  FLESSIONE_GINOCCHIO: {
    puntoA: 'ANCA',
    vertice: 'GINOCCHIO',
    puntoC: 'CAVIGLIA',
    rangeNormale: { min: 0, max: 140 }
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

// FUNZIONI UTILITY PER LAVORARE CON I LANDMARKS TRADOTTE
export const UtilitaPunti = {
  // Converte coordinate normalizzate in pixel
  aCoordinatePixel: (punto: PuntoPosa, larghezza: number, altezza: number) => ({
    x: punto.x * larghezza,
    y: punto.y * altezza,
    z: punto.z
  }),

  // Calcola distanza euclidea tra due punti
  distanza: (a: PuntoPosa, b: PuntoPosa) => {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    )
  },

  // Verifica se un punto è affidabile
  eAffidabile: (punto: PuntoPosa, soglia = 0.5) => {
    return punto.visibilita !== undefined && punto.visibilita > soglia
  },

  // Calcola il punto medio tra due punti
  puntoMedio: (a: PuntoPosa, b: PuntoPosa): PuntoPosa => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibilita: Math.min(a.visibilita || 0, b.visibilita || 0)
  })
}

/**
 * MEDIAPIPE HANDS - LANDMARKS DELLE MANI TRADOTTI
 * 
 * Ogni mano rilevata ha 21 punti (0-20):
 * 
 * POLSO E POLLICE (0-4):
 * 0: POLSO - Polso
 * 1: POLLICE_CMC - Articolazione carpometacarpale del pollice
 * 2: POLLICE_MCP - Articolazione metacarpofalangea del pollice  
 * 3: POLLICE_IP - Articolazione interfalangea del pollice
 * 4: PUNTA_POLLICE - Punta del pollice
 * 
 * DITO INDICE (5-8):
 * 5: INDICE_MCP - Metacarpofalangea indice
 * 6: INDICE_PIP - Interfalangea prossimale indice
 * 7: INDICE_DIP - Interfalangea distale indice
 * 8: PUNTA_INDICE - Punta dell'indice
 * 
 * DITO MEDIO (9-12):
 * 9: MEDIO_MCP - Metacarpofalangea medio
 * 10: MEDIO_PIP - Interfalangea prossimale medio
 * 11: MEDIO_DIP - Interfalangea distale medio
 * 12: PUNTA_MEDIO - Punta del medio
 * 
 * DITO ANULARE (13-16):
 * 13: ANULARE_MCP - Metacarpofalangea anulare
 * 14: ANULARE_PIP - Interfalangea prossimale anulare
 * 15: ANULARE_DIP - Interfalangea distale anulare
 * 16: PUNTA_ANULARE - Punta dell'anulare
 * 
 * DITO MIGNOLO (17-20):
 * 17: MIGNOLO_MCP - Metacarpofalangea mignolo
 * 18: MIGNOLO_PIP - Interfalangea prossimale mignolo
 * 19: MIGNOLO_DIP - Interfalangea distale mignolo
 * 20: PUNTA_MIGNOLO - Punta del mignolo
 */

export const PUNTI_MANO = {
  POLSO: 0,
  POLLICE_CMC: 1, POLLICE_MCP: 2, POLLICE_IP: 3, PUNTA_POLLICE: 4,
  INDICE_MCP: 5, INDICE_PIP: 6, INDICE_DIP: 7, PUNTA_INDICE: 8,
  MEDIO_MCP: 9, MEDIO_PIP: 10, MEDIO_DIP: 11, PUNTA_MEDIO: 12,
  ANULARE_MCP: 13, ANULARE_PIP: 14, ANULARE_DIP: 15, PUNTA_ANULARE: 16,
  MIGNOLO_MCP: 17, MIGNOLO_PIP: 18, MIGNOLO_DIP: 19, PUNTA_MIGNOLO: 20
} as const

/**
 * MEDIAPIPE FACE MESH - LANDMARKS DEL VOLTO
 * 
 * Face Mesh rileva 478 punti di riferimento che mappano la geometria 3D del viso.
 * I punti sono organizzati in regioni specifiche:
 * 
 * REGIONI PRINCIPALI:
 * - Contorno del viso: punti per il perimetro facciale
 * - Occhi: punti dettagliati per palpebra superiore e inferiore, pupilla
 * - Sopracciglia: punti lungo l'arco sopraccigliare
 * - Naso: dalle narici alla punta, compresi i lati
 * - Labbra: contorno esterno e interno della bocca
 * - Interno bocca: denti e lingua quando visibili
 * 
 * I 478 punti forniscono una griglia triangolare che permette:
 * - Ricostruzione 3D accurata del volto
 * - Monitoraggio delle espressioni facciali
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
 * 2. AMPIEZZA DI MOVIMENTO (ROM):
 *    - Flessione/estensione articolazioni
 *    - Abduzione/adduzione arti
 *    - Rotazioni
 * 
 * 3. MEDIAPIPE HANDS - RIABILITAZIONE MANO:
 *    - Analisi della presa e della pinza
 *    - Ampiezza di movimento delle dita
 *    - Coordinazione motoria fine
 *    - Recupero post-trauma o chirurgia
 * 
 * 4. MEDIAPIPE FACE MESH - RIABILITAZIONE FACCIALE:
 *    - Paralisi facciale (Bell, ictus)
 *    - Asimmetrie muscolari
 *    - Esercizi di mimica facciale
 *    - Valutazione della deglutizione
 * 
 * 5. SIMMETRIA E PROGRESSI NEL TEMPO:
 *    - Confronto lato destro vs sinistro
 *    - Miglioramento ROM nel tempo
 *    - Riduzione delle compensazioni motorie
 *    - Aumento della stabilità e controllo muscolare
 * 
 * GLOSSARIO TECNICO:
 * - ROM: Range of Motion = Ampiezza di Movimento
 * - Landmark: Punto di riferimento anatomico
 * - Visibility: Visibilità/Confidenza del rilevamento
 * - MCP: Metacarpofalangea (articolazione tra metacarpo e falange)
 * - PIP: Interfalangea Prossimale (prima articolazione del dito)
 * - DIP: Interfalangea Distale (seconda articolazione del dito)
 * - CMC: Carpometacarpale (articolazione tra carpo e metacarpo)
 */