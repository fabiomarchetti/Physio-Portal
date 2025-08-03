'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthSimplePage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  const testDirectSupabase = async () => {
    setLoading(true)
    setLogs([])
    addLog('🔍 Testing direct Supabase auth...')
    
    try {
      const supabase = createClient()
      
      // Test 1: Simple signup
      addLog(`📝 Attempting signup with email: ${email}`)
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for testing
        }
      })

      if (signupError) {
        addLog(`❌ Signup error: ${signupError.message}`)
        addLog(`Error code: ${signupError.status}`)
        addLog(`Full error: ${JSON.stringify(signupError)}`)
      } else {
        addLog(`✅ Signup successful!`)
        addLog(`User ID: ${signupData.user?.id}`)
        addLog(`Email confirmed: ${signupData.user?.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Test 2: Try login immediately
        addLog(`🔐 Attempting login...`)
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        })

        if (loginError) {
          addLog(`❌ Login error: ${loginError.message}`)
        } else {
          addLog(`✅ Login successful!`)
          addLog(`Session: ${loginData.session ? 'Active' : 'None'}`)
        }
      }

    } catch (err) {
      addLog(`❌ Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseConfig = async () => {
    setLoading(true)
    setLogs([])
    addLog('🔍 Testing Supabase configuration...')
    
    try {
      const supabase = createClient()
      
      // Test connection
      const { data, error } = await supabase.from('profili').select('count').limit(1)
      
      if (error) {
        addLog(`❌ Database connection error: ${error.message}`)
      } else {
        addLog(`✅ Database connection successful`)
      }

      // Check auth settings
      addLog(`📋 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
      addLog(`📋 Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
      
    } catch (err) {
      addLog(`❌ Config test error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Simple Supabase Auth Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Test Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Test Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={testSupabaseConfig} disabled={loading}>
                🔧 Test Config
              </Button>
              <Button onClick={testDirectSupabase} disabled={loading}>
                {loading ? '⏳ Testing...' : '🚀 Test Auth'}
              </Button>
              <Button onClick={() => setLogs([])} variant="outline">
                🧹 Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
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