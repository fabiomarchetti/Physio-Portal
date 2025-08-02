// src/app/register/page.tsx - VERSIONE CORRETTA
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group' // Rimosso temporaneamente
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { AuthService } from '@/lib/supabase/auth'
import { toast } from 'sonner'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

type TipoUtente = 'fisioterapista' | 'paziente'

export default function RegisterPage() {
  const [tipoUtente, setTipoUtente] = useState<TipoUtente>('paziente')
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Campi fisioterapista
    numero_albo: '',
    specializzazione: '',
    nome_clinica: '',
    indirizzo_clinica: '',
    telefono: '',
    email_clinica: '',
    // Campi paziente
    data_nascita: '',
    codice_fiscale: '',
    codice_fisioterapista: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mostraPassword, setMostraPassword] = useState(false)
  const [mostraConfirmPassword, setMostraConfirmPassword] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Pulisci errore quando l'utente inizia a correggere
    if (error) setError('')
  }

  const validateForm = () => {
    // Validazione campi comuni
    if (!formData.nome.trim()) return 'Il nome è obbligatorio'
    if (!formData.cognome.trim()) return 'Il cognome è obbligatorio'
    if (!formData.email.trim()) return 'L\'email è obbligatoria'
    if (!formData.password) return 'La password è obbligatoria'
    if (formData.password.length < 6) return 'La password deve essere di almeno 6 caratteri'
    if (formData.password !== formData.confirmPassword) return 'Le password non coincidono'

    // Validazione email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) return 'Formato email non valido'

    if (tipoUtente === 'fisioterapista') {
      if (!formData.numero_albo.trim()) return 'Il numero albo è obbligatorio'
      if (!formData.specializzazione.trim()) return 'La specializzazione è obbligatoria'
      if (!formData.nome_clinica.trim()) return 'Il nome della clinica è obbligatorio'
      if (!formData.indirizzo_clinica.trim()) return 'L\'indirizzo della clinica è obbligatorio'
    } else {
      if (!formData.data_nascita) return 'La data di nascita è obbligatoria'
      if (!formData.codice_fisioterapista.trim()) return 'Il codice fisioterapista è obbligatorio'
      
      // Validazione codice fiscale (opzionale ma se inserito deve essere valido)
      if (formData.codice_fiscale && formData.codice_fiscale.length !== 16) {
        return 'Il codice fiscale deve essere di 16 caratteri'
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      let result

      if (tipoUtente === 'fisioterapista') {
        result = await AuthService.registraFisioterapista({
          nome: formData.nome.trim(),
          cognome: formData.cognome.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          numero_albo: formData.numero_albo.trim().toUpperCase(),
          specializzazione: formData.specializzazione.trim(),
          nome_clinica: formData.nome_clinica.trim(),
          indirizzo_clinica: formData.indirizzo_clinica.trim(),
          telefono: formData.telefono.trim() || undefined,
          email_clinica: formData.email_clinica.trim() || undefined
        })
      } else {
        result = await AuthService.registraPaziente({
          nome: formData.nome.trim(),
          cognome: formData.cognome.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          data_nascita: formData.data_nascita,
          codice_fiscale: formData.codice_fiscale.trim().toUpperCase() || undefined,
          telefono: formData.telefono.trim() || undefined,
          codice_fisioterapista: formData.codice_fisioterapista.trim().toUpperCase()
        })
      }

      if (result.success) {
        toast.success('Registrazione completata! Controlla la tua email per verificare l\'account.')
        router.push('/login')
      } else {
        // Gestione errori semplificata - completamente type-safe
        console.error('Registration error:', result.error)
        
        // Converti l'errore in stringa per i controlli
        const errorStr = JSON.stringify(result.error)
        
        // Controlli sui messaggi di errore comuni
        if (errorStr.includes('email') && (errorStr.includes('duplicate') || errorStr.includes('unique'))) {
          setError('Questa email è già registrata')
        } else if (errorStr.includes('albo') && (errorStr.includes('duplicate') || errorStr.includes('unique'))) {
          setError('Questo numero albo è già registrato')
        } else if (errorStr.includes('foreign') || errorStr.includes('not found') || errorStr.includes('invalid')) {
          setError('Codice fisioterapista non valido')
        } else {
          setError('Errore durante la registrazione. Riprova.')
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Registrati a Physio Portal
          </CardTitle>
          <CardDescription className="text-center">
            Crea il tuo account per iniziare
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Selezione tipo utente */}
          <div className="mb-6">
            <Label className="text-base font-medium">Tipo di account</Label>
            <RadioGroup 
              value={tipoUtente} 
              onValueChange={(value: TipoUtente) => setTipoUtente(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paziente" id="paziente" />
                <Label htmlFor="paziente">Paziente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fisioterapista" id="fisioterapista" />
                <Label htmlFor="fisioterapista">Fisioterapista</Label>
              </div>
            </RadioGroup>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campi comuni */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Mario"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  name="cognome"
                  type="text"
                  placeholder="Rossi"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@esempio.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={mostraPassword ? "text" : "password"}
                  placeholder="Minimo 6 caratteri"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setMostraPassword(!mostraPassword)}
                >
                  {mostraPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={mostraConfirmPassword ? "text" : "password"}
                  placeholder="Ripeti la password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setMostraConfirmPassword(!mostraConfirmPassword)}
                >
                  {mostraConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Campi specifici per fisioterapista */}
            {tipoUtente === 'fisioterapista' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="numero_albo">Numero Albo *</Label>
                  <Input
                    id="numero_albo"
                    name="numero_albo"
                    type="text"
                    placeholder="Es. RM12345"
                    value={formData.numero_albo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specializzazione">Specializzazione *</Label>
                  <Input
                    id="specializzazione"
                    name="specializzazione"
                    type="text"
                    placeholder="Es. Fisioterapia Ortopedica"
                    value={formData.specializzazione}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_clinica">Nome Clinica/Studio *</Label>
                  <Input
                    id="nome_clinica"
                    name="nome_clinica"
                    type="text"
                    placeholder="Centro Fisioterapico Rossi"
                    value={formData.nome_clinica}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indirizzo_clinica">Indirizzo Clinica *</Label>
                  <Textarea
                    id="indirizzo_clinica"
                    name="indirizzo_clinica"
                    placeholder="Via Roma 123, 00100 Roma"
                    value={formData.indirizzo_clinica}
                    onChange={handleInputChange}
                    required
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
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
              </>
            )}

            {/* Campi specifici per paziente */}
            {tipoUtente === 'paziente' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="data_nascita">Data di Nascita *</Label>
                  <Input
                    id="data_nascita"
                    name="data_nascita"
                    type="date"
                    value={formData.data_nascita}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codice_fisioterapista">Codice Fisioterapista *</Label>
                  <Input
                    id="codice_fisioterapista"
                    name="codice_fisioterapista"
                    type="text"
                    placeholder="Numero albo del tuo fisioterapista (es. RM12345)"
                    value={formData.codice_fisioterapista}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Chiedi questo codice al tuo fisioterapista
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                  <Input
                    id="codice_fiscale"
                    name="codice_fiscale"
                    type="text"
                    placeholder="RSSMRA80A01H501Z"
                    value={formData.codice_fiscale}
                    onChange={handleInputChange}
                    maxLength={16}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            {/* Visualizzazione errori */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hai già un account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Accedi qui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}