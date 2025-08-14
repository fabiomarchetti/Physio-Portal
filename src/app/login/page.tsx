'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthService } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error } = await AuthService.login(email, password)
      if (!success || error) {
        setError('Credenziali non valide')
        return
      }

      // Login riuscito, ora ottieni il profilo per determinare dove reindirizzare
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Ottieni il profilo utente
        const { data: profilo, error: profiloError } = await supabase
          .from('profili')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profiloError) {
          console.error('Errore nel recupero profilo:', profiloError)
          setError('Errore nel recupero del profilo utente')
          return
        }

        if (profilo) {
          // Reindirizza alla dashboard specifica in base al ruolo
          if (profilo.ruolo === 'fisioterapista') {
            toast.success('Login riuscito! Reindirizzamento alla dashboard fisioterapista...')
            router.push('/dashboard/fisioterapista')
          } else if (profilo.ruolo === 'paziente') {
            toast.success('Login riuscito! Reindirizzamento alla dashboard paziente...')
            router.push('/dashboard/paziente')
          } else {
            // Ruolo non riconosciuto, vai alla dashboard generica
            router.push('/dashboard')
          }
        } else {
          // Profilo non trovato, vai a complete-profile
          router.push('/complete-profile')
        }
      } else {
        setError('Errore nel recupero dell\'utente')
      }
    } catch (err) {
      console.error('Errore durante il login:', err)
      setError('Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Accedi a Physio Portal
          </CardTitle>
          <CardDescription className="text-center">
            Inserisci le tue credenziali per accedere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Inserisci la password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Password dimenticata?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Non hai un account?{' '}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Registrati qui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}