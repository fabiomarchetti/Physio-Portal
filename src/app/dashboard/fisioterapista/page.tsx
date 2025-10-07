'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/hooks/useAuth'
import { validaCodiceFiscale } from '@/lib/utils/codice-fiscale'
import { LandmarkSelector, EsercizioPerDatabase } from '@/components/computer-vision/LandmarkSelector'
import {
  UserPlus,
  Users,
  Activity,
  Calendar,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  PrinterIcon,
  Dumbbell,
  FolderOpen,
  Trash2,
  Save,
  Menu,
  X
} from 'lucide-react'

interface FisioterapistaData {
  id: string
  nome: string
  cognome: string
  profilo?: {
    nome: string
    cognome: string
  }
  numero_albo: string
  nome_clinica: string
  pazienti?: PazienteData[]
}

interface PazienteData {
  id: string
  profilo: {
    nome: string
    cognome: string
  }
  nome_paziente: string
  cognome_paziente: string
  codice_fiscale: string
  data_nascita: string
  telefono?: string
  diagnosi: string
  piano_terapeutico: string
  note?: string
  attivo: boolean
  created_at: string
  esercizi_assegnati?: EsercizioAssegnato[]
}

interface EsercizioAssegnato {
  id: string
  paziente_id: string
  esercizio_id: string
  data_assegnazione: string
  data_inizio?: string
  data_fine?: string
  frequenza_settimanale?: number
  durata_minuti_consigliata?: number
  ripetizioni_per_sessione?: number
  note_fisioterapista?: string
  obiettivi_specifici?: string
  attivo: boolean
  completato: boolean
  numero_sessioni_completate: number
  ultima_sessione?: string
  esercizio: {
    nome_esercizio: string
    descrizione: string
    istruzioni?: string
    difficolta?: string
    parti_corpo_coinvolte?: string[]
    configurazione_mediapipe?: any
    id_categoria?: number
  }
}

interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
  data_creazione: string
  data_aggiornamento: string
}

interface Esercizio {
  id: string  // UUID dalla tabella tipi_esercizio
  id_esercizio?: number  // Legacy, opzionale
  id_categoria?: number
  nome_esercizio: string
  descrizione?: string
  istruzioni?: string
  difficolta?: string
  parti_corpo_coinvolte?: string[]
  configurazione_mediapipe?: any
  attivo?: boolean
  data_creazione?: string
  // Campi legacy per compatibilità
  descrizione_esecuzione?: string
  note?: string
  landmark?: number[]
  created_at?: string
  categoria?: CategoriaEsercizio
}

interface EsercizioAvanzato {
  id_categoria: number
  nome_esercizio: string
  descrizione_esecuzione: string
  note?: string
  difficolta: string
  durata_consigliata_minuti: number
  parti_corpo_coinvolte: string[]
  configurazione_mediapipe: {
    tipo_esercizio: 'angle' | 'distance' | 'movement'
    parametriCalcolo: {
      landmarks_selezionati: number[]
      angolo_target?: number
      distanza_target?: number
      movimento_target?: string
    }
  }
}

