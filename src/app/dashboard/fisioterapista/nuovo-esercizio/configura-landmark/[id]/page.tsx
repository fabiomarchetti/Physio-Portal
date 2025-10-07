'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { parseExerciseDescription, ParsedExercise } from '@/lib/exercise-parser'
import { LandmarkImageSelector } from '@/components/exercises/LandmarkImageSelector'
import { ValidationConfig } from '@/components/exercises/ValidationConfig'

interface Exercise {
  id_esercizio: number
  nome_esercizio: string
  descrizione: string
  istruzioni: string
  id_categoria: number
}

interface LandmarkConfig {
  body: number[]
  hands: number[]
  face: number[]
  validation: any
}

export default function ConfiguraLandmarkPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const exerciseId = params.id as string
  const suggestedConfig = searchParams.get('suggested')
  
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [parsedDescription, setParsedDescription] = useState<ParsedExercise | null>(null)
  const [landmarkConfig, setLandmarkConfig] = useState<LandmarkConfig>({
    body: [],
    hands: [],
    face: [],
    validation: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (exerciseId) {
      loadExercise()
    }
  }, [exerciseId])

  useEffect(() => {
    if (exercise && suggestedConfig) {
      try {
        const suggested = JSON.parse(decodeURIComponent(suggestedConfig))
        setParsedDescription(suggested)
        
        // Pre-riempi con i suggerimenti
        setLandmarkConfig({
          body: suggested.suggestedLandmarks?.body || [],
          hands: suggested.suggestedLandmarks?.hands || [],
          face: suggested.suggestedLandmarks?.face || [],
          validation: suggested.validation || {}
        })
      } catch (error) {
        console.error('Errore nel parsing dei suggerimenti:', error)
        // Fallback: analizza la descrizione
        if (exercise) {
          const parsed = parseExerciseDescription(exercise.descrizione)
          setParsedDescription(parsed)
          setLandmarkConfig({
            body: parsed.suggestedLandmarks.body,
            hands: parsed.suggestedLandmarks.hands,
            face: parsed.suggestedLandmarks.face,
            validation: parsed.validation
          })
        }
      }
    }
  }, [exercise, suggestedConfig])

  const loadExercise = async () => {
    try {
      // Carica l'esercizio dal database
      const response = await fetch(`/api/exercises/${exerciseId}`)
      if (response.ok) {
        const exerciseData = await response.json()
        setExercise(exerciseData)
      } else {
        toast.error('Errore nel caricamento dell\'esercizio')
      }
    } catch (error) {
      console.error('Errore nel caricamento:', error)
      toast.error('Errore nel caricamento dell\'esercizio')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLandmarkChange = (area: 'body' | 'hands' | 'face', landmarks: number[]) => {
    setLandmarkConfig(prev => ({
      ...prev,
      [area]: landmarks
    }))
  }

  const handleValidationChange = (validation: any) => {
    setLandmarkConfig(prev => ({
      ...prev,
      validation
    }))
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    
    try {
      // Salva la configurazione landmark nel database
      const response = await fetch(`/api/exercises/${exerciseId}/landmarks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          landmark: [
            ...landmarkConfig.body.map(id => id),
            ...landmarkConfig.hands.map(id => id + 100), // Offset per mani
            ...landmarkConfig.face.map(id => id + 200)   // Offset per viso
          ],
          landmark_config: landmarkConfig
        })
      })

      if (response.ok) {
        toast.success('Configurazione landmark salvata con successo!')
        router.push('/dashboard/fisioterapista/esercizi')
      } else {
        toast.error('Errore nel salvataggio della configurazione')
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      toast.error('Errore nel salvataggio della configurazione')
    } finally {
      setIsSaving(false)
    }
  }

  const addAllSuggested = () => {
    if (parsedDescription) {
      setLandmarkConfig({
        body: parsedDescription.suggestedLandmarks.body,
        hands: parsedDescription.suggestedLandmarks.hands,
        face: parsedDescription.suggestedLandmarks.face,
        validation: parsedDescription.validation
      })
      toast.success('Aggiunti tutti i landmark suggeriti!')
    }
  }

  const clearAllLandmarks = () => {
    setLandmarkConfig({
      body: [],
      hands: [],
      face: [],
      validation: {}
    })
    toast.info('Tutti i landmark sono stati rimossi')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Caricamento configurazione landmark...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Esercizio non trovato</h1>
          <Button onClick={() => router.back()}>Torna indietro</Button>
        </div>
      </div>
    )
  }

  const totalLandmarks = landmarkConfig.body.length + landmarkConfig.hands.length + landmarkConfig.face.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configurazione Landmark
        </h1>
        <p className="text-gray-600 text-lg">
          Esercizio: <span className="font-semibold">{exercise.nome_esercizio}</span>
        </p>
        <p className="text-gray-500">
          {exercise.descrizione}
        </p>
      </div>

      {/* Suggerimenti automatici */}
      {parsedDescription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Suggerimenti automatici
              <Badge variant="secondary" className="ml-2">
                Confidenza: {Math.round(parsedDescription.confidence * 100)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {parsedDescription.areas.includes('body') && (
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">🏃‍♂️ Corpo</h4>
                  <p className="text-sm text-gray-600">
                    {parsedDescription.suggestedLandmarks.body.length} punti suggeriti
                  </p>
                </div>
              )}
              
              {parsedDescription.areas.includes('hands') && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✋ Mani</h4>
                  <p className="text-sm text-gray-600">
                    {parsedDescription.suggestedLandmarks.hands.length} punti suggeriti
                  </p>
                </div>
              )}
              
              {parsedDescription.areas.includes('face') && (
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">😊 Viso</h4>
                  <p className="text-sm text-gray-600">
                    {parsedDescription.suggestedLandmarks.face.length} punti suggeriti
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button onClick={addAllSuggested} variant="outline">
                Aggiungi tutti i suggeriti
              </Button>
              <Button onClick={clearAllLandmarks} variant="outline">
                Pulisci tutto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selezione manuale landmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selezione corpo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏃‍♂️ Punti del Corpo
              <Badge variant="outline">{landmarkConfig.body.length} selezionati</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LandmarkImageSelector
              type="body"
              suggested={parsedDescription?.suggestedLandmarks.body || []}
              selected={landmarkConfig.body}
              onLandmarkChange={(landmarks) => handleLandmarkChange('body', landmarks)}
            />
          </CardContent>
        </Card>

        {/* Selezione mani */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✋ Punti delle Mani
              <Badge variant="outline">{landmarkConfig.hands.length} selezionati</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LandmarkImageSelector
              type="hands"
              suggested={parsedDescription?.suggestedLandmarks.hands || []}
              selected={landmarkConfig.hands}
              onLandmarkChange={(landmarks) => handleLandmarkChange('hands', landmarks)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Selezione viso (se necessario) */}
      {parsedDescription?.areas.includes('face') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              😊 Punti del Viso
              <Badge variant="outline">{landmarkConfig.face.length} selezionati</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LandmarkImageSelector
              type="face"
              suggested={parsedDescription?.suggestedLandmarks.face || []}
              selected={landmarkConfig.face}
              onLandmarkChange={(landmarks) => handleLandmarkChange('face', landmarks)}
            />
          </CardContent>
        </Card>
      )}

      {/* Configurazione validazioni */}
      <Card>
        <CardHeader>
          <CardTitle>📏 Configurazione Validazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationConfig
            type={parsedDescription?.validation.type || 'basic'}
            landmarks={landmarkConfig}
            onValidationChange={handleValidationChange}
          />
        </CardContent>
      </Card>

      {/* Riepilogo e azioni */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Riepilogo Configurazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{landmarkConfig.body.length}</div>
              <div className="text-sm text-blue-600">Punti Corpo</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{landmarkConfig.hands.length}</div>
              <div className="text-sm text-green-600">Punti Mani</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{landmarkConfig.face.length}</div>
              <div className="text-sm text-purple-600">Punti Viso</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{totalLandmarks}</div>
              <div className="text-sm text-gray-600">Totale</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {totalLandmarks === 0 ? (
                <span className="text-red-600">⚠️ Nessun landmark selezionato</span>
              ) : (
                <span className="text-green-600">✅ Configurazione pronta per il salvataggio</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => router.back()} variant="outline">
                Annulla
              </Button>
              <Button 
                onClick={handleSaveConfig} 
                disabled={totalLandmarks === 0 || isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? 'Salvando...' : 'Salva Configurazione'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
