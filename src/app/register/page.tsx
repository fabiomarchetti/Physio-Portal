'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthService } from '@/lib/supabase/auth'

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
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validazione password
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      setLoading(false)
      return
    }

    try {
      let result
      
      if (tipoUtente === 'fisioterapista') {
        result = await AuthService.registraFisioterapista({
          nome: formData.nome,
          cognome: formData.cognome,
          email: formData.email,
          password: formData.password,
          numero_albo: formData.numero_albo,
          specializzazione: formData.specializzazione,
          nome_clinica: formData.nome_clinica,
          indirizzo_clinica: formData.indirizzo_clinica,
          telefono: formData.telefono,
          email_clinica: formData.email_clinica
        })
      } else {
        result = await AuthService.registraPaziente({
          nome: formData.nome,
          cognome: formData.cognome,
          email: formData.email,
          password: formData.password,
          data_nascita: formData.data_nascita,
          codice_fiscale: formData.codice_fiscale,
          telefono: formData.telefono,
          codice_fisioterapista: formData.codice_fisioterapista
        })
      }

      if (result.success) {
        router.push('/login?message=Registrazione completata con successo')
      } else {
        setError('Errore durante la registrazione')
      }
    } catch (err) {
      setError('Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
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
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="paziente"
                  name="tipoUtente"
                  type="radio"
                  checked={tipoUtente === 'paziente'}
                  onChange={() => setTipoUtente('paziente')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="paziente" className="ml-3 block text-sm font-medium text-gray-700">
                  Paziente
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="fisioterapista"
                  name="tipoUtente"
                  type="radio"
                  checked={tipoUtente === 'fisioterapista'}
                  onChange={() => setTipoUtente('fisioterapista')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="fisioterapista" className="ml-3 block text-sm font-medium text-gray-700">
                  Fisioterapista
                </label>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campi comuni */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
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
                <Label htmlFor="cognome">Cognome</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimo 6 caratteri"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Campi specifici per fisioterapista */}
            {tipoUtente === 'fisioterapista' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="numero_albo">Numero Albo</Label>
                  <Input
                    id="numero_albo"
                    name="numero_albo"
                    type="text"
                    placeholder="Es. FT12345"
                    value={formData.numero_albo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specializzazione">Specializzazione</Label>
                  <Input
                    id="specializzazione"
                    name="specializzazione"
                    type="text"
                    placeholder="Es. Ortopedica, Neurologica"
                    value={formData.specializzazione}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_clinica">Nome Clinica</Label>
                  <Input
                    id="nome_clinica"
                    name="nome_clinica"
                    type="text"
                    placeholder="Centro Fisioterapico"
                    value={formData.nome_clinica}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indirizzo_clinica">Indirizzo Clinica</Label>
                  <Input
                    id="indirizzo_clinica"
                    name="indirizzo_clinica"
                    type="text"
                    placeholder="Via Roma 123, Milano"
                    value={formData.indirizzo_clinica}
                    onChange={handleInputChange}
                    required
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_clinica">Email Clinica</Label>
                  <Input
                    id="email_clinica"
                    name="email_clinica"
                    type="email"
                    placeholder="info@clinica.com"
                    value={formData.email_clinica}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Campi specifici per paziente */}
            {tipoUtente === 'paziente' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="data_nascita">Data di Nascita</Label>
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
                  <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                  <Input
                    id="codice_fiscale"
                    name="codice_fiscale"
                    type="text"
                    placeholder="RSSMRA80A01H501Z"
                    value={formData.codice_fiscale}
                    onChange={handleInputChange}
                    required
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codice_fisioterapista">Codice Fisioterapista</Label>
                  <Input
                    id="codice_fisioterapista"
                    name="codice_fisioterapista"
                    type="text"
                    placeholder="Numero albo del tuo fisioterapista"
                    value={formData.codice_fisioterapista}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

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