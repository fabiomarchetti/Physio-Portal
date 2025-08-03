// src/lib/computer-vision/motion-metrics.ts

// Definizione dei punti chiave del corpo
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
} as const

// Interfaccia per un punto 3D
interface Point3D {
  x: number
  y: number
  z: number
  visibility?: number
}

// Interfaccia per le metriche calcolate
export interface MotionMetrics {
  rom: RangeOfMotionMetrics
  velocity: VelocityMetrics
  stability: StabilityMetrics
  symmetry: SymmetryMetrics
}

interface RangeOfMotionMetrics {
  shoulderLeft: number
  shoulderRight: number
  elbowLeft: number
  elbowRight: number
  hipLeft: number
  hipRight: number
  kneeLeft: number
  kneeRight: number
}

interface VelocityMetrics {
  avgVelocity: number
  maxVelocity: number
  smoothness: number
}

interface StabilityMetrics {
  coreSway: number
  balanceScore: number
  tremor: number
}

interface SymmetryMetrics {
  upperBody: number
  lowerBody: number
  overall: number
}

export class MotionMetricsCalculator {
  private previousLandmarks: Point3D[] | null = null
  private landmarksHistory: Point3D[][] = []
  private timestamps: number[] = []
  private readonly HISTORY_SIZE = 30 // 1 secondo a 30fps

  // Calcola tutte le metriche
  public calculateMetrics(landmarks: Point3D[]): MotionMetrics {
    // Aggiungi alla storia
    this.updateHistory(landmarks)

    return {
      rom: this.calculateRangeOfMotion(landmarks),
      velocity: this.calculateVelocity(),
      stability: this.calculateStability(),
      symmetry: this.calculateSymmetry(landmarks)
    }
  }

  // Aggiorna la storia dei landmarks
  private updateHistory(landmarks: Point3D[]) {
    this.landmarksHistory.push(landmarks)
    this.timestamps.push(Date.now())

    // Mantieni solo gli ultimi N frame
    if (this.landmarksHistory.length > this.HISTORY_SIZE) {
      this.landmarksHistory.shift()
      this.timestamps.shift()
    }

    this.previousLandmarks = landmarks
  }

  // Calcola l'angolo tra tre punti
  private calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    
    if (angle > 180) {
      angle = 360 - angle
    }
    
