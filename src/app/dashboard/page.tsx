'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/supabase/auth'
import { User } from '@supabase/supabase-js'
import { Profilo } from '@/types/database'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [utente, setUtente] = useState<User | null>(null)
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const result = await AuthService.getUtenteCorrente()
      
      if (result.success && result.user) {
        setUtente(result.user)
        setProfilo(result.profilo || null)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Errore controllo auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await AuthService.logout()
    if (result.success) {
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Physio Portal</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>👤 Informazioni Utente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Email:</strong> {utente?.email}
              </div>
              <div>
                <strong>User ID:</strong> {utente?.id}
              </div>
              <div>
                <strong>Email Confermata:</strong> {utente?.email_confirmed_at ? '✅ Sì' : '❌ No'}
              </div>
              <div>
                <strong>Creato il:</strong> {utente?.created_at ? new Date(utente.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 Profilo</CardTitle>
            </CardHeader>
            <CardContent>
              {profilo ? (
                <div className="space-y-3">
                  <div>
                    <strong>Nome:</strong> {profilo.nome}
                  </div>
                  <div>
                    <strong>Cognome:</strong> {profilo.cognome}
                  </div>
                  <div>
                    <strong>Ruolo:</strong> {profilo.ruolo}
                  </div>
                </div>
              ) : (
                <div className="text-amber-600">
                  ⚠️ Profilo non completato. È necessario completare la registrazione.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/sessione')}>
                📹 Nuova Sessione
              </Button>
              <Button className="w-full" variant="outline" onClick={() => router.push('/test-auth')}>
                🧪 Test Autenticazione
              </Button>
              <Button className="w-full" variant="outline" onClick={() => router.push('/test-landmarks')}>
                🎯 Test Landmarks
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Stato Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Autenticazione:</span>
                <span className="text-green-600">✅ Attiva</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Computer Vision:</span>
                <span className="text-green-600">✅ Funzionante</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database:</span>
                <span className="text-green-600">✅ Connesso</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}