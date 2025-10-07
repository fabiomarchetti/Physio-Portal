'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Users, Database, UserPlus, AlertCircle, Eye, Mail, Key, Trash2, Copy, Check, Printer, Menu, X } from 'lucide-react'
import { toast } from 'sonner'

interface Fisioterapista {
  id: string
  nome: string
  cognome: string
  email: string
  numero_albo: string
  specializzazione: string
  nome_clinica: string
  indirizzo_clinica: string
  telefono?: string
  email_clinica?: string
  data_creazione: string
}

export default function DashboardSviluppatorePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [fisioterapisti, setFisioterapisti] = useState<Fisioterapista[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showRegistraFisio, setShowRegistraFisio] = useState(false)
  const [showDettagliFisio, setShowDettagliFisio] = useState(false)
  const [fisioterapistaSelezionato, setFisioterapistaSelezionato] = useState<Fisioterapista | null>(null)
  const [registrando, setRegistrando] = useState(false)
  const [modificando, setModificando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [resettandoPassword, setResettandoPassword] = useState(false)
  const [nuovaPasswordGenerata, setNuovaPasswordGenerata] = useState<string | null>(null)
  const [showConfermaElimina, setShowConfermaElimina] = useState(false)
  const [passwordCopiata, setPasswordCopiata] = useState(false)
  const [error, setError] = useState('')
  const [credenzialiFisio, setCredenzialiFisio] = useState<{
    nome_completo: string
    email: string
    password: string
  } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [formFisio, setFormFisio] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    numeroAlbo: '',
    specializzazione: '',
    nomeClinica: '',
    indirizzoClinica: '',
    telefono: '',
    emailClinica: ''
  })

  const [formModifica, setFormModifica] = useState({
    nome: '',
    cognome: '',
    email: '',
    numeroAlbo: '',
    specializzazione: '',
    nomeClinica: '',
    indirizzoClinica: '',
    telefono: '',
    emailClinica: ''
  })

  useEffect(() => {
    if (!loading && (!user || user.ruolo !== 'sviluppatore')) {
      router.push('/login')
    } else if (user) {
      caricaFisioterapisti()
    }
  }, [user, loading, router])

  const caricaFisioterapisti = async () => {
    try {
      const response = await fetch('/api/fisioterapisti/list', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setFisioterapisti(data.fisioterapisti || [])
      }
    } catch (error) {
      console.error('Errore caricamento fisioterapisti:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleRegistraFisioterapista = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formFisio.nome || !formFisio.cognome || !formFisio.email || !formFisio.password) {
      setError('Nome, cognome, email e password sono obbligatori')
      return
    }

    setRegistrando(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register-fisioterapista', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formFisio),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fisioterapista registrato con successo!')

        setCredenzialiFisio({
          nome_completo: `${formFisio.nome} ${formFisio.cognome}`,
          email: formFisio.email,
          password: formFisio.password
        })

        // Reset form
        setFormFisio({
          nome: '',
          cognome: '',
          email: '',
          password: '',
          numeroAlbo: '',
          specializzazione: '',
          nomeClinica: '',
          indirizzoClinica: '',
          telefono: '',
          emailClinica: ''
        })

        setShowRegistraFisio(false)
        await caricaFisioterapisti()
      } else {
        setError(result.message || 'Errore durante la registrazione')
        toast.error(result.message || 'Errore durante la registrazione')
      }
    } catch (error) {
      console.error('Errore registrazione:', error)
      setError('Errore durante la registrazione')
      toast.error('Errore durante la registrazione')
    } finally {
      setRegistrando(false)
    }
  }

  const handleApriDettagli = (fisio: Fisioterapista) => {
    setFisioterapistaSelezionato(fisio)
    setNuovaPasswordGenerata(null)
    setPasswordCopiata(false)
    setFormModifica({
      nome: fisio.nome,
      cognome: fisio.cognome,
      email: fisio.email,
      numeroAlbo: fisio.numero_albo || '',
      specializzazione: fisio.specializzazione || '',
      nomeClinica: fisio.nome_clinica || '',
      indirizzoClinica: fisio.indirizzo_clinica || '',
      telefono: fisio.telefono || '',
      emailClinica: fisio.email_clinica || ''
    })
    setShowDettagliFisio(true)
  }

  const handleModificaFisioterapista = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fisioterapistaSelezionato) return

    setModificando(true)
    setError('')

    try {
      const response = await fetch(`/api/fisioterapisti/${fisioterapistaSelezionato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formModifica),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fisioterapista aggiornato con successo!')
        setShowDettagliFisio(false)
        setFisioterapistaSelezionato(null)
        await caricaFisioterapisti()
      } else {
        setError(result.message || 'Errore durante l\'aggiornamento')
        toast.error(result.message || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error)
      setError('Errore durante l\'aggiornamento')
      toast.error('Errore durante l\'aggiornamento')
    } finally {
      setModificando(false)
    }
  }

  const handleCopiaPassword = async () => {
    if (!nuovaPasswordGenerata) return

    try {
      await navigator.clipboard.writeText(nuovaPasswordGenerata)
      setPasswordCopiata(true)
      toast.success('Password copiata negli appunti!')

      // Reset feedback dopo 2 secondi
      setTimeout(() => setPasswordCopiata(false), 2000)
    } catch (error) {
      console.error('Errore copia password:', error)
      toast.error('Errore durante la copia')
    }
  }

  const handleStampaCredenziali = () => {
    if (!fisioterapistaSelezionato || !nuovaPasswordGenerata) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Credenziali Fisioterapista</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
            }
            h1 {
              color: #1e40af;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 10px;
            }
            .credenziali {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .campo {
              margin: 10px 0;
            }
            .label {
              font-weight: bold;
              color: #374151;
            }
            .valore {
              font-size: 18px;
              color: #1f2937;
              font-family: monospace;
            }
            .warning {
              background: #fef3c7;
              padding: 15px;
              border-left: 4px solid #f59e0b;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Credenziali Accesso Fisioterapista</h1>
          <div class="credenziali">
            <div class="campo">
              <div class="label">Nome:</div>
              <div class="valore">${fisioterapistaSelezionato.nome} ${fisioterapistaSelezionato.cognome}</div>
            </div>
            <div class="campo">
              <div class="label">Email:</div>
              <div class="valore">${fisioterapistaSelezionato.email}</div>
            </div>
            <div class="campo">
              <div class="label">Password:</div>
              <div class="valore">${nuovaPasswordGenerata}</div>
            </div>
          </div>
          <div class="warning">
            <strong>⚠️ Attenzione:</strong> Questa password è temporanea. Si consiglia di cambiarla al primo accesso.
          </div>
          <p style="text-align: center; color: #6b7280; margin-top: 40px;">
            Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
          </p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleResetPassword = async () => {
    if (!fisioterapistaSelezionato) return

    setResettandoPassword(true)
    setPasswordCopiata(false)

    try {
      const response = await fetch(`/api/fisioterapisti/${fisioterapistaSelezionato.id}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        setNuovaPasswordGenerata(result.nuovaPassword)
        toast.success('Password resettata con successo!')
      } else {
        toast.error(result.message || 'Errore durante il reset della password')
      }
    } catch (error) {
      console.error('Errore reset password:', error)
      toast.error('Errore durante il reset della password')
    } finally {
      setResettandoPassword(false)
    }
  }

  const handleEliminaFisioterapista = async () => {
    if (!fisioterapistaSelezionato) return

    setEliminando(true)

    try {
      const response = await fetch(`/api/fisioterapisti/${fisioterapistaSelezionato.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fisioterapista eliminato con successo!')
        setShowConfermaElimina(false)
        setShowDettagliFisio(false)
        setFisioterapistaSelezionato(null)
        await caricaFisioterapisti()
      } else {
        toast.error(result.message || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Errore eliminazione:', error)
      toast.error('Errore durante l\'eliminazione')
    } finally {
      setEliminando(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.ruolo !== 'sviluppatore') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay per chiudere sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="flex justify-between items-center p-6 border-b bg-blue-600">
            <h2 className="text-xl font-bold text-white">Menu Sviluppatore</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                setShowRegistraFisio(true)
                setSidebarOpen(false)
              }}
            >
              <UserPlus className="h-5 w-5" />
              Registra Fisioterapista
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                router.push('/dashboard')
                setSidebarOpen(false)
              }}
            >
              <Shield className="h-5 w-5" />
              Dashboard Generale
            </Button>

            <div className="border-t my-4" />

            <p className="text-xs text-gray-500 font-semibold px-2 mb-2">AMMINISTRAZIONE</p>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => {
                caricaFisioterapisti()
                setSidebarOpen(false)
              }}
            >
              <Users className="h-4 w-4" />
              Aggiorna Lista Fisioterapisti
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => {
                router.push('/debug-database')
                setSidebarOpen(false)
              }}
            >
              <Database className="h-4 w-4" />
              Debug Database
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Dashboard Sviluppatore</h1>
                <p className="text-gray-600 mt-1">
                  Benvenuto, {user.nome} {user.cognome}
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fisioterapisti Registrati
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fisioterapisti.length}</div>
              <p className="text-xs text-muted-foreground">
                nel sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Database
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Neon</div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL 17.5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Permessi
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Admin</div>
              <p className="text-xs text-muted-foreground">
                Accesso completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Azioni principali */}
        <div className="flex gap-4 mb-8">
          <Dialog open={showRegistraFisio} onOpenChange={setShowRegistraFisio}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Registra Nuovo Fisioterapista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Registra Nuovo Fisioterapista</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegistraFisioterapista} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nome" className="mb-2 block">Nome *</Label>
                    <Input
                      id="nome"
                      value={formFisio.nome}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cognome" className="mb-2 block">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formFisio.cognome}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, cognome: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formFisio.email}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-2 block">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formFisio.password}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="numeroAlbo" className="mb-2 block">Numero Albo</Label>
                    <Input
                      id="numeroAlbo"
                      value={formFisio.numeroAlbo}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, numeroAlbo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specializzazione" className="mb-2 block">Specializzazione</Label>
                    <Input
                      id="specializzazione"
                      value={formFisio.specializzazione}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, specializzazione: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomeClinica" className="mb-2 block">Nome Clinica</Label>
                    <Input
                      id="nomeClinica"
                      value={formFisio.nomeClinica}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, nomeClinica: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="mb-2 block">Telefono</Label>
                    <Input
                      id="telefono"
                      value={formFisio.telefono}
                      onChange={(e) => setFormFisio(prev => ({ ...prev, telefono: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="indirizzoClinica" className="mb-2 block">Indirizzo Clinica</Label>
                  <Textarea
                    id="indirizzoClinica"
                    value={formFisio.indirizzoClinica}
                    onChange={(e) => setFormFisio(prev => ({ ...prev, indirizzoClinica: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="emailClinica" className="mb-2 block">Email Clinica</Label>
                  <Input
                    id="emailClinica"
                    type="email"
                    value={formFisio.emailClinica}
                    onChange={(e) => setFormFisio(prev => ({ ...prev, emailClinica: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowRegistraFisio(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={registrando}>
                    {registrando ? 'Registrazione...' : 'Registra Fisioterapista'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista Fisioterapisti */}
        <Card>
          <CardHeader>
            <CardTitle>Fisioterapisti Registrati</CardTitle>
            <CardDescription>
              Gestisci i fisioterapisti del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fisioterapisti.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun fisioterapista registrato</p>
                <p className="text-sm">Usa il pulsante sopra per registrare il primo fisioterapista</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fisioterapisti.map((fisio) => (
                  <div key={fisio.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">
                          Dr. {fisio.nome} {fisio.cognome}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {fisio.email}
                          </p>
                          {fisio.numero_albo && <p><strong>Albo:</strong> {fisio.numero_albo}</p>}
                          {fisio.specializzazione && <p><strong>Specializzazione:</strong> {fisio.specializzazione}</p>}
                          {fisio.nome_clinica && <p><strong>Clinica:</strong> {fisio.nome_clinica}</p>}
                          {fisio.telefono && <p><strong>Tel:</strong> {fisio.telefono}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApriDettagli(fisio)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Dettagli/Modifica Fisioterapista */}
        <Dialog open={showDettagliFisio} onOpenChange={setShowDettagliFisio}>
          <DialogContent className="!max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-2xl p-8">
            <DialogHeader>
              <DialogTitle>Dettagli Fisioterapista</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleModificaFisioterapista} className="space-y-4">
              {/* Alert Nuova Password */}
              {nuovaPasswordGenerata && (
                <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
                  <Key className="h-5 w-5 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-semibold text-blue-900 text-lg">✅ Password Resettata con Successo</p>

                      <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">Nuova Password:</p>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-2xl font-bold text-blue-900 flex-1">{nuovaPasswordGenerata}</p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCopiaPassword}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {passwordCopiata ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copiato!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copia
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleStampaCredenziali}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Stampa Credenziali
                        </Button>
                      </div>

                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                        <p className="text-sm text-amber-800">
                          <strong>⚠️ Importante:</strong> Comunica questa password al fisioterapista via email, telefono o consegnala a mano.
                          La password non sarà più visibile dopo aver chiuso questa finestra.
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mod-nome" className="mb-1.5 block">Nome *</Label>
                  <Input
                    id="mod-nome"
                    value={formModifica.nome}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mod-cognome" className="mb-1.5 block">Cognome *</Label>
                  <Input
                    id="mod-cognome"
                    value={formModifica.cognome}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, cognome: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mod-email" className="mb-1.5 block">Email *</Label>
                  <Input
                    id="mod-email"
                    type="email"
                    value={formModifica.email}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mod-numeroAlbo" className="mb-1.5 block">Numero Albo</Label>
                  <Input
                    id="mod-numeroAlbo"
                    value={formModifica.numeroAlbo}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, numeroAlbo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mod-specializzazione" className="mb-1.5 block">Specializzazione</Label>
                  <Input
                    id="mod-specializzazione"
                    value={formModifica.specializzazione}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, specializzazione: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mod-nomeClinica" className="mb-1.5 block">Nome Clinica</Label>
                  <Input
                    id="mod-nomeClinica"
                    value={formModifica.nomeClinica}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, nomeClinica: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mod-telefono" className="mb-1.5 block">Telefono</Label>
                  <Input
                    id="mod-telefono"
                    value={formModifica.telefono}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mod-emailClinica" className="mb-1.5 block">Email Clinica</Label>
                  <Input
                    id="mod-emailClinica"
                    type="email"
                    value={formModifica.emailClinica}
                    onChange={(e) => setFormModifica(prev => ({ ...prev, emailClinica: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mod-indirizzoClinica" className="mb-1.5 block">Indirizzo Clinica</Label>
                <Textarea
                  id="mod-indirizzoClinica"
                  value={formModifica.indirizzoClinica}
                  onChange={(e) => setFormModifica(prev => ({ ...prev, indirizzoClinica: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex justify-between gap-4 pt-4 border-t">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetPassword}
                    disabled={resettandoPassword}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {resettandoPassword ? 'Resettando...' : 'Reset Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowConfermaElimina(true)}
                    disabled={eliminando}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowDettagliFisio(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={modificando} className="min-w-[140px]">
                    {modificando ? 'Salvando...' : 'Salva Modifiche'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Conferma Eliminazione */}
        <Dialog open={showConfermaElimina} onOpenChange={setShowConfermaElimina}>
          <DialogContent className="max-w-md bg-white border-2 border-red-300 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-red-600">⚠️ Conferma Eliminazione</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Stai per eliminare il fisioterapista <strong>{fisioterapistaSelezionato?.nome} {fisioterapistaSelezionato?.cognome}</strong>.
                  <br /><br />
                  ⚠️ Questa azione eliminerà anche tutti i pazienti associati e non può essere annullata!
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfermaElimina(false)}>
                  Annulla
                </Button>
                <Button variant="destructive" onClick={handleEliminaFisioterapista} disabled={eliminando}>
                  {eliminando ? 'Eliminando...' : 'Elimina Definitivamente'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Credenziali Fisioterapista */}
        {credenzialiFisio && (
          <Dialog open={!!credenzialiFisio} onOpenChange={() => setCredenzialiFisio(null)}>
            <DialogContent className="max-w-lg bg-white border-2 border-gray-300 shadow-2xl">
              <DialogHeader>
                <DialogTitle>✅ Fisioterapista Registrato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Credenziali Generate</h4>
                  <p><strong>Nome:</strong> {credenzialiFisio.nome_completo}</p>
                  <p><strong>Email:</strong> {credenzialiFisio.email}</p>
                  <p><strong>Password:</strong> {credenzialiFisio.password}</p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Comunica queste credenziali al fisioterapista. Si consiglia di cambiare la password al primo accesso.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                  <Button onClick={() => setCredenzialiFisio(null)}>
                    Ho preso nota
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>
    </div>
  )
}
