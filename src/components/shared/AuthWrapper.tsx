'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from './Navbar'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Pagine pubbliche che non richiedono autenticazione
  const paginePubbliche = ['/', '/login', '/register']
  const isPaginaPubblica = paginePubbliche.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPaginaPubblica) {
      router.push('/login')
    }
  }, [user, loading, pathname, isPaginaPubblica, router])

  if (loading && !isPaginaPubblica) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {!isPaginaPubblica && <Navbar utente={user} profilo={profile} />}
      <main className="bg-gradient-to-br from-blue-50 to-indigo-100">
        {children}
      </main>
    </div>
  )
}