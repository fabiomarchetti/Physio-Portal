'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

import { ArrowLeft, Plus, Info } from 'lucide-react'
import { LandmarkSelector, EsercizioPerDatabase } from '@/components/computer-vision/LandmarkSelector'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
  data_creazione: string
  data_aggiornamento: string
}

export default function NuovoEsercizioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<CategoriaEsercizio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // ✅ AGGIUNTO: Stato per il form
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    istruzioni: '',
    difficolta: 'medio',
    durata: 10
  })

  useEffect(() => {
    console.log('🔄 useEffect nuovo-esercizio - Stato attuale:', { 
      authLoading, 
      user: !!user, 
      profile: !!profile, 
      profileRuolo: profile?.ruolo 
    })
    
    // ✅ CORREZIONE: Aspetto che TUTTO sia caricato
    if (authLoading || !user || !profile) {
      console.log('⏳ In attesa di completamento:', { 
        authLoading, 
        user: !!user, 
        profile: !!profile 
      })
      return
    }
    
    // ✅ CORREZIONE: Ora user E profile sono sicuramente caricati
    if (profile.ruolo !== 'fisioterapista') {
      console.log('❌ Utente non autorizzato, ruolo:', profile.ruolo)
      router.push('/dashboard')
      return
    }
    
    console.log('✅ Autenticazione verificata, caricamento categoria...')
    const categoriaId = searchParams.get('categoria')
    if (categoriaId) {
      caricaCategoria(parseInt(categoriaId))
    } else {
      setError('Nessuna categoria selezionata')
      setLoading(false)
    }
  }, [searchParams, user, profile, authLoading, router])

  const caricaCategoria = async (id: number) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categorie_esercizi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCategoriaSelezionata(data)
    } catch (error) {
      console.error('Errore caricamento categoria:', error)
      setError('Errore nel caricamento della categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvaEsercizioAvanzato = async (esercizioConfigurato: EsercizioPerDatabase) => {
    if (!categoriaSelezionata) {
      setError('Nessuna categoria selezionata')
      return
    }
    
    setLoading(true)
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
      
      // Mostra messaggio di successo e torna alla lista esercizi
      console.log('Esercizio salvato con successo:', data)
      router.push(`/dashboard/fisioterapista/esercizi?categoria=${categoriaSelezionata.id}`)
      
    } catch (error) {
      console.error('Errore salvataggio esercizio avanzato:', error)
      setError('Errore nel salvataggio dell\'esercizio')
    } finally {
      setLoading(false)
    }
  }

  // ✅ NUOVA FUNZIONE: Salva i dati del form
  const handleSalvaForm = async () => {
    if (!categoriaSelezionata) {
      setError('Nessuna categoria selezionata')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // Prepara i dati per il salvataggio dal form
      const datiEsercizio = {
        id_categoria: categoriaSelezionata.id,
        nome_esercizio: formData.nome,
        descrizione_esecuzione: formData.istruzioni,
        note: formData.descrizione,
        landmark: [] // Array vuoto per ora, sarà popolato dal LandmarkSelector
      }
      
      // Salva nella tabella esercizi
      const { data, error } = await supabase
        .from('esercizi')
        .insert(datiEsercizio)
        .select()
        .single()
      
      if (error) throw error
      
      // Mostra messaggio di successo e torna alla lista esercizi
      console.log('Esercizio salvato con successo:', data)
      router.push(`/dashboard/fisioterapista/esercizi?categoria=${categoriaSelezionata.id}`)
      
    } catch (error) {
      console.error('Errore salvataggio esercizio:', error)
      setError('Errore nel salvataggio dell\'esercizio')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/fisioterapista/esercizi?categoria=${categoriaSelezionata?.id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento categoria...</span>
      </div>
    )
  }

  if (error || !categoriaSelezionata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Errore</h1>
          <p className="text-gray-600 mb-6">{error || 'Categoria non trovata'}</p>
          <Button onClick={() => router.push('/dashboard/fisioterapista')}>
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header della Pagina */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        
        {/* Seconda riga: Titolo e categoria */}
        <div className="flex items-center justify-center gap-3 flex-wrap text-center md:flex-nowrap md:text-left">
          <Plus className="h-5 w-5 text-green-600" />
          <span className="text-2xl font-bold text-gray-800">Nuovo Esercizio</span>
          <span className="hidden md:inline text-gray-300">•</span>
          <span className="text-sm text-gray-600">
            Categoria: <span className="font-semibold">{categoriaSelezionata.nome_categoria}</span>
          </span>
        </div>
      </div>

      {/* Contenuto Principale */}
      <div className="px-6 2xl:px-8 py-6 max-w-[1920px] mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              {/* Titolo + descrizione inline */}
              <div className="flex items-center gap-3 min-w-0">
                <Info className="h-5 w-5 text-blue-600" />
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">
                    Configurazione Esercizio per {categoriaSelezionata.nome_categoria}
                  </h2>
                  <span className="hidden md:inline text-sm text-gray-600 truncate">
                    Crea un nuovo esercizio con selezione landmarks MediaPipe
                  </span>
                </div>
              </div>
              {/* Toolbar su un'unica riga (no wrap) */}
              <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto">
                <Button variant="secondary" size="sm" className="rounded-md">
                  Misura Angoli
                </Button>
                <Button variant="secondary" size="sm" className="rounded-md">
                  Misura Distanze
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-md">
                  Movimento
                </Button>
                <Button variant="destructive" size="sm" className="rounded-md">
                  Pulisci Selezione
                </Button>
              </div>
            </div>
            {/* Hint compattato: nascosto per ridurre altezza, visibile solo su schermi grandi */}
            <p className="text-xs text-gray-500 mt-2 hidden xl:block">
              Seleziona punti per creare un esercizio di movimento
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 xl:gap-8">
              {/* Colonna Sinistra: Stretta (1/4 = 25%) */}
              <div className="space-y-6 lg:sticky lg:top-24 self-start">

                {/* Form Configurazione */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Configurazione
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Esercizio *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Inserisci il nome dell'esercizio"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrizione
                      </label>
                      <textarea
                        value={formData.descrizione}
                        onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descrizione dell'esercizio"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Istruzioni
                      </label>
                      <textarea
                        value={formData.istruzioni}
                        onChange={(e) => setFormData(prev => ({ ...prev, istruzioni: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Istruzioni per l'esecuzione"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficoltà
                        </label>
                        <select
                          value={formData.difficolta}
                          onChange={(e) => setFormData(prev => ({ ...prev, difficolta: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="facile">Facile</option>
                          <option value="medio">Medio</option>
                          <option value="difficile">Difficile</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durata (min)
                        </label>
                        <input
                          type="number"
                          value={formData.durata}
                          onChange={(e) => setFormData(prev => ({ ...prev, durata: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistiche */}
                  <div className="mt-6 p-4 bg-white rounded border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Statistiche</h4>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Landmarks: <span className="font-semibold">0</span></span>
                      <span>Parti corpo: <span className="font-semibold">0</span></span>
                    </div>
                  </div>
                  
                  {/* Pulsanti Azione */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleSalvaForm}
                      disabled={loading || !formData.nome}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60"
                      title={!formData.nome ? "Inserisci il nome dell'esercizio" : undefined}
                    >
                      {loading ? 'Salvataggio...' : 'Salva'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Colonna Destra: Larga (1fr, sfrutta lo spazio restante) */}
              <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  Selezione Landmarks MediaPipe
                </h3>
                <LandmarkSelector
                  onSave={handleSalvaEsercizioAvanzato}
                  onCancel={handleCancel}
                  categoriaEsercizio={categoriaSelezionata}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