    return angle
  }

  // Calcola la distanza tra due punti
  private calculateDistance(a: Point3D, b: Point3D): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    )
  }

  // Calcola il Range of Motion per ogni articolazione
  private calculateRangeOfMotion(landmarks: Point3D[]): RangeOfMotionMetrics {
    return {
      shoulderLeft: this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP]
      ),
      shoulderRight: this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_HIP]
      ),
      elbowLeft: this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      ),
      elbowRight: this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      ),
      hipLeft: this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE]
      ),
      hipRight: this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE]
      ),
      kneeLeft: this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      ),
      kneeRight: this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      )
    }
  }

  // Calcola le metriche di velocità
  private calculateVelocity(): VelocityMetrics {
    if (this.landmarksHistory.length < 2) {
      return { avgVelocity: 0, maxVelocity: 0, smoothness: 100 }
    }

    const velocities: number[] = []
    
    for (let i = 1; i < this.landmarksHistory.length; i++) {
      const dt = (this.timestamps[i] - this.timestamps[i - 1]) / 1000 // in secondi
      const prevLandmarks = this.landmarksHistory[i - 1]
      const currLandmarks = this.landmarksHistory[i]
      
      // Calcola velocità media di tutti i punti
      let totalVelocity = 0
      let validPoints = 0
      
      for (let j = 0; j < currLandmarks.length && j < prevLandmarks.length; j++) {
        if (currLandmarks[j] && prevLandmarks[j] &&
            currLandmarks[j].visibility && currLandmarks[j].visibility! > 0.5) {
          const distance = this.calculateDistance(prevLandmarks[j], currLandmarks[j])
          totalVelocity += distance / dt
          validPoints++
        }
      }
      
      if (validPoints > 0) {
        velocities.push(totalVelocity / validPoints)
      }
    }

    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
    const maxVelocity = Math.max(...velocities)
    
    // Calcola smoothness come inverso della varianza
    const variance = this.calculateVariance(velocities)
    const smoothness = Math.max(0, 100 - variance * 10)

    return { avgVelocity, maxVelocity, smoothness }
  }

  // Calcola le metriche di stabilità
  private calculateStability(): StabilityMetrics {
    if (this.landmarksHistory.length < this.HISTORY_SIZE / 2) {
      return { coreSway: 0, balanceScore: 100, tremor: 0 }
    }

    // Calcola il movimento del centro del corpo
    const centerMovements: Point3D[] = []
    
    for (const landmarks of this.landmarksHistory) {
      const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
      const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
      
      const center = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
        z: (leftHip.z + rightHip.z) / 2
      }
      
      centerMovements.push(center)
    }

    // Calcola sway come deviazione standard del movimento
    const swayX = this.calculateStandardDeviation(centerMovements.map(p => p.x))
    const swayY = this.calculateStandardDeviation(centerMovements.map(p => p.y))
    const coreSway = Math.sqrt(swayX * swayX + swayY * swayY) * 100

    // Balance score (100 = perfetto, 0 = molto instabile)
    const balanceScore = Math.max(0, 100 - coreSway * 50)

    // Calcola tremor come frequenza di piccoli movimenti
    const tremor = this.calculateTremor()

    return { coreSway, balanceScore, tremor }
  }

  // Calcola la simmetria del movimento
  private calculateSymmetry(landmarks: Point3D[]): SymmetryMetrics {
    // Confronta i movimenti del lato sinistro e destro
    const upperBodyPairs = [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
      [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST]
    ]

    const lowerBodyPairs = [
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
      [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE],
      [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE]
    ]

    const upperSymmetry = this.calculatePairSymmetry(landmarks, upperBodyPairs)
    const lowerSymmetry = this.calculatePairSymmetry(landmarks, lowerBodyPairs)
    const overall = (upperSymmetry + lowerSymmetry) / 2

    return {
      upperBody: upperSymmetry,
      lowerBody: lowerSymmetry,
      overall
    }
  }

  // Calcola la simmetria per coppie di punti
  private calculatePairSymmetry(landmarks: Point3D[], pairs: number[][]): number {
    let totalSymmetry = 0
    
    for (const [left, right] of pairs) {
      const leftPoint = landmarks[left]
      const rightPoint = landmarks[right]
      
      // Calcola la differenza normalizzata
      const diff = Math.abs(leftPoint.y - rightPoint.y)
      const symmetry = Math.max(0, 100 - diff * 200)
      totalSymmetry += symmetry
    }
    
    return totalSymmetry / pairs.length
  }

  // Calcola la varianza
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  }

  // Calcola la deviazione standard
  private calculateStandardDeviation(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values))
  }

  // Calcola il tremor
  private calculateTremor(): number {
    if (this.landmarksHistory.length < 10) return 0

    let tremorCount = 0
    const threshold = 0.002 // Soglia per piccoli movimenti

    for (let i = 1; i < this.landmarksHistory.length; i++) {
      const prev = this.landmarksHistory[i - 1]
      const curr = this.landmarksHistory[i]
      
      // Conta i piccoli movimenti rapidi
      for (let j = 0; j < curr.length; j++) {
        const distance = this.calculateDistance(prev[j], curr[j])
        if (distance > 0 && distance < threshold) {
          tremorCount++
        }
      }
    }

    return (tremorCount / (this.landmarksHistory.length * 33)) * 100 // 33 = numero di landmarks
  }

  // Resetta la storia
  public reset() {
    this.previousLandmarks = null
    this.landmarksHistory = []
    this.timestamps = []
  }
}