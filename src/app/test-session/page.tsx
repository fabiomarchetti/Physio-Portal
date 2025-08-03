'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Monitor, User, ExternalLink } from 'lucide-react'

export default function TestSessionPage() {
  const testSessionId = 'test-123'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Test Sistema Dual-Screen
          </h1>
          <p className="text-xl text-gray-600">
            Testa le due viste del sistema di riabilitazione
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Vista Fisioterapista */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-blue-800">
                <Monitor className="h-6 w-6 mr-3" />
                Vista Fisioterapista
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Caratteristiche:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Layout split-screen (50/50)</li>
                    <li>• Video paziente con tutti i landmark</li>
                    <li>• Pannello controlli completo</li>
                    <li>• Analytics real-time</li>
                    <li>• Gestione esercizi</li>
                    <li>• Invio feedback al paziente</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Link href={`/sessione/${testSessionId}?mode=therapist`} target="_blank">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apri Vista Fisioterapista
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Si aprirà in una nuova scheda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista Paziente */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-green-800">
                <User className="h-6 w-6 mr-3" />
                Vista Paziente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-green-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Caratteristiche:</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Fullscreen (schermo intero)</li>
                    <li>• Video mirror (effetto specchio)</li>
                    <li>• Feedback visivo semplificato</li>
                    <li>• Istruzioni grandi e chiare</li>
                    <li>• Indicatori di stato</li>
                    <li>• Ottimizzato per schermi grandi</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Link href={`/sessione/${testSessionId}?mode=patient`} target="_blank">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apri Vista Paziente
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Si aprirà in una nuova scheda - trascinala sul secondo schermo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Istruzioni per il test */}
        <Card className="mt-8 border-2 border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-800">
              📋 Istruzioni per il Test
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Setup Consigliato:</h3>
                <ol className="text-sm space-y-2">
                  <li><strong>1.</strong> Apri prima la vista fisioterapista</li>
                  <li><strong>2.</strong> Consenti l&apos;accesso alla webcam quando richiesto</li>
                  <li><strong>3.</strong> Apri la vista paziente in una nuova scheda</li>
                  <li><strong>4.</strong> Trascina la scheda paziente sul secondo monitor</li>
                  <li><strong>5.</strong> Clicca &quot;Attiva Schermo Intero&quot; nella vista paziente</li>
                  <li><strong>6.</strong> Torna alla vista fisioterapista per i controlli</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Cosa Testare:</h3>
                <ul className="text-sm space-y-2">
                  <li>• ✅ Webcam si avvia nella vista fisioterapista</li>
                  <li>• ✅ Vista paziente occupa tutto lo schermo</li>
                  <li>• ✅ Effetto specchio funziona per il paziente</li>
                  <li>• Avvio/pausa della sessione</li>
                  <li>• Cambio esercizi dal pannello fisioterapista</li>
                  <li>• Invio feedback al paziente (bottoni colorati)</li>
                  <li>• Visualizzazione landmark pose detection</li>
                  <li>• Metriche real-time nel pannello analytics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link rapidi */}
        <div className="mt-8 text-center space-x-4">
          <Link href="/">
            <Button variant="outline">
              ← Torna alla Home
            </Button>
          </Link>
          <Link href="/sessione">
            <Button variant="outline">
              Vai alle Sessioni
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}