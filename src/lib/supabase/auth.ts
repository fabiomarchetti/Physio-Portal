/**
 * AuthService - Shim per compatibilità con vecchio codice Supabase
 * Ora usa le API routes Neon sotto il cofano
 */

export interface AuthResult {
  success: boolean
  error?: { message: string }
  user?: any
  profilo?: any
  credenziali?: {
    nome_completo: string
    codice_fiscale: string
    password: string
    credenziali_formattate: string
  }
}

export class AuthService {
  /**
   * Ottiene l'utente corrente dalla sessione
   */
  static async getUtenteCorrente(): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        return {
          success: false,
          error: { message: 'Non autenticato' }
        }
      }

      const data = await response.json()

      if (data.success && data.user) {
        return {
          success: true,
          user: data.user,
          profilo: {
            id: data.user.id,
            nome: data.user.nome,
            cognome: data.user.cognome,
            ruolo: data.user.ruolo,
            email: data.user.email || null,
          }
        }
      }

      return {
        success: false,
        error: { message: 'Utente non trovato' }
      }
    } catch (error) {
      console.error('Errore getUtenteCorrente:', error)
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Errore sconosciuto' }
      }
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<AuthResult> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      return { success: true }
    } catch (error) {
      console.error('Errore logout:', error)
      return {
        success: false,
        error: { message: 'Errore durante il logout' }
      }
    }
  }

  /**
   * Registra un nuovo paziente (chiamato dal fisioterapista)
   */
  static async registraPazienteDaFisioterapista(data: {
    nome: string
    cognome: string
    codice_fiscale: string
    data_nascita: string
    telefono?: string
    diagnosi: string
    piano_terapeutico: string
    note?: string
    fisioterapista_id: string
  }): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/register-paziente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fisioterapistaId: data.fisioterapista_id,
          nome: data.nome,
          cognome: data.cognome,
          dataNascita: data.data_nascita,
          codiceFiscale: data.codice_fiscale,
          diagnosi: data.diagnosi,
          pianoTerapeutico: data.piano_terapeutico,
          telefono: data.telefono,
          note: data.note,
        }),
      })

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          credenziali: {
            nome_completo: `${data.nome} ${data.cognome}`,
            codice_fiscale: data.codice_fiscale,
            password: result.passwordGenerata,
            credenziali_formattate: `
═══════════════════════════════════════
   CREDENZIALI ACCESSO PAZIENTE
═══════════════════════════════════════

Paziente: ${data.nome} ${data.cognome}
Codice Fiscale: ${data.codice_fiscale}
Password: ${result.passwordGenerata}

Link accesso: [URL_PORTALE]/login

ISTRUZIONI:
1. Accedere alla pagina di login
2. Selezionare "Paziente"
3. Inserire Codice Fiscale e Password
4. Si consiglia di cambiare la password al primo accesso

═══════════════════════════════════════
            `.trim()
          }
        }
      }

      return {
        success: false,
        error: { message: result.message || 'Errore nella registrazione' }
      }
    } catch (error) {
      console.error('Errore registrazione paziente:', error)
      return {
        success: false,
        error: { message: 'Errore durante la registrazione del paziente' }
      }
    }
  }
}
