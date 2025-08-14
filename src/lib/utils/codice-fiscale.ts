// src/lib/utils/codice-fiscale.ts
// Utility per gestione Codice Fiscale nei pazienti

/**
 * Valida il formato del codice fiscale italiano
 */
export function validaCodiceFiscale(cf: string): boolean {
  if (!cf || typeof cf !== 'string') return false
  
  // Rimuove spazi e converte in maiuscolo
  const codicePulito = cf.replace(/\s/g, '').toUpperCase()
  
  // Verifica lunghezza (16 caratteri)
  if (codicePulito.length !== 16) return false
  
  // Verifica formato: 6 lettere + 2 numeri + 1 lettera + 2 numeri + 1 lettera + 3 caratteri + 1 lettera
  const regex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/
  
  return regex.test(codicePulito)
}

/**
 * Normalizza il codice fiscale (maiuscolo, senza spazi)
 */
export function normalizzaCodiceFiscale(cf: string): string {
  return cf.replace(/\s/g, '').toUpperCase()
}

/**
 * Genera password automatica dalle prime 5 lettere del CF + numeri per Supabase
 * Esempio: RSSMRA45D15H501Z -> rssmr123
 * (aggiunge numeri per raggiungere requisito lunghezza minima 8 caratteri)
 */
export function generaPasswordDaCodiceFiscale(cf: string): string {
  const codicePulito = normalizzaCodiceFiscale(cf)
  
  if (!validaCodiceFiscale(codicePulito)) {
    throw new Error('Codice fiscale non valido per generazione password')
  }
  
  // Prende le prime 5 lettere e aggiunge numeri dal CF per lunghezza minima 8
  const lettere = codicePulito.substring(0, 5).toLowerCase()
  const numeri = codicePulito.substring(6, 9).toLowerCase() // Tutto minuscolo
  
  return lettere + numeri // Es: rssmr45d (8+ caratteri, tutto minuscolo)
}

/**
 * Estrae nome e cognome approssimativi dal CF per display
 * Le prime 3 lettere sono del cognome, le successive 3 del nome
 */
export function estraiNomeCognomeDaCF(cf: string): { nome: string, cognome: string } {
  const codicePulito = normalizzaCodiceFiscale(cf)
  
  if (!validaCodiceFiscale(codicePulito)) {
    return { nome: '', cognome: '' }
  }
  
  // Le prime 3 lettere sono consonanti del cognome
  const cognomeConsonanti = codicePulito.substring(0, 3)
  // Le successive 3 sono consonanti del nome
  const nomeConsonanti = codicePulito.substring(3, 6)
  
  return {
    cognome: cognomeConsonanti,
    nome: nomeConsonanti
  }
}

/**
 * Formatta CF per visualizzazione con spazi
 * RSSMRA45D15H501Z -> RSSM RA45 D15H 501Z
 */
export function formattaCodiceFiscale(cf: string): string {
  const codicePulito = normalizzaCodiceFiscale(cf)
  
  if (!validaCodiceFiscale(codicePulito)) {
    return cf
  }
  
  return `${codicePulito.substring(0, 4)} ${codicePulito.substring(4, 8)} ${codicePulito.substring(8, 12)} ${codicePulito.substring(12, 16)}`
}

/**
 * Genera credenziali per stampa fisioterapista
 */
export function generaCredenzialiStampa(cf: string, nome?: string, cognome?: string): {
  codiceFiscale: string
  password: string
  nomeCompleto: string
  credentialiFormattate: string
} {
  const codicePulito = normalizzaCodiceFiscale(cf)
  const password = generaPasswordDaCodiceFiscale(codicePulito)
  
  let nomeCompleto = ''
  if (nome && cognome) {
    nomeCompleto = `${nome} ${cognome}`
  } else {
    const { nome: nomeEstratato, cognome: cognomeEstratto } = estraiNomeCognomeDaCF(codicePulito)
    nomeCompleto = `${nomeEstratato} ${cognomeEstratto} (dal CF)`
  }
  
  const credentialiFormattate = `
CREDENZIALI ACCESSO RIABILITAZIONE DOMICILIARE

Paziente: ${nomeCompleto}
Login: ${codicePulito}
Password: ${password}

ISTRUZIONI:
1. Accedi al sito della riabilitazione
2. Inserisci il tuo Codice Fiscale: ${formattaCodiceFiscale(codicePulito)}
3. Inserisci la password: ${password}
4. Inizia la sessione di riabilitazione

Per assistenza contatta il tuo fisioterapista.
  `.trim()
  
  return {
    codiceFiscale: codicePulito,
    password,
    nomeCompleto,
    credentialiFormattate
  }
}