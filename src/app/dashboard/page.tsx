'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profilo, loading, error } = useAuth()

  useEffect(() => {
    console.log('🔍 Dashboard generica - Stato autenticazione:', { user, profilo, loading, error })
    
    if (!loading && profilo) {
      console.log('✅ Profilo trovato, reindirizzamento alla dashboard specifica...')
      // Reindirizza alla dashboard specifica in base al ruolo
      if (profilo.ruolo === 'fisioterapista') {
        console.log('👨‍⚕️ Reindirizzamento a dashboard fisioterapista')
        router.replace('/dashboard/fisioterapista')
      } else if (profilo.ruolo === 'paziente') {
        console.log('👤 Reindirizzamento a dashboard paziente')
        router.replace('/dashboard/paziente')
      }
    } else if (!loading && !profilo && !user) {
      console.log('❌ Nessun utente autenticato, reindirizzamento al login')
      router.replace('/login')
    }
  }, [profilo, loading, error, router, user])

  // Mostra loading mentre verifica l'autenticazione
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  // Se non c'è profilo, reindirizza al login
  if (!profilo) {
    console.log('❌ Profilo non trovato, reindirizzamento al login')
    router.replace('/login')
    return null
  }

  // Fallback - dovrebbe essere reindirizzato automaticamente
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Reindirizzamento...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Stai per essere reindirizzato alla tua dashboard specifica.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Ruolo: <strong>{profilo.ruolo}</strong>
            </p>
            <Button 
              onClick={() => {
                if (profilo.ruolo === 'fisioterapista') {
                  router.push('/dashboard/fisioterapista')
                } else {
                  router.push('/dashboard/paziente')
                }
              }}
              className="w-full"
            >
              Vai alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
