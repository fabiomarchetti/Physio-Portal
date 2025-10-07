'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Dumbbell, Trash2, Eye, FileText, Clock, Target, Activity, Calendar } from 'lucide-react'
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
  id_esercizio: number
  id_categoria: number
  nome_esercizio: string
  img_esercizio?: string
  descrizione_esecuzione: string
  note?: string
  landmark?: number[]
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
    if (authLoading || !user || !profile) return

    if (profile.ruolo !== 'fisioterapista') {
      router.push('/dashboard')
      return
    }

    const categoriaParam = searchParams.get('categoria')
    const categoriaId = categoriaParam ? parseInt(categoriaParam, 10) : NaN

    if (Number.isNaN(categoriaId)) {
      setError('Nessuna categoria selezionata')
      setLoading(false)
      return
    }

    caricaDati(categoriaId)
  }, [searchParams, user, profile, authLoading, router])

  const caricaDati = async (categoriaId: number) => {
    try {
      const supabase = createClient()
      const { data: categoria, error: errorCategoria } = await supabase
        .from('categorie_esercizi')
        .select('id, nome_categoria, img_categoria, data_creazione, data_aggiornamento')
        .eq('id', categoriaId)
        .single()

      if (errorCategoria) {
        throw errorCategoria
      }
      
      setCategoriaSelezionata(categoria)

      const { data: eserciziData, error: errorEsercizi } = await supabase
        .from('esercizi')
        .select('id_esercizio, id_categoria, nome_esercizio, img_esercizio, descrizione_esecuzione, note, landmark')
        .eq('id_categoria', categoriaId)
        .order('id_esercizio', { ascending: false })

      if (errorEsercizi) {
        throw errorEsercizi
      }
      
      setEsercizi(eserciziData || [])

    } catch (error) {
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
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-800 truncate">
                        {esercizio.nome_esercizio}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {esercizio.descrizione_esecuzione}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminaEsercizio(esercizio.id_esercizio)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {esercizio.note && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{esercizio.note}</span>
                      </div>
                    )}
                    {esercizio.landmark && esercizio.landmark.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Activity className="h-4 w-4" />
                        <span>{esercizio.landmark.length} landmarks selezionati</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>ID: {esercizio.id_esercizio} | Categoria: {esercizio.id_categoria}</span>
                    </div>
                    
                    {/* Pulsanti per avviare sessioni */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/sessione/esercizio-${esercizio.id_esercizio}?mode=patient&esercizio=${esercizio.id_esercizio}`)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        👤 Sessione Paziente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/sessione/esercizio-${esercizio.id_esercizio}?mode=therapist&esercizio=${esercizio.id_esercizio}`)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300 text-xs"
                      >
                        🧑‍⚕️ Sessione Terapista
                      </Button>
                    </div>
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
