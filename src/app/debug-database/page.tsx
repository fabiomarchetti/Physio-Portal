'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface TableStructure {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

interface TableInfo {
  name: string
  count: number
  exists: boolean
  error?: string
  structure?: TableStructure[]
  sampleData?: any
}

interface RelationInfo {
  name: string
  status: 'ok' | 'error'
  data?: any[]
  error?: string
}

interface AnalysisResult {
  success: boolean
  tables: TableInfo[]
  relations: RelationInfo[]
  summary: {
    totalTables: number
    existingTables: number
    tablesWithErrors: number
    totalRecords: number
    emptyTables: number
  }
  error?: string
}

export default function DatabaseDebugPage() {
  const router = useRouter()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyzeDatabase = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/debug-database', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Errore durante l\'analisi del database')
      }

      setResult(data)
      console.log('📊 ANALISI DATABASE COMPLETA:', data)

    } catch (err: any) {
      console.error('Errore analisi database:', err)
      setError(err.message || 'Errore durante l\'analisi del database')
    } finally {
      setLoading(false)
    }
  }

  const exportToConsole = () => {
    if (!result) return
    console.log('\n📋 ESPORTAZIONE COMPLETA ANALISI DATABASE:')
    console.log('==========================================')
    console.log(JSON.stringify(result, null, 2))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 Analisi Database Neon
          </h1>
          <p className="text-gray-600 mb-6">
            Strumento per analizzare tutte le tabelle nel database PostgreSQL e identificare problemi di struttura.
          </p>

          <div className="flex gap-4">
            <Button
              onClick={analyzeDatabase}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Analizzando...' : 'Avvia Analisi Database'}
            </Button>

            {result && (
              <Button
                onClick={exportToConsole}
                variant="outline"
              >
                Esporta in Console
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">❌ Errore</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Analizzando database...</p>
          </div>
        )}

        {result && (
          <>
            {/* Riepilogo */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                📊 Riepilogo Analisi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-gray-600">Tabelle Totali</div>
                  <div className="text-3xl font-bold text-blue-600">{result.summary.totalTables}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-gray-600">Tabelle Esistenti</div>
                  <div className="text-3xl font-bold text-green-600">{result.summary.existingTables}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-gray-600">Con Errori</div>
                  <div className="text-3xl font-bold text-red-600">{result.summary.tablesWithErrors}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-gray-600">Record Totali</div>
                  <div className="text-3xl font-bold text-indigo-600">{result.summary.totalRecords}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-gray-600">Tabelle Vuote</div>
                  <div className="text-3xl font-bold text-purple-600">{result.summary.emptyTables}</div>
                </div>
              </div>
            </div>

            {/* Tabelle */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Tabelle Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.tables.map((table) => (
                  <Card
                    key={table.name}
                    className={`${
                      table.error
                        ? 'border-red-300 bg-red-50'
                        : table.count === 0
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-base">
                          {table.error ? '❌' : table.count === 0 ? '⚠️' : '✅'} {table.name}
                        </span>
                        <span className="text-sm font-normal text-gray-600">
                          {table.error ? 'Errore' : `${table.count} record`}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      {table.error ? (
                        <div className="text-red-600 text-sm">
                          <strong>Errore:</strong> {table.error}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {table.structure && table.structure.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Struttura ({table.structure.length} colonne):
                              </h4>
                              <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                                {table.structure.map((field) => (
                                  <div key={field.name} className="flex justify-between items-start gap-2">
                                    <span className="font-mono text-blue-600 font-medium">
                                      {field.name}
                                    </span>
                                    <div className="text-right">
                                      <span className="text-gray-500 block">{field.type}</span>
                                      {field.nullable && (
                                        <span className="text-gray-400 text-xs">nullable</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {table.sampleData && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">Dati esempio:</h4>
                              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                                {JSON.stringify(table.sampleData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Relazioni */}
            {result.relations && result.relations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🔗 Relazioni tra Tabelle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.relations.map((relation, index) => (
                    <Card
                      key={index}
                      className={relation.status === 'ok' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {relation.status === 'ok' ? '✅' : '❌'} {relation.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relation.status === 'error' ? (
                          <div className="text-red-600 text-sm">
                            <strong>Errore:</strong> {relation.error}
                          </div>
                        ) : (
                          <div>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                              {JSON.stringify(relation.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