// Capitoli Physio-Portal per esercizi
const ESERCIZI_PHYSIO_PORTAL = [
  { id: 1, nome: 'Mobilizzazione Articolare', capitolo: '3.1', descrizione: 'Esercizi per il recupero della mobilità articolare' },
  { id: 2, nome: 'Rinforzo Muscolare', capitolo: '3.2', descrizione: 'Esercizi per il potenziamento muscolare' },
  { id: 3, nome: 'Propriocezione', capitolo: '3.3', descrizione: 'Esercizi per il recupero propriocettivo' },
  { id: 4, nome: 'Equilibrio e Coordinazione', capitolo: '3.4', descrizione: 'Esercizi per equilibrio dinamico e statico' },
  { id: 5, nome: 'Recupero Funzionale', capitolo: '3.5', descrizione: 'Esercizi per il recupero delle funzioni lavorative' },
  { id: 6, nome: 'Ergonomia e Prevenzione', capitolo: '4.1', descrizione: 'Educazione posturale e prevenzione recidive' }
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading, logout: authLogout } = useAuth()
  const [fisioterapista, setFisioterapista] = useState<FisioterapistaData | null>(null)
  const [pazienti, setPazienti] = useState<PazienteData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalePazienti: 0,
    pazienteAttivi: 0,
    sessioniOggi: 0
  })
  const [showRegistraPaziente, setShowRegistraPaziente] = useState(false)
  const [registrandoPaziente, setRegistrandoPaziente] = useState(false)
  const [credenziali, setCredenziali] = useState<{ nome_completo: string; codice_fiscale: string; password: string; credenziali_formattate: string } | null>(null)
  const [formPaziente, setFormPaziente] = useState({
    nome: '',
    cognome: '',
    codice_fiscale: '',
    data_nascita: '',
    telefono: '',
    diagnosi: '',
    piano_terapeutico: '',
    note: ''
  })

  // Stati per gestione esercizi
  const [categorie, setCategorie] = useState<CategoriaEsercizio[]>([])
  const [esercizi, setEsercizi] = useState<Esercizio[]>([])
  const [loadingEsercizi, setLoadingEsercizi] = useState(false)
  
  // Stati per le modali
  const [showCategorieModal, setShowCategorieModal] = useState(false)
  const [showNuovaCategoriaModal, setShowNuovaCategoriaModal] = useState(false)
  const [showEserciziModal, setShowEserciziModal] = useState(false)
  const [showNuovoEsercizioModal, setShowNuovoEsercizioModal] = useState(false)
  
  // Stati per i form
  const [formCategoria, setFormCategoria] = useState({
    nome_categoria: '',
    img_categoria: 'default_category.jpg'
  })
  const [formEsercizio, setFormEsercizio] = useState({
    id_categoria: '',
    nome_esercizio: '',
    descrizione_esecuzione: '',
    note: ''
  })
  
  // Stati per il caricamento
  const [salvandoCategoria, setSalvandoCategoria] = useState(false)
  const [salvandoEsercizio, setSalvandoEsercizio] = useState(false)

  // Stato per categoria selezionata
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<CategoriaEsercizio | null>(null)

  // Stati per visualizzazione dettagli esercizio
  const [showDettagliEsercizioModal, setShowDettagliEsercizioModal] = useState(false)
  const [esercizioDettaglio, setEsercizioDettaglio] = useState<EsercizioAssegnato | null>(null)
  const [loadingEserciziPaziente, setLoadingEserciziPaziente] = useState<Record<string, boolean>>({})

  // Stato per menu laterale
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Stati per assegnazione esercizi
  const [showAssegnaEserciziModal, setShowAssegnaEserciziModal] = useState(false)
  const [showLandmarkSelector, setShowLandmarkSelector] = useState(false)
  const [pazienteSelezionato, setPazienteSelezionato] = useState<PazienteData | null>(null)
  const [eserciziDisponibili, setEserciziDisponibili] = useState<Esercizio[]>([])
  const [eserciziAssegnati, setEserciziAssegnati] = useState<any[]>([])
  const [eserciziDaAssegnare, setEserciziDaAssegnare] = useState<any[]>([]) // Lista temporanea
  const [assegnandoEsercizio, setAssegnandoEsercizio] = useState(false)
  const [formNuovoEsercizio, setFormNuovoEsercizio] = useState({
    id_categoria: '',
    nome_esercizio: '',
    descrizione_esercizio: '',
    istruzioni: '',
    data_inizio: '',
    data_fine: '',
    frequenza_settimanale: 3,
    durata_minuti_consigliata: 30,
    ripetizioni_per_sessione: 10,
    note_fisioterapista: '',
    obiettivi_specifici: '',
    parti_corpo_coinvolte: [] as string[],
    configurazione_mediapipe: null as any
  })
  
  // Monitora i cambiamenti delle categorie
  useEffect(() => {
    console.log('Stato categorie aggiornato:', categorie)
  }, [categorie])

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      // Verifica che sia un fisioterapista
      if (user.ruolo !== 'fisioterapista') {
        setError('Accesso consentito solo ai fisioterapisti')
        router.push('/login')
        return
      }

      // Carica dati fisioterapista
      caricaDatiFisioterapista()
    }
  }, [authLoading, user, router])

  // Recupera dati esercizio da localStorage quando si torna dalla pagina di configurazione
  useEffect(() => {
    if (!mounted || !user) return

    const nuovoEsercizioData = localStorage.getItem('nuovo_esercizio')
    const tempPazienteId = localStorage.getItem('temp_paziente_id')

    console.log('🔍 Controllo localStorage:', { nuovoEsercizioData: !!nuovoEsercizioData, tempPazienteId })

    if (nuovoEsercizioData && tempPazienteId) {
      try {
        const esercizio = JSON.parse(nuovoEsercizioData)
        console.log('📦 Esercizio recuperato:', esercizio)

        // Rimuovi subito da localStorage per evitare loop
        localStorage.removeItem('nuovo_esercizio')
        localStorage.removeItem('temp_paziente_id')

        // Trova il paziente
        if (pazienti.length > 0) {
          const paziente = pazienti.find(p => p.id === tempPazienteId)
          console.log('👤 Paziente trovato:', paziente)

          if (paziente) {
            setPazienteSelezionato(paziente)

            // Carica esercizi e categorie
            caricaEsercizi().then(() => {
              console.log('📚 Categorie dopo caricamento:', categorie.length)

              // Aspetta un tick per assicurarci che le categorie siano state aggiornate
              setTimeout(() => {
                // Aggiungi l'esercizio alla lista temporanea
                const categoriaSelezionata = categorie.find(c => c.id === parseInt(esercizio.id_categoria))
                console.log('🏷️ Categoria selezionata:', categoriaSelezionata)

                const nuovoEsercizioTemporaneo = {
                  ...esercizio,
                  id_temporaneo: Date.now(),
                  nome_categoria: categoriaSelezionata?.nome_categoria || 'Categoria sconosciuta'
                }

                console.log('➕ Aggiungendo esercizio alla lista temporanea:', nuovoEsercizioTemporaneo)

                setEserciziDaAssegnare(prev => {
                  const nuovaLista = [...prev, nuovoEsercizioTemporaneo]
                  console.log('📋 Lista aggiornata:', nuovaLista)
                  return nuovaLista
                })

                // Reset form
                setFormNuovoEsercizio({
                  id_categoria: '',
                  nome_esercizio: '',
                  descrizione_esercizio: '',
                  istruzioni: '',
                  data_inizio: '',
                  data_fine: '',
                  frequenza_settimanale: 3,
                  durata_minuti_consigliata: 30,
                  ripetizioni_per_sessione: 10,
                  note_fisioterapista: '',
                  obiettivi_specifici: '',
                  parti_corpo_coinvolte: [],
                  configurazione_mediapipe: null
                })

                // Apri modal
                console.log('🪟 Aprendo modal assegnazione')
                setShowAssegnaEserciziModal(true)
              }, 200)
            })
          } else {
            console.warn('⚠️ Paziente non trovato con ID:', tempPazienteId)
          }
        } else {
          console.warn('⚠️ Lista pazienti ancora vuota')
        }
      } catch (error) {
        console.error('❌ Errore nel recupero dati esercizio:', error)
      }
    }
  }, [mounted, user, pazienti])

  const caricaDatiFisioterapista = async () => {
    if (!user || !user.datiSpecifici?.fisioterapista_id) {
      console.error('User o fisioterapista_id non disponibile')
      return
    }

    try {
      const response = await fetch(`/api/fisioterapisti/${user.datiSpecifici.fisioterapista_id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Errore caricamento dati')

      const data = await response.json()

      if (data.success && data.fisioterapista) {
        setFisioterapista(data.fisioterapista)
        const pazientiData = data.fisioterapista.pazienti || []
        setPazienti(pazientiData)

        // Carica esercizi per ogni paziente
        await caricaEserciziPerTuttiIPazienti(pazientiData)

        // Calcola statistiche
        const pazientiAttivi = pazientiData.filter((p: any) => p.attivo).length
        setStats({
          totalePazienti: pazientiData.length,
          pazienteAttivi: pazientiAttivi,
          sessioniOggi: 0 // TODO: implementare conteggio sessioni
        })
      }

    } catch (error) {
      console.error('Errore caricamento dati:', error)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  // Funzione per caricare esercizi di tutti i pazienti
  const caricaEserciziPerTuttiIPazienti = async (pazientiData: PazienteData[]) => {
    for (const paziente of pazientiData) {
      await caricaEserciziPaziente(paziente.id)
    }
  }

  // Funzione per caricare esercizi di un singolo paziente
  const caricaEserciziPaziente = async (pazienteId: string) => {
    setLoadingEserciziPaziente(prev => ({ ...prev, [pazienteId]: true }))

    try {
      const response = await fetch(`/api/pazienti/${pazienteId}/esercizi`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Errore caricamento esercizi')

      const data = await response.json()

      if (data.success) {
        // Aggiorna il paziente con gli esercizi caricati
        setPazienti(prev => prev.map(p =>
          p.id === pazienteId
            ? { ...p, esercizi_assegnati: data.esercizi }
            : p
        ))
      }
    } catch (error) {
      console.error(`Errore caricamento esercizi paziente ${pazienteId}:`, error)
    } finally {
      setLoadingEserciziPaziente(prev => ({ ...prev, [pazienteId]: false }))
    }
  }

  // Funzioni per gestione esercizi
  const caricaEsercizi = async () => {
    setLoadingEsercizi(true)
    try {
      console.log('Caricamento categorie ed esercizi...')

      const response = await fetch('/api/esercizi', {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Errore caricamento esercizi')

      const data = await response.json()

      if (data.success) {
        setCategorie(data.categorie || [])
        setEsercizi(data.esercizi || [])
        console.log('Categorie caricate:', data.categorie)
        console.log('Esercizi caricati:', data.esercizi)
      }
    } catch (error) {
      console.error('Errore caricamento esercizi:', error)
    } finally {
      setLoadingEsercizi(false)
    }
  }

  // Funzione old Supabase commentata per reference
  /*
  const caricaEserciziOLD = async () => {
    setLoadingEsercizi(true)
    try {
      const supabase = createClient()

      console.log('Caricamento categorie ed esercizi...')

      // Carica categorie
      const { data: categorieData, error: categorieError } = await supabase
        .from('categorie_esercizi')
        .select('*')
        .order('nome_categoria')
      
      console.log('Risultato caricamento categorie:', { categorieData, categorieError })
      
      if (categorieError) throw categorieError
      
      console.log('Impostando categorie:', categorieData)
      setCategorie(categorieData || [])
      
      // Carica esercizi con categorie
      const { data: eserciziData, error: eserciziError } = await supabase
        .from('esercizi')
        .select(`
          *,
          categoria:categorie_esercizi(*)
        `)
        .order('nome_esercizio')
      
      console.log('Risultato caricamento esercizi:', { eserciziData, eserciziError })
      
      if (eserciziError) throw eserciziError
      setEsercizi(eserciziData || [])
      
    } catch (error) {
      console.error('Errore caricamento esercizi:', error)
      setError('Errore nel caricamento degli esercizi')
    } finally {
      setLoadingEsercizi(false)
    }
  }
  */

  const handleAggiungiCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCategoria.nome_categoria.trim()) return

    setSalvandoCategoria(true)
    setError('')

    console.log('Tentativo di salvataggio categoria:', formCategoria)

    try {
      const response = await fetch('/api/categorie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formCategoria)
      })

      const data = await response.json()

      if (data.success) {
        console.log('Categoria salvata con successo:', data.categoria)

        // Reset del form
        setFormCategoria({ nome_categoria: '', img_categoria: 'default_category.jpg' })

        // Chiude la modale nuova categoria
        setShowNuovaCategoriaModal(false)

        // Piccolo delay per assicurarsi che la modale si chiuda
        await new Promise(resolve => setTimeout(resolve, 100))

        // Ricarica i dati
        await caricaEsercizi()

        // Riapre la modale delle categorie
        setShowCategorieModal(true)
      } else {
        setError(data.message || 'Errore nel salvataggio della categoria')
      }

    } catch (error) {
      console.error('Errore salvataggio categoria:', error)
      setError(`Errore nel salvataggio della categoria: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setSalvandoCategoria(false)
    }
  }

  const handleSalvaEsercizioAvanzato = async (esercizioConfigurato: EsercizioPerDatabase) => {
    if (!categoriaSelezionata) {
      setError('Nessuna categoria selezionata')
      return
    }

    setSalvandoEsercizio(true)
    setError('')

    try {
      // Prepara i dati per il salvataggio nella tabella tipi_esercizio
      const datiEsercizio = {
        id_categoria: categoriaSelezionata.id,
        nome_esercizio: esercizioConfigurato.nome_esercizio,
        descrizione: esercizioConfigurato.descrizione_esecuzione,
        istruzioni: esercizioConfigurato.note || '',
        durata_consigliata_minuti: 30, // Valore di default
        difficolta: 'medio' as 'facile' | 'medio' | 'difficile',
        parti_corpo_coinvolte: esercizioConfigurato.parti_corpo_coinvolte || [categoriaSelezionata.nome_categoria],
        configurazione_mediapipe: esercizioConfigurato.configurazione_mediapipe
      }

      console.log('Dati esercizio da salvare:', datiEsercizio)

      // Chiama API per creare esercizio
      const response = await fetch('/api/esercizi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datiEsercizio)
      })

      const data = await response.json()

      if (data.success) {
        console.log('Esercizio salvato con successo:', data.esercizio)

        // Chiude la modale
        setShowNuovoEsercizioModal(false)

        // Ricarica gli esercizi
        await caricaEsercizi()

        // Riapre la modale degli esercizi
        setShowEserciziModal(true)
      } else {
        setError(data.message || 'Errore nel salvataggio dell\'esercizio')
      }

    } catch (error) {
      console.error('Errore salvataggio esercizio avanzato:', error)
      setError('Errore nel salvataggio dell\'esercizio')
    } finally {
      setSalvandoEsercizio(false)
    }
  }

  const handleEliminaCategoria = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria? Gli esercizi associati verranno eliminati.')) return

    try {
      const response = await fetch(`/api/categorie?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setCategorie(prev => prev.filter(c => c.id !== id))
        // Ricarica esercizi per aggiornare la lista
        await caricaEsercizi()
      } else {
        setError(data.message || 'Errore nell\'eliminazione della categoria')
      }

    } catch (error) {
      console.error('Errore eliminazione categoria:', error)
      setError('Errore nell\'eliminazione della categoria')
    }
  }

  const handleEliminaEsercizio = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return

    try {
      const response = await fetch(`/api/esercizi/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setEsercizi(prev => prev.filter(e => e.id !== id))
      } else {
        setError('Errore nell\'eliminazione dell\'esercizio')
      }

    } catch (error) {
      console.error('Errore eliminazione esercizio:', error)
      setError('Errore nell\'eliminazione dell\'esercizio')
    }
  }

  // Funzioni per assegnazione esercizi
  const handleApriAssegnaEsercizi = async (paziente: PazienteData) => {
    setPazienteSelezionato(paziente)
    setEserciziDaAssegnare([]) // Reset lista temporanea
    setError('')

    try {
      // Carica categorie ed esercizi disponibili
      await caricaEsercizi()

      // Carica esercizi già assegnati al paziente
      const response = await fetch(`/api/pazienti/${paziente.id}/esercizi`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEserciziAssegnati(data.esercizi || [])
      }

      setShowAssegnaEserciziModal(true)
    } catch (error) {
      console.error('Errore caricamento esercizi:', error)
      setError('Errore nel caricamento degli esercizi')
    }
  }

  // Funzione per salvare la configurazione Landmark dal LandmarkSelector
  const handleSalvaLandmarkConfig = (landmarkData: EsercizioPerDatabase) => {
    console.log('Landmark salvati:', landmarkData)

    // Aggiorna il form con i dati dei landmark
    setFormNuovoEsercizio(prev => ({
      ...prev,
      parti_corpo_coinvolte: landmarkData.parti_corpo_coinvolte || [],
      configurazione_mediapipe: landmarkData.configurazione_mediapipe || null
    }))

    // Chiudi il selector e riapri il modale principale
    setShowLandmarkSelector(false)
    setTimeout(() => setShowAssegnaEserciziModal(true), 100)
  }

  const handleAggiungiEsercizioTemporaneo = () => {
    // Validazione
    if (!formNuovoEsercizio.id_categoria ||
        !formNuovoEsercizio.nome_esercizio.trim() ||
        !formNuovoEsercizio.descrizione_esercizio.trim()) {
      setError('Categoria, nome e descrizione sono obbligatori')
      return
    }

    const categoriaSelezionata = categorie.find(c => c.id === parseInt(formNuovoEsercizio.id_categoria))

    // Aggiungi alla lista temporanea
    setEserciziDaAssegnare(prev => [...prev, {
      ...formNuovoEsercizio,
      id_temporaneo: Date.now(),
      nome_categoria: categoriaSelezionata?.nome_categoria || ''
    }])

    // Reset form
    setFormNuovoEsercizio({
      id_categoria: '',
      nome_esercizio: '',
      descrizione_esercizio: '',
      istruzioni: '',
      data_inizio: '',
      data_fine: '',
      frequenza_settimanale: 3,
      durata_minuti_consigliata: 30,
      ripetizioni_per_sessione: 10,
      note_fisioterapista: '',
      obiettivi_specifici: '',
      parti_corpo_coinvolte: [],
      configurazione_mediapipe: null
    })

    setError('')
  }

  const handleRimuoviEsercizioTemporaneo = (idTemporaneo: number) => {
    setEserciziDaAssegnare(prev => prev.filter(e => e.id_temporaneo !== idTemporaneo))
  }

  const handleSalvaTuttiEsercizi = async () => {
    if (!pazienteSelezionato || eserciziDaAssegnare.length === 0) {
      setError('Aggiungi almeno un esercizio')
      return
    }

    setAssegnandoEsercizio(true)
    setError('')

    try {
      const response = await fetch('/api/esercizi/create-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paziente_id: pazienteSelezionato.id,
          esercizi: eserciziDaAssegnare
        })
      })

      const data = await response.json()

      if (data.success) {
        // Ricarica esercizi assegnati
        const refreshResponse = await fetch(`/api/pazienti/${pazienteSelezionato.id}/esercizi`, {
          credentials: 'include'
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setEserciziAssegnati(refreshData.esercizi || [])
        }

        // Reset
        setEserciziDaAssegnare([])
        setFormNuovoEsercizio({
          id_categoria: '',
          nome_esercizio: '',
          descrizione_esercizio: '',
          istruzioni: '',
          data_inizio: '',
          data_fine: '',
          frequenza_settimanale: 3,
          durata_minuti_consigliata: 30,
          ripetizioni_per_sessione: 10,
          note_fisioterapista: '',
          obiettivi_specifici: '',
          parti_corpo_coinvolte: [],
          configurazione_mediapipe: null
        })

        alert(`${data.assegnazioni.length} esercizi assegnati con successo!`)
      } else {
        setError(data.message || 'Errore nell\'assegnazione degli esercizi')
      }
    } catch (error) {
      console.error('Errore assegnazione esercizi:', error)
      setError('Errore nell\'assegnazione degli esercizi')
    } finally {
      setAssegnandoEsercizio(false)
    }
  }

  const handleRimuoviAssegnazione = async (assegnazioneId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo esercizio dal piano del paziente?')) return

    try {
      const response = await fetch(`/api/esercizi-pazienti/${assegnazioneId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success && pazienteSelezionato) {
        // Ricarica esercizi assegnati
        const refreshResponse = await fetch(`/api/pazienti/${pazienteSelezionato.id}/esercizi`, {
          credentials: 'include'
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setEserciziAssegnati(refreshData.esercizi || [])
        }
      } else {
        setError(data.message || 'Errore nella rimozione dell\'esercizio')
      }
    } catch (error) {
      console.error('Errore rimozione assegnazione:', error)
      setError('Errore nella rimozione dell\'esercizio')
    }
  }

  const handleLogout = async () => {
    await authLogout()
    router.push('/login')
  }

  const handleRegistraPaziente = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fisioterapista) return

    // Validazione
    if (!formPaziente.nome.trim() || !formPaziente.cognome.trim() ||
        !formPaziente.codice_fiscale.trim() || !formPaziente.data_nascita) {
      setError('Nome, cognome, codice fiscale e data di nascita sono obbligatori')
      return
    }

    if (!validaCodiceFiscale(formPaziente.codice_fiscale)) {
      setError('Codice fiscale non valido')
      return
    }

    setRegistrandoPaziente(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register-paziente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fisioterapistaId: fisioterapista.id,
          nome: formPaziente.nome.trim(),
          cognome: formPaziente.cognome.trim(),
          dataNascita: formPaziente.data_nascita,
          codiceFiscale: formPaziente.codice_fiscale.trim().toUpperCase(),
          telefono: formPaziente.telefono.trim() || undefined,
          diagnosi: formPaziente.diagnosi.trim() || '',
          pianoTerapeutico: formPaziente.piano_terapeutico.trim() || '',
          note: formPaziente.note.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success && result.passwordGenerata) {
        // Mostra credenziali generate
        setCredenziali({
          nome_completo: `${formPaziente.nome} ${formPaziente.cognome}`,
          codice_fiscale: formPaziente.codice_fiscale.toUpperCase(),
          password: result.passwordGenerata,
          credenziali_formattate: `CF: ${formPaziente.codice_fiscale.toUpperCase()}\nPassword: ${result.passwordGenerata}`
        })

        // Reset form
        setFormPaziente({
          nome: '',
          cognome: '',
          codice_fiscale: '',
          data_nascita: '',
          telefono: '',
          diagnosi: '',
          piano_terapeutico: '',
          note: ''
        })
        setShowRegistraPaziente(false)

        // Ricarica lista pazienti
        await caricaDatiFisioterapista()
      } else {
        setError(result.message || 'Errore nella registrazione del paziente')
      }
    } catch (error) {
      console.error('Errore registrazione paziente:', error)
      setError('Errore imprevisto durante la registrazione')
    } finally {
      setRegistrandoPaziente(false)
    }
  }

  const stampaCredenziali = () => {
    if (!credenziali) return
    
    const contenuto = credenziali.credenziali_formattate
    const finestra = window.open('', '_blank')
    if (finestra) {
      finestra.document.write(`
        <html>
          <head>
            <title>Credenziali Paziente</title>
            <style>
              body { font-family: monospace; padding: 20px; line-height: 1.6; }
              .credenziali { background: #f5f5f5; padding: 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="credenziali">
              <pre>${contenuto}</pre>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `)
      finestra.document.close()
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay per chiudere sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="flex justify-between items-center p-6 border-b bg-blue-600">
            <h2 className="text-xl font-bold text-white">Menu Gestione</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                caricaEsercizi()
                setShowCategorieModal(true)
                setSidebarOpen(false)
              }}
            >
              <Dumbbell className="h-5 w-5" />
              Gestione Esercizi
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                setShowRegistraPaziente(true)
                setSidebarOpen(false)
              }}
            >
              <UserPlus className="h-5 w-5" />
              Registra Nuovo Paziente
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                router.push('/sessione')
                setSidebarOpen(false)
              }}
            >
              📹 Nuova Sessione
            </Button>

            <div className="border-t my-4" />

            <p className="text-xs text-gray-500 font-semibold px-2 mb-2">DEBUG & TEST</p>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => {
                router.push('/sessione/test-123?mode=patient')
                setSidebarOpen(false)
              }}
            >
              👤 Sessione Demo (Paziente)
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => {
                router.push('/sessione/test-123?mode=therapist')
                setSidebarOpen(false)
              }}
            >
              🧑‍⚕️ Sessione Demo (Fisioterapista)
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => {
                router.push('/dashboard/fisioterapista/landmark-reference')
                setSidebarOpen(false)
              }}
            >
              📋 Riferimento Landmark MediaPipe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Fisioterapista</h1>
                {fisioterapista && (
                  <p className="text-gray-600 mt-1">
                    Dr. {fisioterapista.nome} {fisioterapista.cognome} - {fisioterapista.nome_clinica}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pazienti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalePazienti}</div>
              <p className="text-xs text-muted-foreground">registrati nel sistema</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pazienti Attivi</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.pazienteAttivi}</div>
              <p className="text-xs text-muted-foreground">in terapia attiva</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessioni Oggi</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sessioniOggi}</div>
              <p className="text-xs text-muted-foreground">completate oggi</p>
            </CardContent>
          </Card>
        </div>

          {/* Dialog Registra Paziente */}
          <Dialog open={showRegistraPaziente} onOpenChange={setShowRegistraPaziente}>
            <DialogPortal>
              <DialogOverlay className="bg-black/70" />
              <DialogContent className="!max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-2xl z-[60] p-8">
              <DialogHeader>
                <DialogTitle>Registra Nuovo Paziente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegistraPaziente} className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nome" className="mb-2 block">Nome *</Label>
                    <Input
                      id="nome"
                      value={formPaziente.nome}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cognome" className="mb-2 block">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formPaziente.cognome}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, cognome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="codice_fiscale" className="mb-2 block">Codice Fiscale *</Label>
                    <Input
                      id="codice_fiscale"
                      value={formPaziente.codice_fiscale}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, codice_fiscale: e.target.value.toUpperCase() }))}
                      placeholder="RSSMRA85M01H501Z"
                      maxLength={16}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_nascita" className="mb-2 block">Data di Nascita *</Label>
                    <Input
                      id="data_nascita"
                      type="date"
                      value={formPaziente.data_nascita}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, data_nascita: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="mb-2 block">Telefono</Label>
                    <Input
                      id="telefono"
                      value={formPaziente.telefono}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="diagnosi" className="mb-2 block">Diagnosi</Label>
                  <Textarea
                    id="diagnosi"
                    value={formPaziente.diagnosi}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, diagnosi: e.target.value }))}
                    placeholder="Descrizione della diagnosi post-traumatica o ortopedica"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="piano_terapeutico" className="mb-2 block">Piano Terapeutico</Label>
                  <Textarea
                    id="piano_terapeutico"
                    value={formPaziente.piano_terapeutico}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, piano_terapeutico: e.target.value }))}
                    placeholder="Piano riabilitativo"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="note" className="mb-2 block">Note</Label>
                  <Textarea
                    id="note"
                    value={formPaziente.note}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Note aggiuntive per il paziente"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowRegistraPaziente(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={registrandoPaziente}>
                    {registrandoPaziente ? 'Registrazione...' : 'Registra Paziente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </DialogPortal>
          </Dialog>

          {/* Lista Pazienti */}
        <Card>
          <CardHeader>
            <CardTitle>Gestione Pazienti</CardTitle>
          </CardHeader>
          <CardContent>
            {pazienti.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun paziente registrato</p>
                <p className="text-sm">Usa il pulsante sopra per registrare il primo paziente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pazienti.map((paziente) => (
                  <div key={paziente.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {paziente.nome_paziente} {paziente.cognome_paziente}
                          </h3>
                          <Badge variant={paziente.attivo ? 'default' : 'secondary'}>
                            {paziente.attivo ? 'Attivo' : 'Non Attivo'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>CF:</strong> {paziente.codice_fiscale}</p>
                          <p><strong>Nato:</strong> {new Date(paziente.data_nascita).toLocaleDateString()}</p>
                          {paziente.telefono && <p><strong>Tel:</strong> {paziente.telefono}</p>}
                          {paziente.diagnosi && <p><strong>Diagnosi:</strong> {paziente.diagnosi}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                          Dettagli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/fisioterapista/assegna-esercizio?paziente_id=${paziente.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Assegna Esercizi
                        </Button>
                      </div>
                    </div>

                    {/* Sezione Esercizi Assegnati */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Esercizi Assegnati ({paziente.esercizi_assegnati?.length || 0})
                        </h4>
                        {loadingEserciziPaziente[paziente.id] && (
                          <div className="text-xs text-gray-500">Caricamento...</div>
                        )}
                      </div>

                      {paziente.esercizi_assegnati && paziente.esercizi_assegnati.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {paziente.esercizi_assegnati.map((esercizio) => (
                            <div
                              key={esercizio.id}
                              className="border rounded p-2 bg-white hover:bg-blue-50 transition-colors cursor-pointer"
                              onClick={() => {
                                setEsercizioDettaglio(esercizio)
                                setShowDettagliEsercizioModal(true)
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-800 truncate">
                                    {esercizio.esercizio.nome_esercizio}
                                  </h5>
                                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                    {esercizio.esercizio.descrizione}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge
                                      variant={esercizio.attivo ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {esercizio.attivo ? 'Attivo' : 'Inattivo'}
                                    </Badge>
                                    {esercizio.completato && (
                                      <Badge variant="outline" className="bg-green-100 text-xs">
                                        ✓ Completato
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEsercizioDettaglio(esercizio)
                                    setShowDettagliEsercizioModal(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded">
                          <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nessun esercizio assegnato</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalogo Esercizi Physio-Portal */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Esercizi Consigliati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ESERCIZI_PHYSIO_PORTAL.map((esercizio) => (
                <div key={esercizio.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{esercizio.nome}</h4>
                    <Badge variant="outline">Cap. {esercizio.capitolo}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{esercizio.descrizione}</p>
                  <Button size="sm" className="w-full" disabled>
                    Assegna ai Pazienti
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog per stampa credenziali */}
        {credenziali && (
          <Dialog open={!!credenziali} onOpenChange={() => setCredenziali(null)}>
            <DialogPortal>
              <DialogOverlay className="bg-black/70" />
              <DialogContent className="max-w-lg bg-white border-2 border-gray-300 shadow-2xl z-[60]">
              <DialogHeader>
                <DialogTitle>✅ Paziente Registrato con Successo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Credenziali Generate</h4>
                  <p><strong>Paziente:</strong> {credenziali.nome_completo}</p>
                  <p><strong>Login (CF):</strong> {credenziali.codice_fiscale}</p>
                  <p><strong>Password:</strong> {credenziali.password}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{credenziali.credenziali_formattate}</pre>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCredenziali(null)}>
                    Chiudi
                  </Button>
                  <Button onClick={stampaCredenziali}>
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Stampa Credenziali
                  </Button>
                </div>
              </div>
            </DialogContent>
            </DialogPortal>
          </Dialog>
        )}



        {/* Modale Categorie */}
        <Dialog open={showCategorieModal} onOpenChange={setShowCategorieModal}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="!max-w-[95vw] !w-[95vw] h-[90vh] bg-white border-2 border-gray-300 shadow-2xl z-[60] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                  Categorie Esercizi
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Gestisci le categorie</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Organizza i tuoi esercizi per area del corpo ({categorie.length} categorie caricate)
                    </p>
                  </div>
                  <Button onClick={() => {
                    setShowCategorieModal(false)
                    setShowNuovaCategoriaModal(true)
                  }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Categoria
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                
                {loadingEsercizi ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Caricamento categorie...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {categorie.map((categoria) => (
                      <div key={categoria.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white cursor-pointer" onClick={() => {
                        router.push(`/dashboard/fisioterapista/esercizi?categoria=${categoria.id}`)
                      }}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                                                                <h4 className="text-lg font-semibold text-gray-800 mb-2">{categoria.nome_categoria}</h4>
                            <div className="mt-3">
                              <Badge variant="secondary" className="text-xs">
                                {esercizi.length} esercizi totali
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => handleEliminaCategoria(categoria.id)} className="hover:bg-red-50 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {categorie.length === 0 && (
                      <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl">
                        <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nessuna categoria</h3>
                        <p className="text-gray-500 mb-4">Crea la tua prima categoria per organizzare gli esercizi</p>
                        <Button onClick={() => {
                          setShowCategorieModal(false)
                          setShowNuovaCategoriaModal(true)
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Prima Categoria
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Modale Nuova Categoria */}
        <Dialog open={showNuovaCategoriaModal} onOpenChange={(open) => {
          setShowNuovaCategoriaModal(open)
          if (!open) {
            // Reset del form quando si chiude la modale
            setFormCategoria({ nome_categoria: '', img_categoria: 'default_category.jpg' })
          }
        }}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="max-w-2xl bg-white border-2 border-gray-300 shadow-2xl z-[60]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Nuova Categoria
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleAggiungiCategoria} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="nome_categoria">Nome Categoria *</Label>
                  <Input
                    id="nome_categoria"
                    value={formCategoria.nome_categoria}
                    onChange={(e) => setFormCategoria(prev => ({ ...prev, nome_categoria: e.target.value }))}
                    placeholder="Es. Spalla, Anca e ginocchio, Colonna vertebrale"
                    className="h-11"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNuovaCategoriaModal(false)} disabled={salvandoCategoria}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={salvandoCategoria}>
                    {salvandoCategoria ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Modale Esercizi */}
        <Dialog open={showEserciziModal} onOpenChange={setShowEserciziModal}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="!max-w-[98vw] !w-[98vw] h-[90vh] bg-white border-2 border-gray-300 shadow-2xl z-[60] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <Dumbbell className="h-6 w-6 text-green-600" />
                  Esercizi - {categoriaSelezionata?.nome_categoria}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Esercizi della categoria</h3>
                    <p className="text-sm text-gray-600 mt-1">Gestisci gli esercizi per {categoriaSelezionata?.nome_categoria}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowEserciziModal(false)
                      setShowCategorieModal(true)
                    }}>
                      ← Torna alle Categorie
                    </Button>
                    <Button onClick={() => {
                      setFormEsercizio({
                        id_categoria: categoriaSelezionata?.id.toString() || '',
                        nome_esercizio: '',
                        descrizione_esecuzione: '',
                        note: ''
                      })
                      setShowEserciziModal(false)
                      setShowNuovoEsercizioModal(true)
                    }} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Esercizio
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                
                {loadingEsercizi ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Caricamento esercizi...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {esercizi.filter(e => e.id_categoria === categoriaSelezionata?.id).map((esercizio) => (
                      <div key={esercizio.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">{esercizio.nome_esercizio}</h4>
                            <p className="text-gray-600 leading-relaxed mb-3">{esercizio.descrizione || esercizio.descrizione_esecuzione}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {esercizio.configurazione_mediapipe ? 'Configurato' : 'Non Configurato'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleEliminaEsercizio(esercizio.id)} className="hover:bg-red-50 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Pulsanti per avviare sessioni */}
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/sessione/esercizio-${esercizio.id}?mode=patient&esercizio=${esercizio.id}`)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            👤 Sessione Paziente
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/sessione/esercizio-${esercizio.id}?mode=therapist&esercizio=${esercizio.id}`)}
                            className="text-blue-600 hover:text-blue-700 border-blue-300 text-xs"
                          >
                            🧑‍⚕️ Sessione Terapista
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {esercizi.filter(e => e.id_categoria === categoriaSelezionata?.id).length === 0 && (
                      <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl">
                        <Dumbbell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nessun esercizio in questa categoria</h3>
                        <p className="text-gray-500 mb-4">Crea il primo esercizio per {categoriaSelezionata?.nome_categoria}</p>
                        <Button onClick={() => {
                          setFormEsercizio({
                            id_categoria: categoriaSelezionata?.id.toString() || '',
                            nome_esercizio: '',
                            descrizione_esecuzione: '',
                            note: ''
                          })
                          setShowEserciziModal(false)
                          setShowNuovoEsercizioModal(true)
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Primo Esercizio
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Modale Nuovo Esercizio con LandmarkSelector */}
        <Dialog open={showNuovoEsercizioModal} onOpenChange={(open) => {
          setShowNuovoEsercizioModal(open)
          if (!open) {
            // Reset del form quando si chiude la modale
            setFormEsercizio({
              id_categoria: categoriaSelezionata?.id.toString() || '',
              nome_esercizio: '',
              descrizione_esecuzione: '',
              note: ''
            })
          }
        }}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="!max-w-[98vw] !w-[98vw] h-[95vh] bg-white border-2 border-gray-300 shadow-2xl z-[60] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <Plus className="h-5 w-5 text-green-600" />
                  Nuovo Esercizio - {categoriaSelezionata?.nome_categoria}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Configurazione Esercizio</h3>
                    <p className="text-xs text-gray-600 mt-0">
                      Crea un nuovo esercizio per {categoriaSelezionata?.nome_categoria} con selezione landmarks MediaPipe
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="text-xs py-1" onClick={() => {
                      setShowNuovoEsercizioModal(false)
                      setShowEserciziModal(true)
                    }}>
                      ← Torna agli Esercizi
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <LandmarkSelector
                    onSave={handleSalvaEsercizioAvanzato}
                    onCancel={() => setShowNuovoEsercizioModal(false)}
                    categoriaEsercizio={categoriaSelezionata ?? undefined}
                    landmarkType={categoriaSelezionata && /mano|dita|polso/i.test(categoriaSelezionata.nome_categoria) ? 'hand' : 'pose'}
                  />
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Modale Assegnazione Esercizi al Paziente - 3 Pannelli */}
        <Dialog open={showAssegnaEserciziModal} onOpenChange={setShowAssegnaEserciziModal}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="!max-w-[98vw] !w-[98vw] h-[95vh] bg-white border-2 border-gray-300 shadow-2xl z-[60] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Piano Esercizi - {pazienteSelezionato?.nome_paziente} {pazienteSelezionato?.cognome_paziente}
                </DialogTitle>
              </DialogHeader>

              <div className="flex gap-4 h-full overflow-hidden">
                {/* PANNELLO 1: Form Nuovo Esercizio */}
                <div className="w-[35%] flex flex-col border-r pr-4">
                  <h3 className="text-base font-bold mb-3 text-blue-700">➕ Nuovo Esercizio</h3>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    <div>
                      <Label htmlFor="categoria_select" className="text-sm">Categoria *</Label>
                      <select
                        id="categoria_select"
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        value={formNuovoEsercizio.id_categoria}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, id_categoria: e.target.value }))}
                      >
                        <option value="">-- Seleziona categoria --</option>
                        {categorie.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.nome_categoria}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="nome_ex" className="text-sm">Nome Esercizio *</Label>
                      <Input
                        id="nome_ex"
                        value={formNuovoEsercizio.nome_esercizio}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, nome_esercizio: e.target.value }))}
                        placeholder="Es. Flessione spalla"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="descr_ex" className="text-sm">Descrizione Esercizio *</Label>
                      <Textarea
                        id="descr_ex"
                        value={formNuovoEsercizio.descrizione_esercizio}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, descrizione_esercizio: e.target.value }))}
                        placeholder="Descri come eseguire l'esercizio"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="istr_ex" className="text-sm">Istruzioni Aggiuntive</Label>
                      <Textarea
                        id="istr_ex"
                        value={formNuovoEsercizio.istruzioni}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, istruzioni: e.target.value }))}
                        placeholder="Precauzioni, consigli..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="freq_ex" className="text-sm">Frequenza (volte/sett)</Label>
                        <Input
                          id="freq_ex"
                          type="number"
                          min="1"
                          max="7"
                          value={formNuovoEsercizio.frequenza_settimanale}
                          onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, frequenza_settimanale: parseInt(e.target.value) }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dur_ex" className="text-sm">Durata (min)</Label>
                        <Input
                          id="dur_ex"
                          type="number"
                          min="5"
                          max="120"
                          value={formNuovoEsercizio.durata_minuti_consigliata}
                          onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, durata_minuti_consigliata: parseInt(e.target.value) }))}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="rip_ex" className="text-sm">Ripetizioni per Sessione</Label>
                      <Input
                        id="rip_ex"
                        type="number"
                        min="1"
                        max="100"
                        value={formNuovoEsercizio.ripetizioni_per_sessione}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, ripetizioni_per_sessione: parseInt(e.target.value) }))}
                        placeholder="Es. 10 allungamenti"
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="data_i" className="text-sm">Data Inizio</Label>
                        <Input
                          id="data_i"
                          type="date"
                          value={formNuovoEsercizio.data_inizio}
                          onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, data_inizio: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="data_f" className="text-sm">Data Fine</Label>
                        <Input
                          id="data_f"
                          type="date"
                          value={formNuovoEsercizio.data_fine}
                          onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, data_fine: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="obi_ex" className="text-sm">Obiettivi Specifici</Label>
                      <Textarea
                        id="obi_ex"
                        value={formNuovoEsercizio.obiettivi_specifici}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, obiettivi_specifici: e.target.value }))}
                        placeholder="Obiettivi per questo paziente"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="note_ex" className="text-sm">Note per il Paziente</Label>
                      <Textarea
                        id="note_ex"
                        value={formNuovoEsercizio.note_fisioterapista}
                        onChange={(e) => setFormNuovoEsercizio(prev => ({ ...prev, note_fisioterapista: e.target.value }))}
                        placeholder="Istruzioni aggiuntive"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Configurazione Landmark MediaPipe */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Landmark MediaPipe</Label>
                        {formNuovoEsercizio.configurazione_mediapipe && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Configurati
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Salva i dati temporanei in localStorage
                          localStorage.setItem('temp_esercizio_form', JSON.stringify(formNuovoEsercizio))
                          localStorage.setItem('temp_paziente_id', pazienteSelezionato?.id || '')

                          // Naviga alla pagina di configurazione
                          router.push(`/dashboard/fisioterapista/configura-esercizio?categoria=${formNuovoEsercizio.id_categoria}`)
                        }}
                        className="w-full text-sm"
                      >
                        📍 Configura Esercizio Completo
                      </Button>
                      {formNuovoEsercizio.parti_corpo_coinvolte.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Parti coinvolte:</span> {formNuovoEsercizio.parti_corpo_coinvolte.join(', ')}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleAggiungiEsercizioTemporaneo}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi alla Lista
                    </Button>
                  </div>
                </div>

                {/* PANNELLO 2: Esercizi da Assegnare (Lista Temporanea) */}
                <div className="w-[30%] flex flex-col border-r pr-4">
                  <h3 className="text-base font-bold mb-3 text-orange-700">📋 Da Assegnare ({eserciziDaAssegnare.length})</h3>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {eserciziDaAssegnare.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">
                        <Plus className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Lista vuota</p>
                        <p className="text-xs mt-1">Aggiungi esercizi dal pannello sinistro</p>
                      </div>
                    ) : (
                      eserciziDaAssegnare.map((ex) => (
                        <div key={ex.id_temporaneo} className="border-2 border-orange-200 rounded-lg p-3 bg-orange-50 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <Badge variant="outline" className="text-xs mb-1">{ex.nome_categoria}</Badge>
                              <h4 className="font-semibold text-sm">{ex.nome_esercizio}</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRimuoviEsercizioTemporaneo(ex.id_temporaneo)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">{ex.descrizione_esercizio}</p>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>🔄 {ex.frequenza_settimanale}x/sett</span>
                            <span>⏱ {ex.durata_minuti_consigliata}min</span>
                            <span>🔢 {ex.ripetizioni_per_sessione} rip</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    onClick={handleSalvaTuttiEsercizi}
                    disabled={assegnandoEsercizio || eserciziDaAssegnare.length === 0}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-sm"
                  >
                    {assegnandoEsercizio ? 'Salvando...' : `💾 Salva Tutti (${eserciziDaAssegnare.length})`}
                  </Button>
                </div>

                {/* PANNELLO 3: Esercizi Già Assegnati (Storico) */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-bold mb-3 text-green-700">✅ Esercizi Assegnati ({eserciziAssegnati.length})</h3>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {eserciziAssegnati.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-sm">
                        <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nessun esercizio assegnato</p>
                      </div>
                    ) : (
                      eserciziAssegnati.map((assegnazione) => (
                        <div key={assegnazione.id} className="border rounded-lg p-3 bg-green-50 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm">{assegnazione.esercizio.nome_esercizio}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRimuoviAssegnazione(assegnazione.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>

                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{assegnazione.esercizio.descrizione}</p>

                          <div className="flex flex-wrap gap-1 text-xs text-gray-600 mb-2">
                            {assegnazione.frequenza_settimanale && <span className="bg-white px-2 py-0.5 rounded">📅 {assegnazione.frequenza_settimanale}x/sett</span>}
                            {assegnazione.durata_minuti_consigliata && <span className="bg-white px-2 py-0.5 rounded">⏱ {assegnazione.durata_minuti_consigliata}min</span>}
                            {assegnazione.ripetizioni_per_sessione && <span className="bg-white px-2 py-0.5 rounded">🔢 {assegnazione.ripetizioni_per_sessione} rip</span>}
                          </div>

                          {assegnazione.data_inizio && (
                            <p className="text-xs text-gray-500">📆 {new Date(assegnazione.data_inizio).toLocaleDateString()} - {assegnazione.data_fine ? new Date(assegnazione.data_fine).toLocaleDateString() : 'in corso'}</p>
                          )}

                          <div className="mt-2 flex gap-1">
                            <Badge variant={assegnazione.attivo ? 'default' : 'secondary'} className="text-xs">
                              {assegnazione.attivo ? 'Attivo' : 'Inattivo'}
                            </Badge>
                            {assegnazione.completato && (
                              <Badge variant="outline" className="bg-green-100 text-xs">✓ Completato</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Dialog Landmark Selector */}
        <Dialog open={showLandmarkSelector} onOpenChange={setShowLandmarkSelector}>
          <DialogPortal>
            <DialogOverlay className="bg-black/80" />
            <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-y-auto p-2">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-lg">Configura Landmark MediaPipe per l'Esercizio</DialogTitle>
              </DialogHeader>

              <div className="h-[calc(98vh-4rem)] overflow-auto">
                <LandmarkSelector
                  onSave={handleSalvaLandmarkConfig}
                  onCancel={() => {
                    setShowLandmarkSelector(false)
                    setTimeout(() => setShowAssegnaEserciziModal(true), 100)
                  }}
                  categoriaEsercizio={
                    formNuovoEsercizio.id_categoria
                      ? categorie.find(c => c.id === parseInt(formNuovoEsercizio.id_categoria))
                      : undefined
                  }
                  landmarkType="pose"
                />
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>

        {/* Modale Dettagli Esercizio Assegnato */}
        <Dialog open={showDettagliEsercizioModal} onOpenChange={setShowDettagliEsercizioModal}>
          <DialogPortal>
            <DialogOverlay className="bg-black/70" />
            <DialogContent className="max-w-3xl bg-white border-2 border-gray-300 shadow-2xl z-[60] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <Dumbbell className="h-5 w-5 text-blue-600" />
                  Dettagli Esercizio
                </DialogTitle>
              </DialogHeader>

              {esercizioDettaglio && (
                <div className="space-y-6">
                  {/* Intestazione Esercizio */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                      {esercizioDettaglio.esercizio.nome_esercizio}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={esercizioDettaglio.attivo ? 'default' : 'secondary'}>
                        {esercizioDettaglio.attivo ? 'Attivo' : 'Inattivo'}
                      </Badge>
                      {esercizioDettaglio.completato && (
                        <Badge variant="outline" className="bg-green-100">
                          ✓ Completato
                        </Badge>
                      )}
                      {esercizioDettaglio.esercizio.difficolta && (
                        <Badge variant="outline">
                          Difficoltà: {esercizioDettaglio.esercizio.difficolta}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Descrizione e Istruzioni */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Descrizione</h4>
                      <p className="text-gray-600">{esercizioDettaglio.esercizio.descrizione}</p>
                    </div>

                    {esercizioDettaglio.esercizio.istruzioni && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Istruzioni</h4>
                        <p className="text-gray-600">{esercizioDettaglio.esercizio.istruzioni}</p>
                      </div>
                    )}
                  </div>

                  {/* Parametri Esercizio */}
                  <div className="grid grid-cols-2 gap-4">
                    {esercizioDettaglio.frequenza_settimanale && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 mb-1">Frequenza Settimanale</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {esercizioDettaglio.frequenza_settimanale}x/settimana
                        </p>
                      </div>
                    )}
                    {esercizioDettaglio.durata_minuti_consigliata && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 mb-1">Durata Consigliata</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {esercizioDettaglio.durata_minuti_consigliata} minuti
                        </p>
                      </div>
                    )}
                    {esercizioDettaglio.ripetizioni_per_sessione && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 mb-1">Ripetizioni</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {esercizioDettaglio.ripetizioni_per_sessione} ripetizioni
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500 mb-1">Sessioni Completate</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {esercizioDettaglio.numero_sessioni_completate}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data Assegnazione</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(esercizioDettaglio.data_assegnazione).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    {esercizioDettaglio.data_inizio && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data Inizio</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(esercizioDettaglio.data_inizio).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    )}
                    {esercizioDettaglio.data_fine && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data Fine</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(esercizioDettaglio.data_fine).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    )}
                    {esercizioDettaglio.ultima_sessione && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ultima Sessione</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(esercizioDettaglio.ultima_sessione).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Obiettivi Specifici */}
                  {esercizioDettaglio.obiettivi_specifici && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">🎯 Obiettivi Specifici</h4>
                      <p className="text-yellow-800">{esercizioDettaglio.obiettivi_specifici}</p>
                    </div>
                  )}

                  {/* Note Fisioterapista */}
                  {esercizioDettaglio.note_fisioterapista && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">📝 Note del Fisioterapista</h4>
                      <p className="text-purple-800">{esercizioDettaglio.note_fisioterapista}</p>
                    </div>
                  )}

                  {/* Parti del Corpo Coinvolte */}
                  {esercizioDettaglio.esercizio.parti_corpo_coinvolte &&
                   esercizioDettaglio.esercizio.parti_corpo_coinvolte.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Parti del Corpo Coinvolte</h4>
                      <div className="flex flex-wrap gap-2">
                        {esercizioDettaglio.esercizio.parti_corpo_coinvolte.map((parte, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {parte}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Configurazione MediaPipe */}
                  {esercizioDettaglio.esercizio.configurazione_mediapipe && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">⚙️ Configurazione MediaPipe</h4>
                      <Badge variant="secondary">Configurato</Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        L'esercizio ha una configurazione MediaPipe per il tracking dei movimenti
                      </p>
                    </div>
                  )}

                  {/* Pulsanti Azioni */}
                  <div className="flex justify-between items-center gap-3 pt-4 border-t mt-4">
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        if (!confirm('Sei sicuro di voler rimuovere questo esercizio dal piano del paziente?')) return

                        try {
                          const response = await fetch(`/api/esercizi-pazienti/${esercizioDettaglio.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                          })

                          const data = await response.json()

                          if (data.success) {
                            // Chiudi modale
                            setShowDettagliEsercizioModal(false)
                            setEsercizioDettaglio(null)

                            // Ricarica gli esercizi del paziente
                            const pazienteId = esercizioDettaglio.paziente_id
                            if (pazienteId) {
                              await caricaEserciziPaziente(pazienteId)
                            }
                          } else {
                            setError(data.message || 'Errore nella rimozione dell\'esercizio')
                          }
                        } catch (error) {
                          console.error('Errore rimozione esercizio:', error)
                          setError('Errore nella rimozione dell\'esercizio')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina Esercizio
                    </Button>
                    <Button onClick={() => setShowDettagliEsercizioModal(false)} variant="outline">
                      Chiudi
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </DialogPortal>
        </Dialog>
        </div>
      </div>
    </div>
  )
}