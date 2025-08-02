'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@supabase/auth-helpers-nextjs'
import { AuthService } from '@/lib/supabase/auth'
import { Profilo } from '@/types/database'
import { Navbar } from './Navbar'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [utente, setUtente] = useState<User | null>(null)
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const [configurazioni, setConfigurazioni] = useState<Record<string, Record<string, unknown>> | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Pagine pubbliche che non richiedono autenticazione
  const paginePubbliche = ['/', '/login', '/register']
  const isPaginaPubblica = paginePubbliche.includes(pathname)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const result = await AuthService.getUtenteCorrente()
      
      if (result.success && result.user && result.profilo) {
        setUtente(result.user)
        setProfilo(result.profilo)
        
        // Carica configurazioni durante l'auth
        const configResult = await AuthService.caricaConfigurazioni()
        if (configResult.success) {
          setConfigurazioni(configResult.configurazioni)
          // Salva in localStorage per accesso rapido (solo lato client)
          if (typeof window !== 'undefined') {
            localStorage.setItem('physio_config', JSON.stringify(configResult.configurazioni))
          }
        }
      } else {
        // Non autenticato
        if (!isPaginaPubblica) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Errore controllo autenticazione:', error)
      if (!isPaginaPubblica) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
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
    <div className="min-h-screen">
      <Navbar utente={utente} profilo={profilo} />
      <main className="bg-gradient-to-br from-blue-50 to-indigo-100">
        {children}
      </main>
    </div>
  )
}