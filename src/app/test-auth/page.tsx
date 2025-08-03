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
    email: 'mario.rossi.test@gmail.com',
    password: 'Test123456!',
    nome: 'Mario',
    cognome: 'Rossi',
    numero_albo: 'TEST001'
  })

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

            {/* Test Buttons */}
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

            <div className="flex gap-3">
              <Button onClick={runAllTests} disabled={loading} className="flex-1">
                {loading ? '⏳ Running Tests...' : '🚀 Run All Tests'}
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