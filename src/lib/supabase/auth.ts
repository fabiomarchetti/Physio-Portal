// src/lib/supabase/auth.ts - AGGIORNATO
import { createClient } from './client'
import { 
  DatiRegistrazioneFisioterapista, 
  DatiRegistrazionePaziente,
  DatiRegistrazionePazienteDaFisioterapista,
  LoginPazienteConCF,
  CredenzialiPaziente
} from '@/types/database'
import { 
  validaCodiceFiscale, 
  normalizzaCodiceFiscale, 
  generaPasswordDaCodiceFiscale,
  generaCredenzialiStampa
} from '@/lib/utils/codice-fiscale'

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
          nome: dati.nome,
          cognome: dati.cognome,
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

  // Registrazione paziente da fisioterapista (NUOVO)
  static async registraPazienteDaFisioterapista(dati: DatiRegistrazionePazienteDaFisioterapista): Promise<{
    success: boolean
    user?: any
    credenziali?: CredenzialiPaziente
    error?: any
  }> {
    try {
      console.log('🏥 Registrazione paziente da fisioterapista...')
      
      // 1. Valida codice fiscale
      if (!validaCodiceFiscale(dati.codice_fiscale)) {
        throw new Error('Codice fiscale non valido')
      }
      
      const cfPulito = normalizzaCodiceFiscale(dati.codice_fiscale)
      const password = generaPasswordDaCodiceFiscale(cfPulito)
      
      // 2. Verifica che il fisioterapista esista
      const { data: fisioterapista, error: fisioError } = await supabase
        .from('fisioterapisti')
        .select('id')
        .eq('id', dati.fisioterapista_id)
        .single()
        
      if (fisioError || !fisioterapista) {
        throw new Error('Fisioterapista non trovato')
      }
      
      // 3. Verifica che CF non sia già utilizzato
      const { data: pazienteEsistente } = await supabase
        .from('pazienti')
        .select('id')
        .eq('codice_fiscale', cfPulito)
        .single()
        
      if (pazienteEsistente) {
        throw new Error('Paziente con questo codice fiscale già registrato')
      }
      
      // 4. Crea utente auth con email fittizia basata su CF
      const emailFittizia = `${cfPulito.toLowerCase()}@paziente.physio-portal.local`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFittizia,
        password: password,
        options: {
          data: {
            codice_fiscale: cfPulito,
            ruolo: 'paziente'
          }
        }
      })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione utente')
      
      // 5. Crea profilo
      const { error: profilError } = await supabase
        .from('profili')
        .insert({
          id: authData.user.id,
          ruolo: 'paziente',
          nome: dati.nome,
          cognome: dati.cognome
        })
        
      if (profilError) throw profilError
      
      // 6. Crea record paziente
      console.log('📋 Inserimento record paziente...')
      const pazienteData = {
        profilo_id: authData.user.id,
        fisioterapista_id: dati.fisioterapista_id,
        nome_paziente: dati.nome,
        cognome_paziente: dati.cognome,
        data_nascita: dati.data_nascita,
        codice_fiscale: cfPulito,
        telefono: dati.telefono,
        diagnosi: dati.diagnosi || '',
        piano_terapeutico: dati.piano_terapeutico || '',
        note: dati.note,
        attivo: true
      }
      console.log('📊 Dati paziente:', pazienteData)
      
      const { error: pazienteError } = await supabase
        .from('pazienti')
        .insert(pazienteData)
        
      if (pazienteError) {
        console.error('❌ Errore inserimento paziente:', pazienteError)
        throw pazienteError
      }
      console.log('✅ Record paziente inserito')
      
      // 7. Genera credenziali per stampa
      const credenziali = generaCredenzialiStampa(cfPulito, dati.nome, dati.cognome)
      
      console.log('✅ Paziente registrato con successo')
      console.log('🎟️ Credenziali:', credenziali)
      
      return { 
        success: true, 
        user: authData.user,
        credenziali: {
          codice_fiscale: credenziali.codiceFiscale,
          password: credenziali.password,
          nome_completo: credenziali.nomeCompleto,
          credenziali_formattate: credenziali.credentialiFormattate
        }
      }
    } catch (error) {
      console.error('❌ Errore registrazione paziente:', error)
      return { success: false, error }
    }
  }

  // Login paziente con codice fiscale
  static async loginPazienteConCF(datiLogin: LoginPazienteConCF) {
    try {
      console.log('🔐 Login paziente con CF...')
      
      // 1. Valida codice fiscale
      if (!validaCodiceFiscale(datiLogin.codice_fiscale)) {
        throw new Error('Codice fiscale non valido')
      }
      
      const cfPulito = normalizzaCodiceFiscale(datiLogin.codice_fiscale)
      
      // 2. Verifica password (deve essere uguale alle prime 5 lettere del CF)
      const passwordAttesa = generaPasswordDaCodiceFiscale(cfPulito)
      if (datiLogin.password !== passwordAttesa) {
        throw new Error('Password non corretta')
      }
      
      // 3. Trova paziente per CF
      const { data: paziente, error: pazienteError } = await supabase
        .from('pazienti')
        .select(`
          *,
          profilo:profili(*)
        `)
        .eq('codice_fiscale', cfPulito)
        .eq('attivo', true)
        .single()
        
      if (pazienteError || !paziente) {
        throw new Error('Paziente non trovato o non attivo')
      }
      
      // 4. Login con email fittizia
      const emailFittizia = `${cfPulito.toLowerCase()}@paziente.physio-portal.local`
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFittizia,
        password: passwordAttesa
      })
      
      if (error) throw error
      
      console.log('✅ Login paziente riuscito')
      return { 
        success: true, 
        user: data.user, 
        paziente: paziente 
      }
    } catch (error) {
      console.error('❌ Errore login paziente:', error)
      return { success: false, error }
    }
  }

  // Registrazione paziente (vecchio sistema email - manteniamo per compatibilità)
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
          nome_paziente: dati.nome,
          cognome_paziente: dati.cognome,
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