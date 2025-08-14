'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { createClient } from '@/lib/supabase/client'
import { AuthService } from '@/lib/supabase/auth'
import { User } from '@supabase/supabase-js'
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
  Save
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
}

interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
  data_creazione: string
  data_aggiornamento: string
}

interface Esercizio {
  id: number
  id_categoria: number
  nome_esercizio: string
  descrizione_esecuzione: string
  note?: string
  landmark?: number[]
  created_at: string
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
  const [user, setUser] = useState<User | null>(null)
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
  
  // Monitora i cambiamenti delle categorie
  useEffect(() => {
    console.log('Stato categorie aggiornato:', categorie)
  }, [categorie])

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])



  const checkAuth = async () => {
    try {
      const result = await AuthService.getUtenteCorrente()
      
      if (result.success && result.user && result.profilo) {
        setUser(result.user)
        
        // Verifica che sia un fisioterapista
        if (result.profilo.ruolo !== 'fisioterapista') {
          setError('Accesso consentito solo ai fisioterapisti')
          router.push('/login')
          return
        }
        
        // Carica dati fisioterapista
        await caricaDatiFisioterapista(result.user.id)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Errore controllo auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const caricaDatiFisioterapista = async (userId: string) => {
    try {
      const supabase = createClient()
      
      // Carica dati fisioterapista (ora con nome/cognome diretti)
      const { data: fisioData, error: fisioError } = await supabase
        .from('fisioterapisti')
        .select(`
          *,
          profilo:profili(*)
        `)
        .eq('profilo_id', userId)
        .single()
        
      if (fisioError) throw fisioError
      setFisioterapista(fisioData)
      
      // Carica pazienti del fisioterapista
      const { data: pazientiData, error: pazientiError } = await supabase
        .from('pazienti')
        .select(`
          *,
          profilo:profili(*)
        `)
        .eq('fisioterapista_id', fisioData.id)
        .order('data_creazione', { ascending: false })
        
      if (pazientiError) throw pazientiError
      setPazienti(pazientiData || [])
      
      // Calcola statistiche
      const pazientiAttivi = pazientiData?.filter(p => p.attivo).length || 0
      setStats({
        totalePazienti: pazientiData?.length || 0,
        pazienteAttivi: pazientiAttivi,
        sessioniOggi: 0 // TODO: implementare conteggio sessioni
      })
      
    } catch (error) {
      console.error('Errore caricamento dati:', error)
      setError('Errore nel caricamento dei dati')
    }
  }

  // Funzioni per gestione esercizi
  const caricaEsercizi = async () => {
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

  const handleAggiungiCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCategoria.nome_categoria.trim()) return
    
    setSalvandoCategoria(true)
    setError('')
    
    console.log('Tentativo di salvataggio categoria:', formCategoria)
    
    try {
      const supabase = createClient()
      
      // Verifica l'utente corrente e il suo ruolo
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Utente corrente:', user?.id)
      
      if (!user) {
        throw new Error('Utente non autenticato')
      }
      
      // Verifica il ruolo dell'utente
      const { data: profilo, error: profiloError } = await supabase
        .from('profili')
        .select('ruolo')
        .eq('id', user.id)
        .single()
      
      console.log('Profilo utente:', profilo, profiloError)
      
      if (profiloError || profilo?.ruolo !== 'fisioterapista') {
        throw new Error('Accesso negato: solo i fisioterapisti possono creare categorie')
      }
      
      // Inserisce nuova categoria
      const { data, error } = await supabase
        .from('categorie_esercizi')
        .insert({
          nome_categoria: formCategoria.nome_categoria.trim(),
          img_categoria: formCategoria.img_categoria
        })
        .select()
        .single()
      
      console.log('Risultato inserimento:', { data, error })
      
      if (error) {
        console.error('Errore Supabase:', error)
        throw error
      }
      
      console.log('Categoria salvata con successo:', data)
      
      // Reset del form
      setFormCategoria({ nome_categoria: '', img_categoria: 'default_category.jpg' })
      
      // Chiude la modale nuova categoria
      setShowNuovaCategoriaModal(false)
      
      // Piccolo delay per assicurarsi che la modale si chiuda
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Ricarica i dati per assicurarsi che tutto sia sincronizzato
      await caricaEsercizi()
      
      // Riapre la modale delle categorie
      setShowCategorieModal(true)
      
    } catch (error) {
      console.error('Errore salvataggio categoria:', error)
      setError(`Errore nel salvataggio della categoria: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setSalvandoCategoria(false)
    }
  }

  const handleAggiungiEsercizio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEsercizio.nome_esercizio.trim() || !formEsercizio.id_categoria) return
    
    setSalvandoEsercizio(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('esercizi')
        .insert({
          id_categoria: parseInt(formEsercizio.id_categoria),
          nome_esercizio: formEsercizio.nome_esercizio.trim(),
          img_esercizio: 'default_exercise.jpg',
          descrizione_esecuzione: formEsercizio.descrizione_esecuzione.trim(),
          note: formEsercizio.note.trim() || undefined
        })
        .select(`
          *,
          categoria:categorie_esercizi(*)
        `)
        .single()
      
      if (error) throw error
      
      // Aggiorna la lista degli esercizi
      setEsercizi(prev => [...prev, data])
      
      // Reset del form
      setFormEsercizio({
        id_categoria: '',
        nome_esercizio: '',
        descrizione_esecuzione: '',
        note: ''
      })
      
      // Chiude la modale nuovo esercizio e riapre quella degli esercizi
      setShowNuovoEsercizioModal(false)
      setShowEserciziModal(true)
      
    } catch (error) {
      console.error('Errore aggiunta esercizio:', error)
      setError('Errore nell\'aggiunta dell\'esercizio')
    } finally {
      setSalvandoEsercizio(false)
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
      const supabase = createClient()
      
      // Prepara i dati per il salvataggio
      const datiEsercizio = {
        id_categoria: categoriaSelezionata.id,
        nome_esercizio: esercizioConfigurato.nome_esercizio,
        descrizione_esecuzione: esercizioConfigurato.descrizione_esecuzione,
        note: esercizioConfigurato.note || '',
        difficolta: esercizioConfigurato.difficolta,
        durata_consigliata_minuti: esercizioConfigurato.durata_consigliata_minuti,
        parti_corpo_coinvolte: esercizioConfigurato.parti_corpo_coinvolte,
        configurazione_mediapipe: esercizioConfigurato.configurazione_mediapipe,
        created_at: new Date().toISOString()
      }
      
      // Salva nella tabella esercizi
      const { data, error } = await supabase
        .from('esercizi')
        .insert(datiEsercizio)
        .select(`
          *,
          categoria:categorie_esercizi(*)
        `)
        .single()
      
      if (error) throw error
      
      // Aggiorna la lista degli esercizi
      setEsercizi(prev => [...prev, data])
      
      // Chiude la modale e riapre quella degli esercizi
      setShowNuovoEsercizioModal(false)
      setShowEserciziModal(true)
      
      // Mostra messaggio di successo
      console.log('Esercizio salvato con successo:', data)
      
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
      const supabase = createClient()
      
      // Elimina prima gli esercizi associati
      await supabase
        .from('esercizi')
        .delete()
        .eq('id_categoria', id)
      
      // Elimina la categoria
      await supabase
        .from('categorie_esercizi')
        .delete()
        .eq('id', id)
      
      setCategorie(prev => prev.filter(c => c.id !== id))
      setEsercizi(prev => prev.filter(e => e.id_categoria !== id))
      
    } catch (error) {
      console.error('Errore eliminazione categoria:', error)
      setError('Errore nell\'eliminazione della categoria')
    }
  }

  const handleEliminaEsercizio = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return
    
    try {
      const supabase = createClient()
      await supabase
        .from('esercizi')
        .delete()
        .eq('id', id)
      
      setEsercizi(prev => prev.filter(e => e.id !== id))
      
    } catch (error) {
      console.error('Errore eliminazione esercizio:', error)
      setError('Errore nell\'eliminazione dell\'esercizio')
    }
  }

  const handleLogout = async () => {
    const result = await AuthService.logout()
    if (result.success) {
      router.push('/login')
    }
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
      const result = await AuthService.registraPazienteDaFisioterapista({
        nome: formPaziente.nome.trim(),
        cognome: formPaziente.cognome.trim(),
        codice_fiscale: formPaziente.codice_fiscale.trim().toUpperCase(),
        data_nascita: formPaziente.data_nascita,
        telefono: formPaziente.telefono.trim() || undefined,
        diagnosi: formPaziente.diagnosi.trim() || '',
        piano_terapeutico: formPaziente.piano_terapeutico.trim() || '',
        note: formPaziente.note.trim() || undefined,
        fisioterapista_id: fisioterapista.id
      })
      
      if (result.success && result.credenziali) {
        setCredenziali(result.credenziali)
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
        await caricaDatiFisioterapista(user!.id)
      } else {
        setError(result.error?.message || 'Errore nella registrazione del paziente')
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Fisioterapista</h1>
            {fisioterapista && (
              <p className="text-gray-600 mt-1">
                Dr. {fisioterapista.nome} {fisioterapista.cognome} - {fisioterapista.nome_clinica}
              </p>
            )}
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

        {/* Azioni principali */}
        <div className="flex gap-4 flex-wrap">
          <Dialog open={showRegistraPaziente} onOpenChange={setShowRegistraPaziente}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Registra Nuovo Paziente
              </Button>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay className="bg-black/70" />
              <DialogContent className="max-w-2xl bg-white border-2 border-gray-300 shadow-2xl z-[60]">
              <DialogHeader>
                <DialogTitle>Registra Nuovo Paziente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegistraPaziente} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formPaziente.nome}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formPaziente.cognome}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, cognome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="codice_fiscale">Codice Fiscale *</Label>
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
                    <Label htmlFor="data_nascita">Data di Nascita *</Label>
                    <Input
                      id="data_nascita"
                      type="date"
                      value={formPaziente.data_nascita}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, data_nascita: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      value={formPaziente.telefono}
                      onChange={(e) => setFormPaziente(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="diagnosi">Diagnosi</Label>
                  <Textarea
                    id="diagnosi"
                    value={formPaziente.diagnosi}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, diagnosi: e.target.value }))}
                    placeholder="Descrizione della diagnosi post-traumatica o ortopedica"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="piano_terapeutico">Piano Terapeutico</Label>
                  <Textarea
                    id="piano_terapeutico"
                    value={formPaziente.piano_terapeutico}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, piano_terapeutico: e.target.value }))}
                    placeholder="Piano riabilitativo"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={formPaziente.note}
                    onChange={(e) => setFormPaziente(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Note aggiuntive per il paziente"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
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
          
          <Button variant="outline" onClick={() => router.push('/sessione')}>
            📹 Nuova Sessione
          </Button>

          <Button variant="outline" className="flex items-center gap-2" onClick={() => {
            caricaEsercizi()
            setShowCategorieModal(true)
          }}>
            <Dumbbell className="h-4 w-4" />
            Gestione Esercizi
          </Button>


          <Button variant="outline" onClick={() => router.push('/test-auth')}>
            🧪 Debug Sistema
          </Button>
        </div>

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
                    <div className="flex justify-between items-start">
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
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4" />
                          Assegna Esercizi
                        </Button>
                      </div>
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
                                {esercizi.filter(e => e.id_categoria === categoria.id).length} esercizi
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
                      setFormEsercizio(prev => ({ ...prev, id_categoria: categoriaSelezionata?.id.toString() || '' }))
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
                            <p className="text-gray-600 leading-relaxed mb-3">{esercizio.descrizione_esecuzione}</p>
                            {esercizio.note && (
                                                                   <p className="text-sm text-gray-500 italic mb-3">&ldquo;{esercizio.note}&rdquo;</p>
                            )}
                            <div className="flex gap-2">
                              {esercizio.landmark && esercizio.landmark.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {esercizio.landmark.length} landmarks
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleEliminaEsercizio(esercizio.id)} className="hover:bg-red-50 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {esercizi.filter(e => e.id_categoria === categoriaSelezionata?.id).length === 0 && (
                      <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl">
                        <Dumbbell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nessun esercizio in questa categoria</h3>
                        <p className="text-gray-500 mb-4">Crea il primo esercizio per {categoriaSelezionata?.nome_categoria}</p>
                        <Button onClick={() => {
                          setFormEsercizio(prev => ({ ...prev, id_categoria: categoriaSelezionata?.id.toString() || '' }))
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
              id_categoria: '',
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
                    categoriaEsercizio={categoriaSelezionata}
                  />
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
    </div>
  )
}