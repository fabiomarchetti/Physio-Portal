'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import PatientView from '@/components/session/PatientView'
import TherapistView from '@/components/session/TherapistView'
import { createClient } from '@/lib/supabase/client'

interface Esercizio {
  id_esercizio: number
  nome_esercizio: string
  descrizione_esecuzione: string
  note?: string
  landmark?: number[]
  id_categoria: number
  categoria?: any
}

export default function SessionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.id as string
  const mode = searchParams.get('mode') || 'therapist'
  const esercizioId = searchParams.get('esercizio')
  
  const [esercizio, setEsercizio] = useState<Esercizio | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carica i dati dell'esercizio se specificato
  useEffect(() => {
    if (esercizioId && esercizioId !== 'test-123') {
      setLoading(true)
      const supabase = createClient()
      
      const loadEsercizio = async () => {
        try {
          const { data, error } = await supabase
            .from('esercizi')
            .select(`
              id_esercizio,
              nome_esercizio,
              descrizione_esecuzione,
              note,
              landmark,
              id_categoria,
              categoria:categorie_esercizi(nome_categoria)
            `)
            .eq('id_esercizio', parseInt(esercizioId))
            .single()
          
          if (error) {
            setError(`Errore nel caricamento dell'esercizio: ${error.message}`)
          } else {
            setEsercizio(data as Esercizio)
          }
        } catch (err: any) {
          setError(`Errore nel caricamento dell'esercizio: ${err.message}`)
        } finally {
          setLoading(false)
        }
      }
      
      loadEsercizio()
    }
  }, [esercizioId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento esercizio...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Errore</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Se è un esercizio specifico, mostra informazioni aggiuntive
  if (esercizio && esercizioId !== 'test-123') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con informazioni esercizio */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {esercizio.nome_esercizio}
                </h1>
                <p className="text-gray-600 mt-1">
                  Categoria: {esercizio.categoria?.nome_categoria || `ID: ${esercizio.id_categoria}`}
                </p>
                {esercizio.descrizione_esecuzione && (
                  <p className="text-gray-600 mt-1 text-sm">
                    {esercizio.descrizione_esecuzione}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  ID Esercizio: {esercizio.id_esercizio}
                </div>
                {esercizio.landmark && (
                  <div className="text-sm text-gray-500 mt-1">
                    Landmarks: {esercizio.landmark.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenuto sessione */}
        {mode === 'patient' ? (
          <PatientView 
            sessionId={sessionId} 
            esercizio={esercizio}
          />
        ) : (
          <TherapistView 
            sessionId={sessionId} 
            esercizio={esercizio}
          />
        )}
      </div>
    )
  }

  // Vista standard per sessioni di test
  function SessionContent() {
    // Vista paziente: fullscreen, semplice, mirror
    if (mode === 'patient') {
      return <PatientView sessionId={sessionId} />
    }

    // Vista fisioterapista: split-screen con controlli
    return <TherapistView sessionId={sessionId} />
  }

  return <SessionContent />
}