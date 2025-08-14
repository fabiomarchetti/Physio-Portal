'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profilo } from '@/types/database'

interface UseAuthReturn {
  user: User | null
  profile: Profilo | null
  loading: boolean
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ CORREZIONE: Creo supabase una sola volta
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    // Ottieni l'utente corrente
    const getCurrentUser = async () => {
      try {
        console.log('🔐 useAuth: Inizializzazione...')
        setLoading(true)
        
        // Ottieni sessione corrente
        console.log('🔐 useAuth: Verifica sessione...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔐 useAuth: Risultato sessione:', { session: !!session, user: !!session?.user, error: sessionError })
        
        if (sessionError) {
          console.error('❌ useAuth: Errore sessione:', sessionError)
          setError(sessionError.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ useAuth: Utente trovato:', session.user.id)
          setUser(session.user)
          
          // Ottieni profilo utente
          console.log('🔐 useAuth: Caricamento profilo...')
          const { data: profiloData, error: profiloError } = await supabase
            .from('profili')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profiloError) {
            console.error('❌ useAuth: Errore profilo:', profiloError)
            setError(profiloError.message)
          } else {
            console.log('✅ useAuth: Profilo caricato:', profiloData)
            setProfile(profiloData)
          }
        } else {
          console.log('❌ useAuth: Nessuna sessione attiva')
        }
      } catch (err) {
        console.error('❌ useAuth: Errore generale:', err)
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
        console.log('🔐 useAuth: Inizializzazione completata')
      }
    }

    // Ascolta cambiamenti autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          
          // Ottieni profilo per nuovo utente
          const { data: profiloData } = await supabase
            .from('profili')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          setProfile(profiloData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // Inizializza
    getCurrentUser()

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, []) // ✅ CORREZIONE: Rimuovo dipendenza supabase

  return { user, profile, loading, error }
}
