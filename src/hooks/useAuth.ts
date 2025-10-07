'use client'

import { useState, useEffect } from 'react'
import { Profilo } from '@/types/database'

interface User {
  id: string
  nome: string
  cognome: string
  email?: string
  ruolo: 'sviluppatore' | 'fisioterapista' | 'paziente'
  datiSpecifici?: any
}

interface UseAuthReturn {
  user: User | null
  profile: Profilo | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface LoginCredentials {
  email?: string
  codiceFiscale?: string
  password: string
  tipo: 'sviluppatore' | 'fisioterapista' | 'paziente'
}

interface LoginResult {
  success: boolean
  message: string
  user?: User
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica utente corrente da API
  const loadCurrentUser = async () => {
    try {
      console.log('🔐 useAuth: Caricamento utente corrente...')

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log('✅ useAuth: Utente caricato:', data.user)
          setUser(data.user)

          // Costruisci profilo dalla risposta
          const profiloData: Profilo = {
            id: data.user.id,
            nome: data.user.nome,
            cognome: data.user.cognome,
            ruolo: data.user.ruolo,
            email: data.user.email || null,
            data_creazione: '',
            data_aggiornamento: '',
          }
          setProfile(profiloData)
        } else {
          console.log('❌ useAuth: Nessun utente autenticato')
          setUser(null)
          setProfile(null)
        }
      } else {
        console.log('❌ useAuth: Risposta non OK:', response.status)
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('❌ useAuth: Errore caricamento utente:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Login
  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)

        // Costruisci profilo
        const profiloData: Profilo = {
          id: data.user.id,
          nome: data.user.nome,
          cognome: data.user.cognome,
          ruolo: data.user.ruolo,
          email: data.user.email || null,
          data_creazione: '',
          data_aggiornamento: '',
        }
        setProfile(profiloData)

        return {
          success: true,
          message: data.message,
          user: data.user,
        }
      }

      setError(data.message)
      return {
        success: false,
        message: data.message,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante il login'
      setError(message)
      return {
        success: false,
        message,
      }
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    try {
      setLoading(true)

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
      setProfile(null)
      setError(null)
    } catch (err) {
      console.error('Errore logout:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il logout')
    } finally {
      setLoading(false)
    }
  }

  // Refresh user
  const refreshUser = async () => {
    await loadCurrentUser()
  }

  // Carica utente all'avvio
  useEffect(() => {
    loadCurrentUser()
  }, [])

  return {
    user,
    profile,
    loading,
    error,
    login,
    logout,
    refreshUser,
  }
}
