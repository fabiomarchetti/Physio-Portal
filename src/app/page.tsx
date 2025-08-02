import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Activity, BarChart3, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Riabilitazione Motoria
              <span className="block text-blue-600">con Computer Vision</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Il portale innovativo per fisioterapisti e pazienti che utilizza 
              l&apos;intelligenza artificiale per monitorare e migliorare i progressi 
              nella riabilitazione motoria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/register">Inizia Ora</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/login">Accedi</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Funzionalità Avanzate
            </h2>
            <p className="text-xl text-gray-600">
              Tecnologia all&apos;avanguardia per la riabilitazione motoria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Activity className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Tracciamento Movimento</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Rileva i movimenti del corpo in tempo reale utilizzando 
                  MediaPipe e OpenCV per analisi precise.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Analytics Avanzate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Grafici dettagliati e metriche per monitorare 
                  i progressi nel tempo e ottimizzare la terapia.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Gestione Pazienti</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sistema completo per fisioterapisti per gestire 
                  pazienti, sessioni e piani terapeutici.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Uso Domiciliare</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  I pazienti possono eseguire esercizi a casa 
                  con monitoraggio automatico dei progressi.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto a Rivoluzionare la Riabilitazione?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Unisciti a fisioterapisti e pazienti che stanno già utilizzando 
            la tecnologia per migliorare i risultati terapeutici.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Registrati Gratuitamente</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
