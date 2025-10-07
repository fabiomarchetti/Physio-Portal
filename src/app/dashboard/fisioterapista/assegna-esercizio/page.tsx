'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react'
import { LandmarkSelector, EsercizioPerDatabase } from '@/components/computer-vision/LandmarkSelector'

interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
}

interface PazienteData {
  id: string
  nome_paziente: string
  cognome_paziente: string
  codice_fiscale: string
}

export default function AssegnaEsercizioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pazienteId = searchParams.get('paziente_id')

  const [activeTab, setActiveTab] = useState('dettagli')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')
  const [paziente, setPaziente] = useState<PazienteData | null>(null)
  const [categorie, setCategorie] = useState<CategoriaEsercizio[]>([])

  const [formData, setFormData] = useState({
    id_categoria: '',
    nome_esercizio: '',
    descrizione_esercizio: '',
    istruzioni: '',
    data_inizio: '',
    data_fine: '',
    frequenza_settimanale: 3,
    durata_minuti_consigliata: 30,
    ripetizioni_per_sessione: 10,
    note_fisioterapista: '',
    obiettivi_specifici: '',
    parti_corpo_coinvolte: [] as string[],
    configurazione_mediapipe: null as any
  })

  // Carica dati paziente e categorie
  useEffect(() => {
    const caricaDati = async () => {
      if (!pazienteId) {
        setError('ID paziente mancante')
        setLoading(false)
        return
      }

      try {
        // Carica info paziente
        const resPaziente = await fetch(`/api/pazienti/${pazienteId}`, {
          credentials: 'include'
        })

        if (!resPaziente.ok) throw new Error('Errore caricamento paziente')

        const dataPaziente = await resPaziente.json()
        if (dataPaziente.success && dataPaziente.paziente) {
          setPaziente(dataPaziente.paziente)
        }

        // Carica categorie
        const resCategorie = await fetch('/api/esercizi', {
          credentials: 'include'
        })

        if (!resCategorie.ok) throw new Error('Errore caricamento categorie')

        const dataCategorie = await resCategorie.json()
        if (dataCategorie.success) {
          setCategorie(dataCategorie.categorie || [])
        }

      } catch (err) {
        console.error('Errore caricamento dati:', err)
        setError('Errore nel caricamento dei dati')
      } finally {
        setLoading(false)
      }
    }

    caricaDati()
  }, [pazienteId])

  const handleSalvaLandmark = (landmarkData: EsercizioPerDatabase) => {
    console.log('🎯 Landmark configurati dal selector:', landmarkData)

    // Aggiorna solo i dati MediaPipe, mantenendo gli altri campi del form
    setFormData(prev => {
      const nuoviDati = {
        ...prev,
        parti_corpo_coinvolte: landmarkData.parti_corpo_coinvolte || [],
        configurazione_mediapipe: landmarkData.configurazione_mediapipe || null
      }
      console.log('📝 FormData aggiornato:', nuoviDati)
      return nuoviDati
    })

    // Torna alla tab dettagli per mostrare i dati salvati
    setActiveTab('dettagli')
  }

  const handleSalvaEsercizio = async () => {
    // Validazione
    if (!formData.id_categoria || !formData.nome_esercizio.trim() || !formData.descrizione_esercizio.trim()) {
      setError('Categoria, nome e descrizione sono obbligatori')
      return
    }

    if (!pazienteId) {
      setError('ID paziente mancante')
      return
    }

    setSalvando(true)
    setError('')

    try {
      console.log('💾 Salvando esercizio per paziente:', pazienteId)
      console.log('📦 Dati esercizio completi:', formData)
      console.log('🎯 Parti corpo:', formData.parti_corpo_coinvolte)
      console.log('⚙️ Config MediaPipe:', formData.configurazione_mediapipe)

      // Chiama API per creare e assegnare esercizio
      const response = await fetch('/api/esercizi/create-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paziente_id: pazienteId,
          esercizi: [formData] // Array con un solo esercizio
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Esercizio salvato e assegnato con successo')

        // Torna alla dashboard
        router.push('/dashboard/fisioterapista')
      } else {
        setError(data.message || 'Errore nel salvataggio dell\'esercizio')
      }

    } catch (err) {
      console.error('❌ Errore salvataggio esercizio:', err)
      setError('Errore nel salvataggio dell\'esercizio')
    } finally {
      setSalvando(false)
    }
  }

  const handleAnnulla = () => {
    router.push('/dashboard/fisioterapista')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAnnulla}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna Indietro
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assegna Nuovo Esercizio</h1>
              {paziente && (
                <p className="text-sm text-gray-600 mt-1">
                  Paziente: <span className="font-medium">{paziente.nome_paziente} {paziente.cognome_paziente}</span> - CF: {paziente.codice_fiscale}
                </p>
              )}
            </div>
          </div>

          <Button variant="outline" onClick={handleAnnulla}>
            Annulla
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="dettagli" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dettagli Esercizio
            </TabsTrigger>
            <TabsTrigger value="landmark" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Punti Corpo MediaPipe
              {formData.configurazione_mediapipe && (
                <Badge variant="secondary" className="ml-2">✓</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dettagli Esercizio */}
          <TabsContent value="dettagli">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Esercizio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria Esercizio *</Label>
                    <select
                      id="categoria"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={formData.id_categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_categoria: e.target.value }))}
                    >
                      <option value="">-- Seleziona categoria --</option>
                      {categorie.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nome_categoria}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="freq">Frequenza (volte/settimana)</Label>
                    <Input
                      id="freq"
                      type="number"
                      min="1"
                      max="7"
                      value={formData.frequenza_settimanale}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequenza_settimanale: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome Esercizio *</Label>
                  <Input
                    id="nome"
                    value={formData.nome_esercizio}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_esercizio: e.target.value }))}
                    placeholder="Es. Flessione spalla"
                  />
                </div>

                <div>
                  <Label htmlFor="desc">Descrizione Esercizio *</Label>
                  <Textarea
                    id="desc"
                    value={formData.descrizione_esercizio}
                    onChange={(e) => setFormData(prev => ({ ...prev, descrizione_esercizio: e.target.value }))}
                    placeholder="Descrivi come eseguire l'esercizio"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="istr">Istruzioni Aggiuntive</Label>
                  <Textarea
                    id="istr"
                    value={formData.istruzioni}
                    onChange={(e) => setFormData(prev => ({ ...prev, istruzioni: e.target.value }))}
                    placeholder="Precauzioni, consigli..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="dur">Durata (minuti)</Label>
                    <Input
                      id="dur"
                      type="number"
                      min="5"
                      max="120"
                      value={formData.durata_minuti_consigliata}
                      onChange={(e) => setFormData(prev => ({ ...prev, durata_minuti_consigliata: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rip">Ripetizioni</Label>
                    <Input
                      id="rip"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.ripetizioni_per_sessione}
                      onChange={(e) => setFormData(prev => ({ ...prev, ripetizioni_per_sessione: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_i">Data Inizio</Label>
                    <Input
                      id="data_i"
                      type="date"
                      value={formData.data_inizio}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_inizio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_f">Data Fine</Label>
                    <Input
                      id="data_f"
                      type="date"
                      value={formData.data_fine}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_fine: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="obi">Obiettivi Specifici</Label>
                  <Textarea
                    id="obi"
                    value={formData.obiettivi_specifici}
                    onChange={(e) => setFormData(prev => ({ ...prev, obiettivi_specifici: e.target.value }))}
                    placeholder="Obiettivi per questo paziente"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="note">Note per il Paziente</Label>
                  <Textarea
                    id="note"
                    value={formData.note_fisioterapista}
                    onChange={(e) => setFormData(prev => ({ ...prev, note_fisioterapista: e.target.value }))}
                    placeholder="Istruzioni aggiuntive"
                    rows={2}
                  />
                </div>

                {/* Indicatore MediaPipe in tempo reale */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    Configurazione MediaPipe
                    {formData.parti_corpo_coinvolte.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.configurazione_mediapipe?.landmarks_target?.length || 0} punti selezionati
                      </Badge>
                    )}
                  </h3>

                  {formData.parti_corpo_coinvolte.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-3">
                      {/* Landmark numerici */}
                      <div>
                        <p className="text-xs font-medium text-green-900 mb-2">LANDMARK SELEZIONATI:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.configurazione_mediapipe?.landmarks_target?.map((landmarkId: number) => (
                            <span
                              key={landmarkId}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold text-sm shadow-sm"
                            >
                              {landmarkId}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Parti del corpo */}
                      <div>
                        <p className="text-xs font-medium text-green-900 mb-2">PARTI DEL CORPO:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.parti_corpo_coinvolte.map((parte, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-white border-green-300 text-green-800 px-3 py-1"
                            >
                              {parte}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Tipo esercizio */}
                      {formData.configurazione_mediapipe?.tipo_esercizio && (
                        <div>
                          <p className="text-xs font-medium text-green-900 mb-2">TIPO MISURAZIONE:</p>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {formData.configurazione_mediapipe.tipo_esercizio === 'angle' && '📐 Misura Angoli'}
                            {formData.configurazione_mediapipe.tipo_esercizio === 'distance' && '📏 Misura Distanze'}
                            {formData.configurazione_mediapipe.tipo_esercizio === 'movement' && '🏃 Movimento'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-blue-800 mb-2">
                        ℹ️ Nessun punto MediaPipe selezionato
                      </p>
                      <p className="text-xs text-blue-600">
                        Vai al tab "Punti Corpo MediaPipe" per selezionare i landmark da monitorare
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('landmark')}
                  >
                    Vai a Configurazione MediaPipe →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Landmark MediaPipe */}
          <TabsContent value="landmark" className="h-[85vh]">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Configurazione Punti Corpo MediaPipe</CardTitle>
                <p className="text-sm text-gray-600">
                  Seleziona i punti del corpo da monitorare durante l'esercizio
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-2">
                <div className="flex-1 overflow-hidden">
                  <LandmarkSelector
                    onSave={handleSalvaLandmark}
                    onChange={(data) => {
                      console.log('🔄 Aggiornamento in tempo reale landmark:', data)
                      setFormData(prev => ({
                        ...prev,
                        parti_corpo_coinvolte: data.parti_corpo_coinvolte,
                        configurazione_mediapipe: data.configurazione_mediapipe
                      }))
                    }}
                    onCancel={() => setActiveTab('dettagli')}
                    landmarkType="pose"
                    hideForm={true}
                  />
                </div>

                {/* Pulsante Salva fisso in basso */}
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAnnulla}
                    disabled={salvando}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSalvaEsercizio}
                    disabled={salvando || !formData.nome_esercizio.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {salvando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva ed Assegna Esercizio
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
