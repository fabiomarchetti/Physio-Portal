'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { Plus } from 'lucide-react'
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
  
  // Nessun form separato: la configurazione avviene direttamente nel LandmarkSelector

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
    console.log('=== INIZIO SALVATAGGIO ESERCIZIO ===')
    console.log('Esercizio configurato ricevuto:', esercizioConfigurato)
    console.log('Categoria selezionata:', categoriaSelezionata)
    
    if (!categoriaSelezionata) {
      setError('Nessuna categoria selezionata')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // Prepara i dati per il salvataggio base
      const datiEsercizio = {
        id_categoria: categoriaSelezionata.id,
        nome_esercizio: esercizioConfigurato.nome_esercizio,
        img_esercizio: 'default_exercise.jpg',
        descrizione_esecuzione: esercizioConfigurato.descrizione_esecuzione,
        note: esercizioConfigurato.note || '',
        landmark: [] // Inizialmente vuoto, verrà configurato nella pagina successiva
      }
      
      console.log('Dati esercizio preparati per il database:', datiEsercizio)
      
      // Salva nella tabella esercizi
      const { data, error } = await supabase
        .from('esercizi')
        .insert(datiEsercizio)
        .select()
        .single()
      
      if (error) {
        console.error('Errore Supabase:', error)
        throw error
      }
      
      // Analizza la descrizione per suggerimenti automatici
      const { parseExerciseDescription } = await import('@/lib/exercise-parser')
      const parsedDescription = parseExerciseDescription(esercizioConfigurato.descrizione_esecuzione)
      
      // Mostra messaggio di successo e reindirizza alla configurazione landmark
      console.log('Esercizio salvato con successo nel database:', data)
      toast.success('Esercizio salvato! Ora configura i landmark...')
      
      // Reindirizza alla pagina di configurazione landmark con i suggerimenti
      const suggestedConfig = encodeURIComponent(JSON.stringify(parsedDescription))
      router.push(`/dashboard/fisioterapista/nuovo-esercizio/configura-landmark/${data.id_esercizio}?suggested=${suggestedConfig}`)
      
    } catch (error) {
      console.error('Errore salvataggio esercizio avanzato:', error)
      setError(`Errore nel salvataggio dell'esercizio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setLoading(false)
      console.log('=== FINE SALVATAGGIO ESERCIZIO ===')
    }
  }

  // La persistenza è gestita da handleSalvaEsercizioAvanzato invocato da LandmarkSelector

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
            <h2 className="text-lg font-semibold text-gray-800">
              Configurazione Esercizio per {categoriaSelezionata.nome_categoria}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Seleziona i landmark e configura l'esercizio, poi premi Salva.</p>
          </div>
          
          <div className="p-6">
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Selezione Landmarks MediaPipe
              </h3>
              <LandmarkSelector
                onSave={handleSalvaEsercizioAvanzato}
                onCancel={handleCancel}
                categoriaEsercizio={categoriaSelezionata}
                landmarkType={/mano|dita|polso/i.test(categoriaSelezionata.nome_categoria) ? 'hand' : 'pose'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
