'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Dumbbell, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
  data_creazione: string
  data_aggiornamento: string
}

interface Esercizio {
  id_esercizio: number        // ✅ Corretto: nome colonna reale
  id_categoria: number        // ✅ Esiste nel database
  nome_esercizio: string      // ✅ Esiste nel database
  img_esercizio?: string      // ✅ Esiste nel database
  descrizione_esecuzione: string // ✅ Esiste nel database
  note?: string               // ✅ Esiste nel database
  landmark?: string[]         // ✅ Esiste nel database (array)
}

export default function EserciziPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<CategoriaEsercizio | null>(null)
  const [esercizi, setEsercizi] = useState<Esercizio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('🔄 useEffect esercizi - Stato attuale:', { 
      authLoading, 
      user: !!user, 
      profile: !!profile, 
      profileRuolo: profile?.ruolo 
    })
    
    // ✅ CORREZIONE: Aspetto che TUTTO sia caricato
    console.log('🔍 Valori completi:', { 
      authLoading, 
      user, 
      profile,
      userType: typeof user,
      profileType: typeof profile
    })
    
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
    
    console.log('✅ Autenticazione verificata, caricamento dati...')
    const categoriaId = searchParams.get('categoria')
    if (categoriaId) {
      caricaDati(parseInt(categoriaId))
    } else {
      setError('Nessuna categoria selezionata')
      setLoading(false)
    }
  }, [searchParams, user, profile, authLoading, router])

  const caricaDati = async (categoriaId: number) => {
    try {
      console.log('🔄 Caricamento dati per categoria:', categoriaId)
      const supabase = createClient()
      
      // TEST 1: Verifica connessione Supabase
      console.log('🔌 Test connessione Supabase...')
      
      // Test semplice: conta righe
      const { data: testData, error: testError } = await supabase
        .from('categorie_esercizi')
        .select('count')
        .limit(1)
      
      console.log('📊 Test connessione risultato:', { 
        data: testData, 
        error: testError,
        errorType: typeof testError,
        errorKeys: testError ? Object.keys(testError) : null
      })
      
      if (testError) {
        console.error('❌ Errore test connessione:', testError)
        throw new Error(`Test connessione fallito: ${testError.message}`)
      }
      
      // Test 2: Verifica struttura tabella categorie
      console.log('🔍 Test struttura tabella categorie...')
      const { data: structureData, error: structureError } = await supabase
        .from('categorie_esercizi')
        .select('*')
        .limit(1)
      
      console.log('📊 Test struttura categorie risultato:', { 
        data: structureData, 
        error: structureError,
        columns: structureData ? Object.keys(structureData[0] || {}) : null
      })
      
      // Test 3: Verifica struttura tabella esercizi
      console.log('🔍 Test struttura tabella esercizi...')
      const { data: eserciziStructureData, error: eserciziStructureError } = await supabase
        .from('esercizi')
        .select('*')
        .limit(1)
      
      console.log('📊 Test struttura esercizi risultato:', { 
        data: eserciziStructureData, 
        error: eserciziStructureError,
        columns: eserciziStructureData ? Object.keys(eserciziStructureData[0] || {}) : null
      })
      
      // TEST 2: Verifica sessione utente
      console.log('👤 Verifica sessione utente...')
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      console.log('👤 Utente corrente:', currentUser)
      
      if (userError) {
        console.error('❌ Errore verifica utente:', userError)
        throw new Error(`Verifica utente fallita: ${userError.message}`)
      }
      
      // Carica categoria
      console.log('📋 Caricamento categoria...')
      console.log('🔍 Query categoria:', { table: 'categorie_esercizi', id: categoriaId })
      
      const { data: categoria, error: errorCategoria } = await supabase
        .from('categorie_esercizi')
        .select('*')
        .eq('id', categoriaId)
        .single()

      console.log('📊 Risultato query categoria:', { 
        data: categoria, 
        error: errorCategoria,
        errorType: typeof errorCategoria,
        errorKeys: errorCategoria ? Object.keys(errorCategoria) : null
      })

      if (errorCategoria) {
        console.error('❌ Errore caricamento categoria:', errorCategoria)
        throw errorCategoria
      }
      
      console.log('✅ Categoria caricata:', categoria)
      setCategoriaSelezionata(categoria)

      // Carica esercizi
      console.log('🏋️ Caricamento esercizi...')
      
      // TEST: Query semplice senza JOIN
      console.log('🔍 Test query semplice esercizi...')
      const { data: testEsercizi, error: testErrorEsercizi } = await supabase
        .from('esercizi')
        .select('*')
        .limit(1)
      
      console.log('📊 Test query semplice risultato:', { 
        data: testEsercizi, 
        error: testErrorEsercizi,
        errorType: typeof testErrorEsercizi,
        errorKeys: testErrorEsercizi ? Object.keys(testErrorEsercizi) : null
      })
      
      if (testErrorEsercizi) {
        console.error('❌ Tabella esercizi non accessibile:', testErrorEsercizi)
        throw new Error(`Tabella esercizi non accessibile: ${testErrorEsercizi.message}`)
      }
      
      console.log('🔍 Query esercizi separata...')
      
      // ✅ SOLUZIONE: Query separata senza JOIN problematico
                  const { data: eserciziData, error: errorEsercizi } = await supabase
              .from('esercizi')
              .select('*')
              .eq('id_categoria', categoriaId)
              .order('id_esercizio', { ascending: false })

      console.log('📊 Risultato query esercizi:', { 
        data: eserciziData, 
        error: errorEsercizi,
        errorType: typeof errorEsercizi,
        errorKeys: errorEsercizi ? Object.keys(errorEsercizi) : null
      })

      if (errorEsercizi) {
        console.error('❌ Errore caricamento esercizi:', errorEsercizi)
        throw errorEsercizi
      }
      
      console.log('✅ Esercizi caricati:', eserciziData)
      setEsercizi(eserciziData || [])

    } catch (error) {
      console.error('❌ Errore generale caricamento dati:', error)
      setError(`Errore nel caricamento dei dati: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminaEsercizio = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return
    
    try {
      const supabase = createClient()
      await supabase
        .from('esercizi')
        .delete()
        .eq('id_esercizio', id)
      
      setEsercizi(prev => prev.filter(e => e.id_esercizio !== id))
    } catch (error) {
      console.error('Errore eliminazione esercizio:', error)
      setError('Errore nell\'eliminazione dell\'esercizio')
    }
  }

  const handleNuovoEsercizio = () => {
    if (categoriaSelezionata) {
      router.push(`/dashboard/fisioterapista/nuovo-esercizio?categoria=${categoriaSelezionata.id}`)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Verifica autenticazione...</span>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento esercizi...</span>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header della Pagina */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Header compatto: logo + back + titolo/sottotitolo su unica riga */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">


            {/* Titolo + sottotitolo */}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 truncate">
                <Dumbbell className="h-6 w-6 text-green-600 shrink-0" />
                <span className="truncate">Esercizi - {categoriaSelezionata.nome_categoria}</span>
              </h1>
              <p className="text-sm text-gray-600 -mt-0.5 truncate">
                Gestisci gli esercizi per {categoriaSelezionata.nome_categoria}
              </p>
            </div>
          </div>

          {/* Azione destra */}
          <Button onClick={handleNuovoEsercizio} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Esercizio
          </Button>
        </div>
      </div>

      {/* Contenuto Principale */}
      <div className="px-6 py-6">
        {esercizi.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <Dumbbell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nessun esercizio in questa categoria</h3>
            <p className="text-gray-500 mb-4">Crea il primo esercizio per {categoriaSelezionata.nome_categoria}</p>
            <Button onClick={handleNuovoEsercizio}>
              <Plus className="h-4 w-4 mr-2" />
              Crea Primo Esercizio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {esercizi.map((esercizio) => (
              <Card key={esercizio.id_esercizio} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{esercizio.nome_esercizio}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEliminaEsercizio(esercizio.id_esercizio)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {esercizio.descrizione_esecuzione}
                  </p>
                  
                                     {esercizio.note && (
                     <p className="text-sm text-gray-500 italic">
                       &ldquo;{esercizio.note}&rdquo;
                     </p>
                   )}
                  
                  <div className="flex flex-wrap gap-2">
                    {esercizio.landmark && esercizio.landmark.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        {esercizio.landmark.length} landmarks
                      </Badge>
                    )}
                    {esercizio.img_esercizio && (
                      <Badge variant="outline" className="text-xs">
                        Con immagine
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    ID: {esercizio.id_esercizio} | Categoria: {esercizio.id_categoria}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
