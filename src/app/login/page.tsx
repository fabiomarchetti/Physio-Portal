'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [codiceFiscale, setCodiceFiscale] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tipoLogin, setTipoLogin] = useState<'sviluppatore' | 'fisioterapista' | 'paziente'>('sviluppatore')
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const credentials = tipoLogin === 'paziente'
        ? { tipo: tipoLogin, codiceFiscale, password }
        : { tipo: tipoLogin, email, password }

      const result = await login(credentials)

      if (result.success && result.user) {
        toast.success('Login effettuato con successo!')

        // Reindirizza in base al ruolo con hard refresh per garantire cookie
        let dashboardUrl = '/dashboard'
        if (result.user.ruolo === 'sviluppatore') {
          dashboardUrl = '/dashboard/sviluppatore'
        } else if (result.user.ruolo === 'fisioterapista') {
          dashboardUrl = '/dashboard/fisioterapista'
        } else if (result.user.ruolo === 'paziente') {
          dashboardUrl = '/dashboard/paziente'
        }

        // Hard refresh per assicurare che il cookie sia disponibile
        window.location.href = dashboardUrl
      } else {
        toast.error(result.message || 'Credenziali non valide')
      }
    } catch (err) {
      console.error('Errore durante il login:', err)
      toast.error('Errore durante il login')
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
            Seleziona il tipo di accesso e inserisci le credenziali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipoLogin} onValueChange={(v) => setTipoLogin(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-1">
              <TabsTrigger
                value="sviluppatore"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:bg-indigo-100 data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200 transition-colors font-semibold"
              >
                🔧 Sviluppatore
              </TabsTrigger>
              <TabsTrigger
                value="fisioterapista"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:bg-emerald-100 data-[state=inactive]:text-emerald-700 data-[state=inactive]:hover:bg-emerald-200 transition-colors font-semibold"
              >
                👨‍⚕️ Fisioterapista
              </TabsTrigger>
              <TabsTrigger
                value="paziente"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=inactive]:bg-amber-100 data-[state=inactive]:text-amber-700 data-[state=inactive]:hover:bg-amber-200 transition-colors font-semibold"
              >
                🧑 Paziente
              </TabsTrigger>
            </TabsList>

            {/* Login Sviluppatore */}
            <TabsContent value="sviluppatore">
              <div className="mb-4 p-3 bg-indigo-50 border-l-4 border-indigo-600 rounded">
                <p className="text-sm text-indigo-800 font-medium">🔧 Accesso Riservato agli Sviluppatori</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-dev">Email</Label>
                  <Input
                    id="email-dev"
                    type="email"
                    placeholder="sviluppatore@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-dev">Password</Label>
                  <Input
                    id="password-dev"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Accesso in corso...' : '🔧 Accedi come Sviluppatore'}
                </Button>
              </form>
            </TabsContent>

            {/* Login Fisioterapista */}
            <TabsContent value="fisioterapista">
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded">
                <p className="text-sm text-emerald-800 font-medium">👨‍⚕️ Accesso per Fisioterapisti Professionisti</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-fisio">Email</Label>
                  <Input
                    id="email-fisio"
                    type="email"
                    placeholder="fisioterapista@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-fisio">Password</Label>
                  <Input
                    id="password-fisio"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Accesso in corso...' : '👨‍⚕️ Accedi come Fisioterapista'}
                </Button>
              </form>
            </TabsContent>

            {/* Login Paziente */}
            <TabsContent value="paziente">
              <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-600 rounded">
                <p className="text-sm text-amber-800 font-medium">🧑 Accesso per Pazienti in Riabilitazione</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codice-fiscale">Codice Fiscale</Label>
                  <Input
                    id="codice-fiscale"
                    type="text"
                    placeholder="RSSMRA80A01H501U"
                    value={codiceFiscale}
                    onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                    maxLength={16}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-paz">Password</Label>
                  <Input
                    id="password-paz"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password iniziale: prime 5 lettere del codice fiscale in minuscolo
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Accesso in corso...' : '🧑 Accedi come Paziente'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
