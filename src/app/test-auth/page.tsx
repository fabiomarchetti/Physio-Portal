'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthService } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function TestAuthPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [testData, setTestData] = useState({
    email: 'mario.rossi@test.com',
    password: 'Test123!',
    nome: 'Mario',
    cognome: 'Rossi',
    numero_albo: 'TEST001'
  })

  const [pazienteData, setPazienteData] = useState({
    nome: 'Giuseppe',
    cognome: 'Verdi',
    codice_fiscale: 'VRDGPP85D15H501A',
    data_nascita: '1985-04-15',
    telefono: '+39 338 123 4567',
    diagnosi: 'Distorsione caviglia destra post-infortunio lavorativo',
    piano_terapeutico: 'Riabilitazione proprioceptiva e rinforzo muscolare',
    note: 'Paziente con mobilità ridotta, preferisce esercizi domiciliari',
    fisioterapista_id: '' // Sarà popolato dinamicamente
  })

  const [loginPazienteData, setLoginPazienteData] = useState({
    codice_fiscale: 'VRDGPP85D15H501A',
    password: 'vrdgp85d' // Prime 5 lettere + numeri dal CF (8+ caratteri)
  })

  const [credenziali, setCredenziali] = useState<any>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    setLogs(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  const clearLogs = () => {
    setLogs([])
  }

  // Test 1: Connessione Supabase
  const testSupabaseConnection = async () => {
    setLoading(true)
    addLog('🔍 Testing Supabase connection...')
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('profili').select('count').limit(1)
      
      if (error) {
        addLog(`❌ Supabase connection failed: ${error.message}`, 'error')
      } else {
        addLog('✅ Supabase connection successful', 'success')
      }
    } catch (err) {
      addLog(`❌ Supabase connection error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test 2: Registrazione Fisioterapista
  const testRegistrazioneFisioterapista = async () => {
    setLoading(true)
    addLog('🔍 Testing fisioterapista registration...')
    
    try {
      const result = await AuthService.registraFisioterapista({
        nome: testData.nome,
        cognome: testData.cognome,
        email: testData.email,
        password: testData.password,
        numero_albo: testData.numero_albo,
        specializzazione: 'Test Specialization',
        nome_clinica: 'Test Clinic',
        indirizzo_clinica: 'Test Address 123',
        telefono: '+39 123 456 7890',
        email_clinica: 'clinic@test.com'
      })

      if (result.success) {
        addLog('✅ Fisioterapista registration successful', 'success')
        addLog(`User ID: ${result.user?.id}`, 'info')
      } else {
        addLog(`❌ Registration failed: ${JSON.stringify(result.error)}`, 'error')
      }
    } catch (err) {
      addLog(`❌ Registration error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test 3: Login
  const testLogin = async () => {
    setLoading(true)
    addLog('🔍 Testing login...')
    
    try {
      const result = await AuthService.login(testData.email, testData.password)
      
      if (result.success) {
        addLog('✅ Login successful', 'success')
        addLog(`User ID: ${result.user?.id}`, 'info')
        addLog(`Email: ${result.user?.email}`, 'info')
      } else {
        addLog(`❌ Login failed: ${JSON.stringify(result.error)}`, 'error')
      }
    } catch (err) {
      addLog(`❌ Login error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test 4: Get Current User
  const testGetCurrentUser = async () => {
    setLoading(true)
    addLog('🔍 Testing get current user...')
    
    try {
      const result = await AuthService.getUtenteCorrente()
      
      if (result.success) {
        addLog('✅ Get current user successful', 'success')
        addLog(`User: ${result.user?.email}`, 'info')
        addLog(`Profile: ${result.profilo?.nome} ${result.profilo?.cognome} (${result.profilo?.ruolo})`, 'info')
      } else {
        addLog(`❌ Get current user failed: ${JSON.stringify(result.error)}`, 'error')
      }
    } catch (err) {
      addLog(`❌ Get current user error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test 5: Logout
  const testLogout = async () => {
    setLoading(true)
    addLog('🔍 Testing logout...')
    
    try {
      const result = await AuthService.logout()
      
      if (result.success) {
        addLog('✅ Logout successful', 'success')
      } else {
        addLog(`❌ Logout failed: ${JSON.stringify(result.error)}`, 'error')
      }
    } catch (err) {
      addLog(`❌ Logout error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test 6: Database Tables Check
  const testDatabaseTables = async () => {
    setLoading(true)
    addLog('🔍 Testing database tables...')
    
    try {
      const supabase = createClient()
      
      // Test profili table
      const { data: profili, error: profiliError } = await supabase
        .from('profili')
        .select('count')
        .limit(1)
      
      if (profiliError) {
        addLog(`❌ Profili table error: ${profiliError.message}`, 'error')
      } else {
        addLog('✅ Profili table accessible', 'success')
      }

      // Test fisioterapisti table
      const { data: fisioterapisti, error: fisioterapistiError } = await supabase
        .from('fisioterapisti')
        .select('count')
        .limit(1)
      
      if (fisioterapistiError) {
        addLog(`❌ Fisioterapisti table error: ${fisioterapistiError.message}`, 'error')
      } else {
        addLog('✅ Fisioterapisti table accessible', 'success')
      }

    } catch (err) {
      addLog(`❌ Database tables error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test registrazione paziente da fisioterapista
  const testRegistrazionePaziente = async () => {
    setLoading(true)
    addLog('🏥 Testing patient registration by physiotherapist...')
    
    try {
      // Genera CF unico per ogni test (formato valido italiano)
      const timestamp = Date.now().toString().slice(-2) // Ultime 2 cifre del timestamp
      const cfUnico = `VRDGPP${timestamp}D15H501Z` // CF basato su pattern valido
      const passwordUnica = cfUnico.substring(0, 5).toLowerCase() + cfUnico.substring(6, 8) + 'd'
      
      addLog(`🆔 Using unique CF: ${cfUnico} with password: ${passwordUnica}`, 'info')
      // Prima ottieni l'ID del fisioterapista TEST001
      const supabase = createClient()
      addLog('🔍 Searching for fisioterapista with numero_albo = TEST001...', 'info')
      
      const { data: fisioterapisti, error: fisioError } = await supabase
        .from('fisioterapisti')
        .select('id, numero_albo, profilo:profili(nome, cognome)')
        .eq('numero_albo', 'TEST001')
      
      if (fisioError) {
        addLog(`⚠️ Fisioterapista query error: ${fisioError.message}`, 'error')
        addLog(`Error details: ${JSON.stringify(fisioError)}`, 'error')
        return
      }
      
      addLog(`📊 Query returned ${fisioterapisti?.length || 0} results`, 'info')
      
      if (!fisioterapisti || fisioterapisti.length === 0) {
        addLog('❌ No fisioterapista found with numero_albo TEST001', 'error')
        
        // Debug: mostra tutti i fisioterapisti
        const { data: allFisioterapisti } = await supabase
          .from('fisioterapisti')
          .select('id, numero_albo')
          .limit(5)
        
        addLog('🔍 Available fisioterapisti:', 'info')
        allFisioterapisti?.forEach((f: any) => {
          addLog(`   - ${f.numero_albo} (ID: ${f.id})`, 'info')
        })
        return
      }
      
      const fisioterapista = fisioterapisti[0]
      addLog(`✅ Fisioterapista found: ID ${fisioterapista.id}`, 'success')
      
      const result = await AuthService.registraPazienteDaFisioterapista({
        ...pazienteData,
        codice_fiscale: cfUnico, // Usa CF unico generato
        fisioterapista_id: fisioterapista.id
      })
      
      // Salva CF per il test di login
      if (result.success) {
        setLoginPazienteData({
          codice_fiscale: cfUnico,
          password: passwordUnica
        })
      }
      
      if (result.success) {
        addLog('✅ Patient registration successful', 'success')
        addLog(`Patient: ${result.credenziali?.nome_completo}`, 'info')
        addLog(`CF Login: ${result.credenziali?.codice_fiscale}`, 'info')
        addLog(`Password: ${result.credenziali?.password}`, 'info')
        setCredenziali(result.credenziali)
      } else {
        addLog(`❌ Patient registration failed`, 'error')
        addLog(`Error details: ${JSON.stringify(result.error)}`, 'error')
        
        // Log aggiuntivo per debugging
        if (result.error?.message) {
          addLog(`Error message: ${result.error.message}`, 'error')
        }
        if (result.error?.code) {
          addLog(`Error code: ${result.error.code}`, 'error')
        }
        if (result.error?.details) {
          addLog(`Error details: ${result.error.details}`, 'error')
        }
      }
    } catch (err) {
      addLog(`❌ Patient registration error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test login paziente con CF
  const testLoginPaziente = async () => {
    setLoading(true)
    addLog('🔐 Testing patient login with CF...')
    
    try {
      const result = await AuthService.loginPazienteConCF(loginPazienteData)
      
      if (result.success) {
        addLog('✅ Patient login successful', 'success')
        addLog(`Patient: ${result.paziente?.profilo?.nome} ${result.paziente?.profilo?.cognome}`, 'info')
        addLog(`CF: ${result.paziente?.codice_fiscale}`, 'info')
        addLog(`Diagnosi: ${result.paziente?.diagnosi}`, 'info')
      } else {
        addLog(`❌ Patient login failed: ${JSON.stringify(result.error)}`, 'error')
      }
    } catch (err) {
      addLog(`❌ Patient login error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Test stampa credenziali
  const testStampaCredenziali = async () => {
    setLoading(true)
    addLog('🖨️ Testing credential printing...')
    
    try {
      if (!credenziali) {
        addLog('❌ No credentials available. Register a patient first.', 'error')
        return
      }
      
      addLog('✅ Credentials ready for printing', 'success')
      addLog('📋 Formatted credentials:', 'info')
      
      // Dividi le credenziali in righe e logga ognuna
      const righe = credenziali.credenziali_formattate.split('\n')
      righe.forEach((riga: string) => {
        if (riga.trim()) {
          addLog(`    ${riga}`, 'info')
        }
      })
      
    } catch (err) {
      addLog(`❌ Credential printing error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    clearLogs()
    addLog('🚀 Starting comprehensive auth tests...')
    
    await testSupabaseConnection()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDatabaseTables()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testRegistrazioneFisioterapista()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testLogin()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testGetCurrentUser()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testLogout()
    
    addLog('🏁 All tests completed!')
  }

  // Test per controllare fisioterapisti esistenti
  const testCheckExistingPhysiotherapists = async () => {
    setLoading(true)
    addLog('🔍 Checking existing physiotherapists...')
    
    try {
      const supabase = createClient()
      const { data: fisioterapisti, error } = await supabase
        .from('fisioterapisti')
        .select('id, numero_albo, profilo:profili(nome, cognome)')
        .limit(10)
      
      if (error) {
        addLog(`❌ Query error: ${error.message}`, 'error')
        return
      }
      
      if (fisioterapisti && fisioterapisti.length > 0) {
        addLog(`✅ Found ${fisioterapisti.length} physiotherapists:`, 'success')
        fisioterapisti.forEach((fisio: any) => {
          addLog(`   - ${fisio.profilo?.nome} ${fisio.profilo?.cognome} (${fisio.numero_albo}) - ID: ${fisio.id}`, 'info')
        })
        
        // Controlla se esiste TEST001
        const test001 = fisioterapisti.find((f: any) => f.numero_albo === 'TEST001')
        if (test001) {
          addLog(`✅ TEST001 found! Using ID: ${test001.id}`, 'success')
        } else {
          addLog('⚠️ TEST001 not found among existing physiotherapists', 'error')
        }
      } else {
        addLog('❌ No physiotherapists found in database', 'error')
      }
    } catch (err) {
      addLog(`❌ Check error: ${err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const runPatientTests = async () => {
    clearLogs()
    addLog('🏥 Starting patient-specific tests...')
    
    await testSupabaseConnection()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Controlla fisioterapisti esistenti prima di procedere
    await testCheckExistingPhysiotherapists()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testRegistrazionePaziente()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testLoginPaziente()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testStampaCredenziali()
    
    addLog('🏁 Patient tests completed!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              🧪 Physio Portal - Auth Debug Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Questa pagina serve per testare e debuggare il sistema di autenticazione.
                Usa i pulsanti qui sotto per testare ogni componente individualmente.
              </AlertDescription>
            </Alert>

            {/* Test Data Configuration */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">👨‍⚕️ Fisioterapista Test Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Test</Label>
                    <Input
                      id="email"
                      value={testData.email}
                      onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password Test</Label>
                    <Input
                      id="password"
                      value={testData.password}
                      onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">🏠 Paziente Test Data (CF System)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paziente-nome">Nome Paziente</Label>
                    <Input
                      id="paziente-nome"
                      value={pazienteData.nome}
                      onChange={(e) => setPazienteData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paziente-cognome">Cognome Paziente</Label>
                    <Input
                      id="paziente-cognome"
                      value={pazienteData.cognome}
                      onChange={(e) => setPazienteData(prev => ({ ...prev, cognome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paziente-cf">Codice Fiscale</Label>
                    <Input
                      id="paziente-cf"
                      value={pazienteData.codice_fiscale}
                      onChange={(e) => {
                        const cf = e.target.value.toUpperCase()
                        setPazienteData(prev => ({ ...prev, codice_fiscale: cf }))
                        // Aggiorna automaticamente la password di login
                        if (cf.length >= 16) {
                          try {
                            const password = cf.substring(0, 5).toLowerCase() + cf.substring(6, 9)
                            setLoginPazienteData(prev => ({ 
                              ...prev, 
                              codice_fiscale: cf,
                              password: password
                            }))
                          } catch (e) {
                            // CF non completo, mantieni password vuota
                          }
                        }
                      }}
                      placeholder="VRDGPP85D15H501A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paziente-nascita">Data Nascita</Label>
                    <Input
                      id="paziente-nascita"
                      type="date"
                      value={pazienteData.data_nascita}
                      onChange={(e) => setPazienteData(prev => ({ ...prev, data_nascita: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <strong>Login automatico:</strong> CF: {loginPazienteData.codice_fiscale} | Password: {loginPazienteData.password} (8+ caratteri per Supabase)
                </div>
              </div>
            </div>

            {/* Test Buttons - Fisioterapisti */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">🏥 Test Fisioterapisti</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button onClick={testSupabaseConnection} disabled={loading} variant="outline">
                  🔗 Test Connection
                </Button>
                <Button onClick={testDatabaseTables} disabled={loading} variant="outline">
                  🗄️ Test Tables
                </Button>
                <Button onClick={testRegistrazioneFisioterapista} disabled={loading} variant="outline">
                  📝 Test Registration
                </Button>
                <Button onClick={testLogin} disabled={loading} variant="outline">
                  🔐 Test Login
                </Button>
                <Button onClick={testGetCurrentUser} disabled={loading} variant="outline">
                  👤 Test Get User
                </Button>
                <Button onClick={testLogout} disabled={loading} variant="outline">
                  🚪 Test Logout
                </Button>
              </div>
            </div>

            {/* Test Buttons - Pazienti */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">🏠 Test Pazienti (CF System)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button onClick={testCheckExistingPhysiotherapists} disabled={loading} variant="outline">
                  🔍 Check Physios
                </Button>
                <Button onClick={testRegistrazionePaziente} disabled={loading} variant="outline">
                  🏥 Register Patient
                </Button>
                <Button onClick={testLoginPaziente} disabled={loading} variant="outline">
                  🔐 Patient CF Login
                </Button>
                <Button onClick={testStampaCredenziali} disabled={loading} variant="outline">
                  🖨️ Print Credentials
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={runAllTests} disabled={loading} className="flex-1">
                {loading ? '⏳ Running Tests...' : '🚀 Run Physio Tests'}
              </Button>
              <Button onClick={runPatientTests} disabled={loading} className="flex-1">
                {loading ? '⏳ Running Tests...' : '🏠 Run Patient Tests'}
              </Button>
              <Button onClick={clearLogs} variant="outline">
                🧹 Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Run a test to see results...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}