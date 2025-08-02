// src/components/providers/ClientProvider.tsx - MODALITÀ DEV
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService } from '@/lib/supabase/auth'
import { Profilo } from '@/types/database'
import { Navbar } from '@/components/shared/Navbar'
import { User } from '@supabase/supabase-js'

interface ClientProviderProps {
  children: React.ReactNode
}

// Tipo per le configurazioni
interface ConfigurazioniSistema {
  [key: string]: string | number | boolean | object
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [utente, setUtente] = useState<User | null>(null)
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const [configurazioni, setConfigurazioni] = useState<ConfigurazioniSistema | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Pagine pubbliche che non richiedono autenticazione
  const paginePubbliche = ['/', '/login', '/register']
  const isPaginaPubblica = paginePubbliche.includes(pathname)

  // MODALITÀ SVILUPPATORE: Bypass per /sessione
  const isDevMode = process.env.NODE_ENV === 'development'
  const isSessionePage = pathname.startsWith('/sessione')

  useEffect(() => {
    // MODALITÀ DEV: Bypass completo per /sessione
    if (isDevMode && isSessionePage) {
      console.log('🔧 DEV MODE: Bypassing auth for sessione page')
      setLoading(false)
      return
    }

    checkAuth()
  }, [pathname, isDevMode, isSessionePage])

  const checkAuth = async () => {
    try {
      const result = await AuthService.getUtenteCorrente()
      
      if (result.success && result.user && result.profilo) {
        setUtente(result.user)
        setProfilo(result.profilo)
        
        // Carica configurazioni durante l'auth
        const configResult = await AuthService.caricaConfigurazioni()
        if (configResult.success && configResult.configurazioni) {
          setConfigurazioni(configResult.configurazioni as ConfigurazioniSistema)
          // Salva in localStorage per accesso rapido
          if (typeof window !== 'undefined') {
            localStorage.setItem('physio_config', JSON.stringify(configResult.configurazioni))
          }
        }
      } else {
        // Non autenticato
        setUtente(null)
        setProfilo(null)
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

  // Loading state - ma non per pagine dev
  if (loading && !(isDevMode && isSessionePage)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar solo se non siamo in dev mode sessione */}
      {!(isDevMode && isSessionePage) && (
        <Navbar utente={utente} profilo={profilo} />
      )}
      <main>{children}</main>
    </div>
  )
}