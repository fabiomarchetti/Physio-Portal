'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ValidationConfigProps {
  type: string
  landmarks: {
    body: number[]
    hands: number[]
    face: number[]
  }
  onValidationChange: (validation: any) => void
}

export const ValidationConfig = ({
  type,
  landmarks,
  onValidationChange
}: ValidationConfigProps) => {
  const [validation, setValidation] = useState<any>({
    type: 'basic',
    maxDistance: 100,
    minDuration: 3000,
    minAngle: 45,
    maxAngle: 120,
    targetAngle: 90,
    minRotation: -45,
    maxRotation: 45,
    targetRotation: 0,
    minMovement: 10,
    maxMovement: 50
  })

  useEffect(() => {
    // Aggiorna il tipo di validazione quando cambia
    setValidation(prev => ({
      ...prev,
      type
    }))
  }, [type])

  useEffect(() => {
    // Notifica i cambiamenti al componente padre
    onValidationChange(validation)
  }, [validation, onValidationChange])

  const handleValidationChange = (field: string, value: any) => {
    setValidation(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getValidationFields = () => {
    switch (type) {
      case 'handToBody':
      case 'handToFace':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxDistance">Distanza massima (pixel)</Label>
              <Input
                id="maxDistance"
                type="number"
                value={validation.maxDistance}
                onChange={(e) => handleValidationChange('maxDistance', parseInt(e.target.value))}
                min="10"
                max="500"
                step="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                Distanza massima tra i punti per considerare l'esercizio completato
              </p>
            </div>
            
            <div>
              <Label htmlFor="minDuration">Durata minima (ms)</Label>
              <Input
                id="minDuration"
                type="number"
                value={validation.minDuration}
                onChange={(e) => handleValidationChange('minDuration', parseInt(e.target.value))}
                min="500"
                max="10000"
                step="500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Tempo minimo per mantenere la posizione
              </p>
            </div>
          </div>
        )
        
      case 'angleMeasurement':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minAngle">Angolo minimo (gradi)</Label>
              <Input
                id="minAngle"
                type="number"
                value={validation.minAngle}
                onChange={(e) => handleValidationChange('minAngle', parseInt(e.target.value))}
                min="0"
                max="180"
                step="5"
              />
            </div>
            
            <div>
              <Label htmlFor="maxAngle">Angolo massimo (gradi)</Label>
              <Input
                id="maxAngle"
                type="number"
                value={validation.maxAngle}
                onChange={(e) => handleValidationChange('maxAngle', parseInt(e.target.value))}
                min="0"
                max="180"
                step="5"
              />
            </div>
            
            <div>
              <Label htmlFor="targetAngle">Angolo obiettivo (gradi)</Label>
              <Input
                id="targetAngle"
                type="number"
                value={validation.targetAngle}
                onChange={(e) => handleValidationChange('targetAngle', parseInt(e.target.value))}
                min="0"
                max="180"
                step="5"
              />
            </div>
          </div>
        )
        
      case 'rotation':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minRotation">Rotazione minima (gradi)</Label>
              <Input
                id="minRotation"
                type="number"
                value={validation.minRotation}
                onChange={(e) => handleValidationChange('minRotation', parseInt(e.target.value))}
                min="-90"
                max="0"
                step="5"
              />
            </div>
            
            <div>
              <Label htmlFor="maxRotation">Rotazione massima (gradi)</Label>
              <Input
                id="maxRotation"
                type="number"
                value={validation.maxRotation}
                onChange={(e) => handleValidationChange('maxRotation', parseInt(e.target.value))}
                min="0"
                max="90"
                step="5"
              />
            </div>
            
            <div>
              <Label htmlFor="targetRotation">Rotazione obiettivo (gradi)</Label>
              <Input
                id="targetRotation"
                type="number"
                value={validation.targetRotation}
                onChange={(e) => handleValidationChange('targetRotation', parseInt(e.target.value))}
                min="-90"
                max="90"
                step="5"
              />
            </div>
          </div>
        )
        
      case 'faceExpression':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minMovement">Movimento minimo (pixel)</Label>
              <Input
                id="minMovement"
                type="number"
                value={validation.minMovement}
                onChange={(e) => handleValidationChange('minMovement', parseInt(e.target.value))}
                min="5"
                max="100"
                step="5"
              />
            </div>
            
            <div>
              <Label htmlFor="maxMovement">Movimento massimo (pixel)</Label>
              <Input
                id="maxMovement"
                type="number"
                value={validation.maxMovement}
                onChange={(e) => handleValidationChange('maxMovement', parseInt(e.target.value))}
                min="10"
                max="200"
                step="5"
              />
            </div>
          </div>
        )
        
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxDistance">Distanza massima (pixel)</Label>
              <Input
                id="maxDistance"
                type="number"
                value={validation.maxDistance}
                onChange={(e) => handleValidationChange('maxDistance', parseInt(e.target.value))}
                min="10"
                max="500"
                step="10"
              />
            </div>
            
            <div>
              <Label htmlFor="minDuration">Durata minima (ms)</Label>
              <Input
                id="minDuration"
                type="number"
                value={validation.minDuration}
                onChange={(e) => handleValidationChange('minDuration', parseInt(e.target.value))}
                min="500"
                max="10000"
                step="500"
              />
            </div>
          </div>
        )
    }
  }

  const getValidationDescription = () => {
    switch (type) {
      case 'handToBody':
        return 'Validazione per esercizi che richiedono di toccare una parte del corpo con la mano'
      case 'handToFace':
        return 'Validazione per esercizi che richiedono di toccare una parte del viso con la mano'
      case 'angleMeasurement':
        return 'Validazione per esercizi che richiedono il raggiungimento di un angolo specifico'
      case 'rotation':
        return 'Validazione per esercizi che richiedono una rotazione della testa o del corpo'
      case 'faceExpression':
        return 'Validazione per esercizi che richiedono movimenti del viso o espressioni'
      default:
        return 'Validazione base per esercizi generici'
    }
  }

  const getPresetValidations = () => {
    const presets = {
      handToBody: {
        name: 'Tocco mano-corpo',
        validation: { type: 'handToBody', maxDistance: 80, minDuration: 2000 }
      },
      angleMeasurement: {
        name: 'Misurazione angolo',
        validation: { type: 'angleMeasurement', minAngle: 45, maxAngle: 120, targetAngle: 90 }
      },
      rotation: {
        name: 'Rotazione testa',
        validation: { type: 'rotation', minRotation: -45, maxRotation: 45, targetRotation: 0 }
      },
      faceExpression: {
        name: 'Espressione facciale',
        validation: { type: 'faceExpression', minMovement: 15, maxMovement: 60 }
      }
    }
    
    return presets
  }

  const applyPreset = (presetKey: string) => {
    const presets = getPresetValidations()
    const preset = presets[presetKey as keyof typeof presets]
    
    if (preset) {
      setValidation(preset.validation)
      toast.success(`Applicato preset: ${preset.name}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Descrizione validazione */}
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">
          Tipo di validazione: {type}
        </h4>
        <p className="text-blue-600 text-sm">
          {getValidationDescription()}
        </p>
      </div>

      {/* Preset rapidi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚡ Preset Rapidi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(getPresetValidations()).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(key)}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurazione personalizzata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚙️ Configurazione Personalizzata</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Parametri Base</TabsTrigger>
              <TabsTrigger value="advanced">Parametri Avanzati</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {getValidationFields()}
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tolerance">Tolleranza (gradi)</Label>
                  <Input
                    id="tolerance"
                    type="number"
                    value={validation.tolerance || 5}
                    onChange={(e) => handleValidationChange('tolerance', parseInt(e.target.value))}
                    min="1"
                    max="20"
                    step="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tolleranza per il raggiungimento dell'obiettivo
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="repetitions">Ripetizioni richieste</Label>
                  <Input
                    id="repetitions"
                    type="number"
                    value={validation.repetitions || 1}
                    onChange={(e) => handleValidationChange('repetitions', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    step="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Numero di ripetizioni per completare l'esercizio
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Note aggiuntive</Label>
                <textarea
                  id="notes"
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                  placeholder="Inserisci note specifiche per questo esercizio..."
                  value={validation.notes || ''}
                  onChange={(e) => handleValidationChange('notes', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Riepilogo validazione */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Riepilogo Validazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Tipo:</span>
              <Badge variant="outline">{validation.type}</Badge>
            </div>
            
            {validation.maxDistance && (
              <div className="flex justify-between">
                <span>Distanza max:</span>
                <span>{validation.maxDistance}px</span>
              </div>
            )}
            
            {validation.minDuration && (
              <div className="flex justify-between">
                <span>Durata min:</span>
                <span>{validation.minDuration}ms</span>
              </div>
            )}
            
            {validation.minAngle && validation.maxAngle && (
              <div className="flex justify-between">
                <span>Range angolo:</span>
                <span>{validation.minAngle}° - {validation.maxAngle}°</span>
              </div>
            )}
            
            {validation.targetAngle && (
              <div className="flex justify-between">
                <span>Angolo obiettivo:</span>
                <span>{validation.targetAngle}°</span>
              </div>
            )}
            
            {validation.minRotation && validation.maxRotation && (
              <div className="flex justify-between">
                <span>Range rotazione:</span>
                <span>{validation.minRotation}° - {validation.maxRotation}°</span>
              </div>
            )}
            
            {validation.tolerance && (
              <div className="flex justify-between">
                <span>Tolleranza:</span>
                <span>±{validation.tolerance}°</span>
              </div>
            )}
            
            {validation.repetitions && (
              <div className="flex justify-between">
                <span>Ripetizioni:</span>
                <span>{validation.repetitions}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
