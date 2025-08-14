'use client'

import { LandmarkSelector, type EsercizioConfigurato } from '@/components/computer-vision/LandmarkSelector'
import { toast } from 'sonner'

export default function TestLandmarkSelectorPage() {
  const handleSave = (esercizio: EsercizioConfigurato) => {
    console.log('🎯 Esercizio configurato:', esercizio)
    toast.success(`Esercizio "${esercizio.nome}" salvato con successo!`)
    
    // Qui potresti salvare nel database
    // await saveEsercizio(esercizio)
  }

  const handleCancel = () => {
    toast.info('Configurazione annullata')
    // Qui potresti tornare alla pagina precedente
    // router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LandmarkSelector 
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
