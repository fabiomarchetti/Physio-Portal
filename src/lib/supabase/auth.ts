// src/lib/supabase/auth.ts - AGGIORNATO
import { createClient } from './client'
import { DatiRegistrazioneFisioterapista, DatiRegistrazionePaziente } from '@/types/database'

const supabase = createClient()

export class AuthService {
  // Registrazione fisioterapista
  static async registraFisioterapista(dati: DatiRegistrazioneFisioterapista) {
    try {
      // 1. Crea utente in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dati.email,
        password: dati.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione utente')

      // 2. Crea profilo
      const { error: profilError } = await supabase
        .from('profili')
        .insert({
          id: authData.user.id,
          ruolo: 'fisioterapista',
          nome: dati.nome,
          cognome: dati.cognome
        })

      if (profilError) throw profilError

      // 3. Crea record fisioterapista
      const { error: fisioError } = await supabase
        .from('fisioterapisti')
        .insert({
          profilo_id: authData.user.id,
          numero_albo: dati.numero_albo,
          specializzazione: dati.specializzazione,
          nome_clinica: dati.nome_clinica,
          indirizzo_clinica: dati.indirizzo_clinica,
          telefono: dati.telefono,
          email_clinica: dati.email_clinica
        })

      if (fisioError) throw fisioError

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Errore registrazione fisioterapista:', error)
      return { success: false, error }
    }
  }

  // Registrazione paziente
  static async registraPaziente(dati: DatiRegistrazionePaziente) {
    try {
      // 1. Trova fisioterapista dal codice
      const { data: fisioterapista, error: fisioError } = await supabase
        .from('fisioterapisti')
        .select('id')
        .eq('numero_albo', dati.codice_fisioterapista)
        .single()

      if (fisioError || !fisioterapista) {
        throw new Error('Codice fisioterapista non valido')
      }

      // 2. Crea utente in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dati.email,
        password: dati.password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione utente')

      // 3. Crea profilo
      const { error: profilError } = await supabase
        .from('profili')
        .insert({
          id: authData.user.id,
          ruolo: 'paziente',
          nome: dati.nome,
          cognome: dati.cognome
        })

      if (profilError) throw profilError

      // 4. Crea record paziente
      const { error: pazienteError } = await supabase
        .from('pazienti')
        .insert({
          profilo_id: authData.user.id,
          fisioterapista_id: fisioterapista.id,
          data_nascita: dati.data_nascita,
          codice_fiscale: dati.codice_fiscale,
          telefono: dati.telefono,
          diagnosi: '', // Da completare successivamente
          piano_terapeutico: '' // Da completare successivamente
        })

      if (pazienteError) throw pazienteError

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Errore registrazione paziente:', error)
      return { success: false, error }
    }
  }

  // Login
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Errore login:', error)
      return { success: false, error }
    }
  }

  // Logout
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Errore logout:', error)
      return { success: false, error }
    }
  }

  // Ottieni utente corrente con profilo
  static async getUtenteCorrente() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: userError }
      }

      // Ottieni profilo completo
      const { data: profilo, error: profilError } = await supabase
        .from('profili')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profilError) {
        return { success: false, error: profilError }
      }

      return { success: true, user, profilo }
    } catch (error) {
      console.error('Errore ottenimento utente:', error)
      return { success: false, error }
    }
  }

  // Carica configurazioni sistema durante login
  static async caricaConfigurazioni() {
    try {
      const { data: configurazioni, error } = await supabase
        .from('configurazioni_sistema')
        .select('*')

      if (error) throw error

      // Converte in oggetto chiave-valore per facile accesso
      const configMap: { [key: string]: unknown } = {}
      configurazioni.forEach(config => {
        configMap[config.nome_configurazione] = config.valore_configurazione
      })

      return { success: true, configurazioni: configMap }
    } catch (error) {
      console.error('Errore caricamento configurazioni:', error)
      return { success: false, error }
    }
  }

  // Carica tipi esercizio durante login
  static async caricaTipiEsercizio() {
    try {
      const { data: tipi, error } = await supabase
        .from('tipi_esercizio')
        .select('*')
        .eq('attivo', true)
        .order('difficolta')

      if (error) throw error

      return { success: true, tipi_esercizio: tipi }
    } catch (error) {
      console.error('Errore caricamento tipi esercizio:', error)
      return { success: false, error }
    }
  }
}