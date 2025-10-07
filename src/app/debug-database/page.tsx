'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TableInfo {
  name: string
  count: number
  error?: string
  sampleData?: any
  structure?: Record<string, any>
}

export default function DatabaseDebugPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const knownTables = [
    'profili',
    'fisioterapisti', 
    'pazienti',
    'categorie_esercizi',
    'esercizi',
    'tipi_esercizio',
    'sessioni_riabilitazione',
    'dati_movimento',
    'obiettivi_terapeutici',
    'configurazioni_sistema'
  ]

  const analyzeDatabase = async () => {
    setLoading(true)
    setTables([])
    
    const supabase = createClient()
    const results: TableInfo[] = []

    console.log('🔍 INIZIO ANALISI DATABASE SUPABASE')
    console.log('===================================')

    for (const tableName of knownTables) {
      console.log(`\n📊 Analizzando: ${tableName}`)
      
      try {
        // Conta i record
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${tableName}:`, error.message)
          results.push({
            name: tableName,
            count: 0,
            error: error.message
          })
          continue
        }

        console.log(`✅ ${tableName}: ${count} record`)

        // Ottieni un record di esempio
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        let structure = {}
        if (sampleData && sampleData.length > 0) {
          const sample = sampleData[0]
          structure = Object.keys(sample).reduce((acc, key) => {
            const value = sample[key]
            acc[key] = {
              type: typeof value,
              isNull: value === null,
              example: value === null ? null : JSON.stringify(value).substring(0, 100)
            }
            return acc
          }, {} as Record<string, any>)
          
          console.log(`   Campi trovati: ${Object.keys(sample).join(', ')}`)
        }

        results.push({
          name: tableName,
          count: count || 0,
          sampleData: sampleData?.[0],
          structure
        })

      } catch (err) {
        console.log(`❌ Errore ${tableName}:`, err)
        results.push({
          name: tableName,
          count: 0,
          error: err instanceof Error ? err.message : 'Errore sconosciuto'
        })
      }
    }

    // Test specifici per esercizi
    console.log('\n🧪 TEST SPECIFICI:')
    await testExerciseTables(supabase)

    setTables(results)
    setAnalysisComplete(true)
    setLoading(false)
  }

  const testExerciseTables = async (supabase: any) => {
    console.log('🔍 Confronto tabelle esercizi vs tipi_esercizio:')
    
    // Test esercizi
    try {
      const { data: eserciziData, error: eserciziError, count: eserciziCount } = await supabase
        .from('esercizi')
        .select('*', { count: 'exact' })
      
      console.log(`   esercizi: ${eserciziError ? '❌ ' + eserciziError.message : `✅ ${eserciziCount} record`}`)
      
      if (!eserciziError && eserciziData && eserciziData.length > 0) {
        console.log('   Struttura esercizi:', Object.keys(eserciziData[0]))
      }
    } catch (err) {
      console.log('   esercizi: ❌ Tabella non esiste')
    }

    // Test tipi_esercizio
    try {
      const { data: tipiData, error: tipiError, count: tipiCount } = await supabase
        .from('tipi_esercizio')
        .select('*', { count: 'exact' })
      
      console.log(`   tipi_esercizio: ${tipiError ? '❌ ' + tipiError.message : `✅ ${tipiCount} record`}`)
      
      if (!tipiError && tipiData && tipiData.length > 0) {
        console.log('   Struttura tipi_esercizio:', Object.keys(tipiData[0]))
      }
    } catch (err) {
      console.log('   tipi_esercizio: ❌ Tabella non esiste')
    }

    // Test relazione categorie -> tipi_esercizio
    try {
      const { data: relData, error: relError } = await supabase
        .from('categorie_esercizi')
        .select(`
          id,
          nome_categoria,
          tipi_esercizio(id, nome_esercizio)
        `)
      
      if (!relError) {
        console.log(`   Relazione categorie->tipi_esercizio: ✅ Funziona`)
        relData?.forEach((cat: any) => {
          console.log(`     ${cat.nome_categoria}: ${cat.tipi_esercizio?.length || 0} esercizi`)
        })
      } else {
        console.log(`   Relazione: ❌ ${relError.message}`)
      }
    } catch (err) {
      console.log('   Relazione: ❌ Errore nella query')
    }
  }

  const exportToConsole = () => {
    console.log('\n📋 ESPORTAZIONE COMPLETA ANALISI DATABASE:')
    console.log('==========================================')
    console.log(JSON.stringify(tables, null, 2))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 Analisi Database Supabase
          </h1>
          <p className="text-gray-600 mb-6">
            Strumento per analizzare tutte le tabelle nel database e identificare problemi di struttura.
          </p>
          
          <div className="flex gap-4">
            <Button 
              onClick={analyzeDatabase} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Analizzando...' : 'Avvia Analisi Database'}
            </Button>
            
            {analysisComplete && (
              <Button 
                onClick={exportToConsole} 
                variant="outline"
              >
                Esporta in Console
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analizzando database...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card key={table.name} className={`${table.error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">
                    {table.error ? '❌' : '✅'} {table.name}
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
                    {table.structure && Object.keys(table.structure).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Struttura:</h4>
                        <div className="space-y-1 text-xs">
                          {Object.entries(table.structure).map(([field, info]: [string, any]) => (
                            <div key={field} className="flex justify-between">
                              <span className="font-mono text-blue-600">{field}</span>
                              <span className="text-gray-500">
                                {info.isNull ? 'null' : info.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {table.sampleData && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Esempio dati:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
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

        {analysisComplete && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📊 Riepilogo Analisi
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-green-700">Tabelle Esistenti</div>
                <div className="text-2xl text-green-600">
                  {tables.filter(t => !t.error).length}
                </div>
              </div>
              <div>
                <div className="font-semibold text-red-700">Tabelle con Errori</div>
                <div className="text-2xl text-red-600">
                  {tables.filter(t => t.error).length}
                </div>
              </div>
              <div>
                <div className="font-semibold text-blue-700">Record Totali</div>
                <div className="text-2xl text-blue-600">
                  {tables.reduce((sum, t) => sum + t.count, 0)}
                </div>
              </div>
              <div>
                <div className="font-semibold text-purple-700">Tabelle Vuote</div>
                <div className="text-2xl text-purple-600">
                  {tables.filter(t => !t.error && t.count === 0).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
