// src/components/providers/ClientProvider.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Profilo } from '@/types/database'
import { Navbar } from '@/components/shared/Navbar'
import { useAuth } from '@/hooks/useAuth'

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Pagine pubbliche che non richiedono autenticazione
  const paginePubbliche = ['/', '/login', '/register']
  const isPaginaPubblica = paginePubbliche.includes(pathname)

  // MODALITÀ SVILUPPATORE: Bypass per /sessione e test pages
  const isDevMode = process.env.NODE_ENV === 'development'
  const isSessionePage = pathname.startsWith('/sessione') ||
                         pathname.startsWith('/test-landmarks') ||
                         pathname.startsWith('/test-auth') ||
                         pathname.startsWith('/debug-database')

  useEffect(() => {
    // MODALITÀ DEV: Bypass completo per sessione/test pages
    if (isDevMode && isSessionePage) {
      console.log('🔧 DEV MODE: Bypassing auth for', pathname)
      return
    }

    // Controlla autenticazione
    if (!loading && !user && !isPaginaPubblica) {
      router.push('/login')
    }
  }, [user, loading, pathname, isPaginaPubblica, isDevMode, isSessionePage, router])

  // Loading state - ma non per pagine dev o pubbliche
  if (loading && !isPaginaPubblica && !(isDevMode && isSessionePage)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar solo se non siamo in dev mode sessione e non in pagine pubbliche */}
      {!(isDevMode && isSessionePage) && !isPaginaPubblica && (
        <Navbar utente={user} profilo={profile} />
      )}
      <main>{children}</main>
    </div>
  )
}
