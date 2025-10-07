import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sql } from './client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface TokenPayload {
  userId: string
  ruolo: 'sviluppatore' | 'fisioterapista' | 'paziente'
  email?: string
}

export interface LoginResult {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    nome: string
    cognome: string
    ruolo: string
    email?: string
  }
}

// =====================================================
// GENERAZIONE E VERIFICA TOKEN JWT
// =====================================================

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    console.error('Errore verifica token:', error)
    return null
  }
}

// =====================================================
// LOGIN SVILUPPATORE
// =====================================================

export async function loginSviluppatore(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const result = await sql`
      SELECT * FROM login_sviluppatore(${email}, ${password})
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Credenziali non valide',
      }
    }

    const data = result[0]

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Login fallito',
      }
    }

    // Genera token JWT
    const token = generateToken({
      userId: data.profilo_id,
      ruolo: 'sviluppatore',
      email: data.email,
    })

    return {
      success: true,
      message: 'Login effettuato con successo',
      token,
      user: {
        id: data.profilo_id,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: 'sviluppatore',
        email: data.email,
      },
    }
  } catch (error) {
    console.error('Errore login sviluppatore:', error)
    return {
      success: false,
      message: 'Errore durante il login',
    }
  }
}

// =====================================================
// LOGIN FISIOTERAPISTA
// =====================================================

export async function loginFisioterapista(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const result = await sql`
      SELECT * FROM login_fisioterapista(${email}, ${password})
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Credenziali non valide',
      }
    }

    const data = result[0]

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Login fallito',
      }
    }

    // Genera token JWT
    const token = generateToken({
      userId: data.profilo_id,
      ruolo: 'fisioterapista',
      email: data.email,
    })

    return {
      success: true,
      message: 'Login effettuato con successo',
      token,
      user: {
        id: data.profilo_id,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: 'fisioterapista',
        email: data.email,
      },
    }
  } catch (error) {
    console.error('Errore login fisioterapista:', error)
    return {
      success: false,
      message: 'Errore durante il login',
    }
  }
}

// =====================================================
// LOGIN PAZIENTE
// =====================================================

export async function loginPaziente(
  codiceFiscale: string,
  password: string
): Promise<LoginResult> {
  try {
    const result = await sql`
      SELECT * FROM login_paziente(${codiceFiscale.toUpperCase()}, ${password})
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Credenziali non valide',
      }
    }

    const data = result[0]

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Login fallito',
      }
    }

    // Genera token JWT
    const token = generateToken({
      userId: data.profilo_id,
      ruolo: 'paziente',
    })

    return {
      success: true,
      message: 'Login effettuato con successo',
      token,
      user: {
        id: data.profilo_id,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: 'paziente',
      },
    }
  } catch (error) {
    console.error('Errore login paziente:', error)
    return {
      success: false,
      message: 'Errore durante il login',
    }
  }
}

// =====================================================
// REGISTRAZIONE FISIOTERAPISTA
// =====================================================

export async function registraFisioterapista(data: {
  nome: string
  cognome: string
  email: string
  password: string
  numeroAlbo: string
  specializzazione: string
  nomeClinica: string
  indirizzoClinica: string
  telefono?: string
  emailClinica?: string
}): Promise<LoginResult> {
  try {
    const result = await sql`
      SELECT * FROM registra_fisioterapista(
        ${data.nome},
        ${data.cognome},
        ${data.email},
        ${data.password},
        ${data.numeroAlbo},
        ${data.specializzazione},
        ${data.nomeClinica},
        ${data.indirizzoClinica},
        ${data.telefono || null},
        ${data.emailClinica || null}
      )
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Errore durante la registrazione',
      }
    }

    const regData = result[0]

    if (!regData.success) {
      return {
        success: false,
        message: regData.message || 'Registrazione fallita',
      }
    }

    // Genera token JWT
    const token = generateToken({
      userId: regData.profilo_id,
      ruolo: 'fisioterapista',
      email: data.email,
    })

    return {
      success: true,
      message: 'Registrazione completata con successo',
      token,
      user: {
        id: regData.profilo_id,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: 'fisioterapista',
        email: data.email,
      },
    }
  } catch (error) {
    console.error('Errore registrazione fisioterapista:', error)
    return {
      success: false,
      message: 'Errore durante la registrazione',
    }
  }
}

// =====================================================
// REGISTRAZIONE PAZIENTE (da parte fisioterapista)
// =====================================================

export async function registraPaziente(
  fisioterapistaId: string,
  data: {
    nome: string
    cognome: string
    dataNascita: string
    codiceFiscale: string
    diagnosi: string
    pianoTerapeutico: string
    telefono?: string
    note?: string
  }
) {
  try {
    const result = await sql`
      SELECT * FROM registra_paziente(
        ${fisioterapistaId}::uuid,
        ${data.nome},
        ${data.cognome},
        ${data.dataNascita}::date,
        ${data.codiceFiscale.toUpperCase()},
        ${data.diagnosi},
        ${data.pianoTerapeutico},
        ${data.telefono || null},
        ${data.note || null}
      )
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Errore durante la registrazione del paziente',
      }
    }

    const regData = result[0]

    return {
      success: regData.success,
      message: regData.message,
      pazienteId: regData.paziente_id,
      passwordGenerata: regData.password_generata,
    }
  } catch (error) {
    console.error('Errore registrazione paziente:', error)
    return {
      success: false,
      message: 'Errore durante la registrazione del paziente',
    }
  }
}

// =====================================================
// CAMBIO PASSWORD
// =====================================================

export async function cambiaPassword(
  profiloId: string,
  vecchiaPassword: string,
  nuovaPassword: string
) {
  try {
    const result = await sql`
      SELECT * FROM cambia_password(
        ${profiloId}::uuid,
        ${vecchiaPassword},
        ${nuovaPassword}
      )
    `

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Errore durante il cambio password',
      }
    }

    return {
      success: result[0].success,
      message: result[0].message,
    }
  } catch (error) {
    console.error('Errore cambio password:', error)
    return {
      success: false,
      message: 'Errore durante il cambio password',
    }
  }
}

// =====================================================
// OTTIENI PROFILO COMPLETO
// =====================================================

export async function getProfiloCompleto(profiloId: string) {
  try {
    const result = await sql`
      SELECT * FROM get_profilo_completo(${profiloId}::uuid)
    `

    if (!result || result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error('Errore recupero profilo:', error)
    return null
  }
}
