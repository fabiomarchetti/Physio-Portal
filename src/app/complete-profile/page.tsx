'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { AuthService } from '@/lib/supabase/auth'
import { User } from '@supabase/supabase-js'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function CompleteProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    ruolo: 'fisioterapista' as 'fisioterapista' | 'paziente',
    // Campi fisioterapista
    numero_albo: '',
    specializzazione: '',
    nome_clinica: '',
    indirizzo_clinica: '',
    telefono: '',
    email_clinica: ''
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)
      
      // Controlla se il profilo esiste già
      const { data: profilo } = await supabase
        .from('profili')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profilo) {
        // Profilo già esistente, vai alla dashboard specifica
        if (profilo.ruolo === 'fisioterapista') {
          router.push('/dashboard/fisioterapista')
        } else if (profilo.ruolo === 'paziente') {
          router.push('/dashboard/paziente')
        } else {
          router.push('/dashboard')
        }
        return
      }

    } catch (err) {
      console.error('Errore controllo utente:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    // Validazione
    if (!formData.nome.trim() || !formData.cognome.trim()) {
      setError('Nome e cognome sono obbligatori')
      return
    }

    // Validazione campi fisioterapista (sempre richiesti)
    if (!formData.numero_albo.trim() || !formData.specializzazione.trim() || 
        !formData.nome_clinica.trim() || !formData.indirizzo_clinica.trim()) {
      setError('Tutti i campi professionali sono obbligatori')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      console.log('🔍 Iniziando completamento profilo per user:', user.id)
      console.log('📝 Dati form:', formData)

      const supabase = createClient()

      // 1. Inserisci profilo direttamente
      console.log('📋 Inserimento profilo...')
      const { error: profilError } = await supabase
        .from('profili')
        .insert({
          id: user.id,
          ruolo: formData.ruolo,
          nome: formData.nome.trim(),
          cognome: formData.cognome.trim()
        })

      if (profilError) {
        console.error('❌ Errore profilo:', profilError)
        throw profilError
      }
      console.log('✅ Profilo inserito')

      // 2. Inserisci dati fisioterapista
      console.log('👨‍⚕️ Inserimento dati fisioterapista...')
      const { error: fisioError } = await supabase
        .from('fisioterapisti')
        .insert({
          profilo_id: user.id,
          numero_albo: formData.numero_albo.trim().toUpperCase(),
          specializzazione: formData.specializzazione.trim(),
          nome_clinica: formData.nome_clinica.trim(),
          indirizzo_clinica: formData.indirizzo_clinica.trim(),
          telefono: formData.telefono.trim() || null,
          email_clinica: formData.email_clinica.trim() || null
        })

      if (fisioError) {
        console.error('❌ Errore fisioterapista:', fisioError)
        throw fisioError
      }
      console.log('✅ Dati fisioterapista inseriti')

      console.log('🎉 Completamento profilo riuscito!')
      setSuccess(true)
      setTimeout(() => {
        // Reindirizza alla dashboard specifica in base al ruolo
        if (formData.ruolo === 'fisioterapista') {
          router.push('/dashboard/fisioterapista')
        } else if (formData.ruolo === 'paziente') {
          router.push('/dashboard/paziente')
        } else {
          router.push('/dashboard')
        }
      }, 2000)

    } catch (err) {
      console.error('❌ Errore completamento profilo:', err)
      console.error('❌ Dettagli errore:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : 'Errore durante il completamento del profilo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-600">Profilo Completato!</h2>
              <p className="text-gray-600">Reindirizzamento alla dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Completa il tuo Profilo
            </CardTitle>
            <p className="text-center text-gray-600">
              Benvenuto {user?.email}! Completa la registrazione per accedere.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campi base */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cognome">Cognome *</Label>
                  <Input
                    id="cognome"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Info ruolo fisioterapista */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <Label className="text-blue-800 font-medium">👨‍⚕️ Registrazione Fisioterapista</Label>
                <p className="text-blue-600 text-sm mt-1">
                  Completa i dati professionali per accedere al sistema di riabilitazione Physio-Portal.
                </p>
              </div>

              {/* Campi fisioterapista */}
              <div className="space-y-4">
                  <div>
                    <Label htmlFor="numero_albo">Numero Albo *</Label>
                    <Input
                      id="numero_albo"
                      name="numero_albo"
                      placeholder="Es. RM12345"
                      value={formData.numero_albo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specializzazione">Specializzazione *</Label>
                    <Input
                      id="specializzazione"
                      name="specializzazione"
                      placeholder="Es. Fisioterapia Ortopedica"
                      value={formData.specializzazione}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nome_clinica">Nome Clinica *</Label>
                    <Input
                      id="nome_clinica"
                      name="nome_clinica"
                      placeholder="Centro Fisioterapico"
                      value={formData.nome_clinica}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="indirizzo_clinica">Indirizzo Clinica *</Label>
                    <Input
                      id="indirizzo_clinica"
                      name="indirizzo_clinica"
                      placeholder="Via Roma 123, Roma"
                      value={formData.indirizzo_clinica}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      placeholder="+39 123 456 7890"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_clinica">Email Clinica</Label>
                    <Input
                      id="email_clinica"
                      name="email_clinica"
                      type="email"
                      placeholder="info@clinica.it"
                      value={formData.email_clinica}
                      onChange={handleInputChange}
                    />
                  </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Completamento in corso...' : 'Completa Profilo'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}