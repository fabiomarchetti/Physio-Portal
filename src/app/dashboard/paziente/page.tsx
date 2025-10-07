'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Calendar,
  Target,
  Play,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface PazienteData {
  id: string
  profilo: {
    nome: string
    cognome: string
  }
  nome_paziente: string
  cognome_paziente: string
  diagnosi: string
  piano_terapeutico: string
  attivo: boolean
}

interface SessioneData {
  id: string
  data_inizio: string
  durata_minuti: number
  tipo_esercizio: string
  punteggio_finale: number
  stato: string
}

interface ObiettivoData {
  id: string
  titolo_obiettivo: string
  descrizione: string
  tipo_obiettivo: string
  valore_target: number
  unita_misura: string
  data_scadenza: string
  stato: string
}

export default function DashboardPazientePage() {
  const [paziente, setPaziente] = useState<PazienteData | null>(null)
  const [sessioni, setSessioni] = useState<SessioneData[]>([])
  const [obiettivi, setObiettivi] = useState<ObiettivoData[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const getPazienteData = async () => {
      // Attendi che l'autenticazione sia completata
      if (authLoading) return

      // Se non c'è utente autenticato, reindirizza al login
      if (!user) {
        router.push('/login')
        return
      }

      // Verifica che sia un paziente
      if (user.ruolo !== 'paziente') {
        router.push('/login')
        return
      }

      try {
        setDashboardLoading(true)

        // Ottieni l'ID del paziente dai datiSpecifici
        const pazienteId = user.datiSpecifici?.paziente_id

        if (!pazienteId) {
          setError('ID paziente non trovato')
          return
        }

        // Chiamata API per ottenere dati completi del paziente
        const response = await fetch(`/api/pazienti/${pazienteId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Errore nel caricamento dei dati')
        }

        const data = await response.json()

        if (!data.success) {
          setError(data.message || 'Errore nel caricamento dati paziente')
          return
        }

        setPaziente(data.paziente)
        setSessioni(data.paziente.sessioni || [])
        setObiettivi(data.paziente.obiettivi || [])

      } catch (err) {
        console.error('Errore dashboard paziente:', err)
        setError('Errore nel caricamento della dashboard')
      } finally {
        setDashboardLoading(false)
      }
    }

    getPazienteData()
  }, [authLoading, user, router])

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Caricamento dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Errore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Riprova
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!paziente) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Paziente non trovato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                I tuoi dati paziente non sono stati trovati. Contatta il tuo fisioterapista.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const sessioniCompletate = sessioni.filter(s => s.stato === 'completata').length
  const sessioniTotali = sessioni.length
  const obiettiviCompletati = obiettivi.filter(o => o.stato === 'completato').length
  const obiettiviTotali = obiettivi.length

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Benvenuto, {paziente.nome_paziente} {paziente.cognome_paziente}
          </h1>
          <p className="text-gray-600">
            Monitora i tuoi progressi e gestisci le tue sessioni di riabilitazione
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessioni Completate</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessioniCompletate}</div>
              <p className="text-xs text-gray-600">
                di {sessioniTotali} totali
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obiettivi Raggiunti</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{obiettiviCompletati}</div>
              <p className="text-xs text-gray-600">
                di {obiettiviTotali} totali
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnosi</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-gray-900 truncate">
                {paziente.diagnosi}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stato</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <Badge variant={paziente.attivo ? "default" : "secondary"}>
                {paziente.attivo ? 'Attivo' : 'Inattivo'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Inizia Nuova Sessione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Inizia una nuova sessione di riabilitazione con monitoraggio AI
              </p>
              <Button 
                onClick={() => router.push('/sessione')}
                className="w-full"
              >
                Inizia Sessione
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                I Miei Progressi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visualizza i tuoi progressi e le metriche di riabilitazione
              </p>
              <Button 
                variant="outline"
                onClick={() => router.push('/analytics')}
                className="w-full"
              >
                Visualizza Progressi
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sessioni Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessioni.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nessuna sessione trovata. Inizia la tua prima sessione di riabilitazione!
              </p>
            ) : (
              <div className="space-y-4">
                {sessioni.map((sessione) => (
                  <div key={sessione.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(sessione.data_inizio).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{sessione.tipo_esercizio}</p>
                        <p className="text-sm text-gray-600">
                          Durata: {sessione.durata_minuti} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sessione.stato === 'completata' ? 'default' : 'secondary'}>
                        {sessione.stato}
                      </Badge>
                      {sessione.punteggio_finale && (
                        <span className="text-sm font-medium">
                          Punteggio: {sessione.punteggio_finale}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obiettivi Terapeutici */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Obiettivi Terapeutici
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obiettivi.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nessun obiettivo terapeutico impostato. Contatta il tuo fisioterapista.
              </p>
            ) : (
              <div className="space-y-4">
                {obiettivi.map((obiettivo) => (
                  <div key={obiettivo.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{obiettivo.titolo_obiettivo}</h4>
                      <Badge variant={obiettivo.stato === 'completato' ? 'default' : 'secondary'}>
                        {obiettivo.stato}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{obiettivo.descrizione}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Scadenza: {new Date(obiettivo.data_scadenza).toLocaleDateString('it-IT')}
                      </span>
                      {obiettivo.valore_target && (
                        <span className="font-medium">
                          Target: {obiettivo.valore_target} {obiettivo.unita_misura}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
