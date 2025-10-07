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
import { ArrowLeft, Save, Image as ImageIcon, FileText } from 'lucide-react'
import { LandmarkSelector, EsercizioPerDatabase } from '@/components/computer-vision/LandmarkSelector'

export default function ConfiguraEsercizioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState('dettagli')
  const [formData, setFormData] = useState({
    id_categoria: searchParams.get('categoria') || '',
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

  // Recupera dati temporanei da localStorage al caricamento
  useEffect(() => {
    const tempFormData = localStorage.getItem('temp_esercizio_form')
    const tempPazienteId = localStorage.getItem('temp_paziente_id')

    console.log('🔧 Pagina configurazione - localStorage:', {
      tempFormData: !!tempFormData,
      tempPazienteId
    })

    if (tempFormData) {
      try {
        const parsedData = JSON.parse(tempFormData)
        console.log('📝 Form data recuperato:', parsedData)
        setFormData(parsedData)
        localStorage.removeItem('temp_esercizio_form')
      } catch (error) {
        console.error('Errore nel recupero dati temporanei:', error)
      }
    }
  }, [])

  const handleSalvaLandmark = (landmarkData: EsercizioPerDatabase) => {
    console.log('Landmark configurati:', landmarkData)

    setFormData(prev => ({
      ...prev,
      parti_corpo_coinvolte: landmarkData.parti_corpo_coinvolte || [],
      configurazione_mediapipe: landmarkData.configurazione_mediapipe || null
    }))

    // Torna alla tab dettagli per mostrare i dati salvati
    setActiveTab('dettagli')
  }

  const handleSalva = () => {
    // Validazione base
    if (!formData.id_categoria || !formData.nome_esercizio.trim() || !formData.descrizione_esercizio.trim()) {
      alert('Categoria, nome e descrizione sono obbligatori')
      return
    }

    console.log('💾 Salvando esercizio:', formData)

    // Salva i dati in localStorage per passarli alla dashboard
    localStorage.setItem('nuovo_esercizio', JSON.stringify(formData))

    // Verifica che temp_paziente_id sia ancora presente
    const tempPazienteId = localStorage.getItem('temp_paziente_id')
    console.log('👤 ID Paziente in localStorage:', tempPazienteId)

    if (!tempPazienteId) {
      console.warn('⚠️ ATTENZIONE: temp_paziente_id non trovato in localStorage!')
    }

    // Torna alla dashboard
    console.log('🔙 Tornando alla dashboard...')
    router.push('/dashboard/fisioterapista')
  }

  const handleAnnulla = () => {
    router.push('/dashboard/fisioterapista')
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
            <h1 className="text-2xl font-bold text-gray-900">Configura Nuovo Esercizio</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAnnulla}>
              Annulla
            </Button>
            <Button onClick={handleSalva}>
              <Save className="h-4 w-4 mr-2" />
              Salva Esercizio
            </Button>
          </div>
        </div>

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
                    <Label htmlFor="nome">Nome Esercizio *</Label>
                    <Input
                      id="nome"
                      value={formData.nome_esercizio}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_esercizio: e.target.value }))}
                      placeholder="Es. Flessione spalla"
                    />
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

                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="rip">Ripetizioni per Sessione</Label>
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

                {/* Riepilogo Landmark */}
                {formData.parti_corpo_coinvolte.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Configurazione MediaPipe</h3>
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm mb-1">
                        <span className="font-medium">Parti del corpo:</span> {formData.parti_corpo_coinvolte.join(', ')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Landmark selezionati:</span>{' '}
                        {formData.configurazione_mediapipe?.landmarks_target?.length || 0} punti
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('landmark')}
                  >
                    Configura Punti Corpo →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Landmark MediaPipe */}
          <TabsContent value="landmark" className="h-[85vh]">
            <div className="h-full">
              <LandmarkSelector
                onSave={handleSalvaLandmark}
                onCancel={() => setActiveTab('dettagli')}
                landmarkType="pose"
                hideForm={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
