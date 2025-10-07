'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

const POSE_LANDMARKS_DATA = [
  // Viso (0-10)
  { id: 0, nome: 'Naso', categoria: 'Viso', descrizione: 'Punta del naso' },
  { id: 1, nome: 'Occhio interno sinistro', categoria: 'Viso', descrizione: 'Angolo interno occhio sinistro' },
  { id: 2, nome: 'Occhio sinistro', categoria: 'Viso', descrizione: 'Centro occhio sinistro' },
  { id: 3, nome: 'Occhio esterno sinistro', categoria: 'Viso', descrizione: 'Angolo esterno occhio sinistro' },
  { id: 4, nome: 'Occhio interno destro', categoria: 'Viso', descrizione: 'Angolo interno occhio destro' },
  { id: 5, nome: 'Occhio destro', categoria: 'Viso', descrizione: 'Centro occhio destro' },
  { id: 6, nome: 'Occhio esterno destro', categoria: 'Viso', descrizione: 'Angolo esterno occhio destro' },
  { id: 7, nome: 'Orecchio sinistro', categoria: 'Viso', descrizione: 'Orecchio sinistro' },
  { id: 8, nome: 'Orecchio destro', categoria: 'Viso', descrizione: 'Orecchio destro' },
  { id: 9, nome: 'Bocca sinistra', categoria: 'Viso', descrizione: 'Angolo sinistro della bocca' },
  { id: 10, nome: 'Bocca destra', categoria: 'Viso', descrizione: 'Angolo destro della bocca' },

  // Spalle (11-12)
  { id: 11, nome: 'Spalla sinistra', categoria: 'Spalle', descrizione: 'Articolazione spalla sinistra' },
  { id: 12, nome: 'Spalla destra', categoria: 'Spalle', descrizione: 'Articolazione spalla destra' },

  // Braccia (13-16)
  { id: 13, nome: 'Gomito sinistro', categoria: 'Braccia', descrizione: 'Articolazione gomito sinistro' },
  { id: 14, nome: 'Gomito destro', categoria: 'Braccia', descrizione: 'Articolazione gomito destro' },
  { id: 15, nome: 'Polso sinistro', categoria: 'Braccia', descrizione: 'Articolazione polso sinistro' },
  { id: 16, nome: 'Polso destro', categoria: 'Braccia', descrizione: 'Articolazione polso destro' },

  // Dita mano (17-22)
  { id: 17, nome: 'Mignolo sinistro', categoria: 'Mani', descrizione: 'Punta mignolo sinistro' },
  { id: 18, nome: 'Mignolo destro', categoria: 'Mani', descrizione: 'Punta mignolo destro' },
  { id: 19, nome: 'Indice sinistro', categoria: 'Mani', descrizione: 'Punta indice sinistro' },
  { id: 20, nome: 'Indice destro', categoria: 'Mani', descrizione: 'Punta indice destro' },
  { id: 21, nome: 'Pollice sinistro', categoria: 'Mani', descrizione: 'Punta pollice sinistro' },
  { id: 22, nome: 'Pollice destro', categoria: 'Mani', descrizione: 'Punta pollice destro' },

  // Anche (23-24)
  { id: 23, nome: 'Anca sinistra', categoria: 'Bacino', descrizione: 'Articolazione anca sinistra' },
  { id: 24, nome: 'Anca destra', categoria: 'Bacino', descrizione: 'Articolazione anca destra' },

  // Gambe (25-28)
  { id: 25, nome: 'Ginocchio sinistro', categoria: 'Gambe', descrizione: 'Articolazione ginocchio sinistro' },
  { id: 26, nome: 'Ginocchio destro', categoria: 'Gambe', descrizione: 'Articolazione ginocchio destro' },
  { id: 27, nome: 'Caviglia sinistra', categoria: 'Gambe', descrizione: 'Articolazione caviglia sinistra' },
  { id: 28, nome: 'Caviglia destra', categoria: 'Gambe', descrizione: 'Articolazione caviglia destra' },

  // Piedi (29-32)
  { id: 29, nome: 'Tallone sinistro', categoria: 'Piedi', descrizione: 'Tallone piede sinistro' },
  { id: 30, nome: 'Tallone destro', categoria: 'Piedi', descrizione: 'Tallone piede destro' },
  { id: 31, nome: 'Alluce sinistro', categoria: 'Piedi', descrizione: 'Punta alluce sinistro' },
  { id: 32, nome: 'Alluce destro', categoria: 'Piedi', descrizione: 'Punta alluce destro' }
]

const HAND_LANDMARKS_DATA = [
  { id: 0, nome: 'Polso', categoria: 'Base', descrizione: 'Base del polso' },
  { id: 1, nome: 'Pollice CMC', categoria: 'Pollice', descrizione: 'Carpo-metacarpale pollice' },
  { id: 2, nome: 'Pollice MCP', categoria: 'Pollice', descrizione: 'Metacarpo-falangea pollice' },
  { id: 3, nome: 'Pollice IP', categoria: 'Pollice', descrizione: 'Interfalangea pollice' },
  { id: 4, nome: 'Pollice Punta', categoria: 'Pollice', descrizione: 'Punta del pollice' },
  { id: 5, nome: 'Indice MCP', categoria: 'Indice', descrizione: 'Metacarpo-falangea indice' },
  { id: 6, nome: 'Indice PIP', categoria: 'Indice', descrizione: 'Interfalangea prossimale indice' },
  { id: 7, nome: 'Indice DIP', categoria: 'Indice', descrizione: 'Interfalangea distale indice' },
  { id: 8, nome: 'Indice Punta', categoria: 'Indice', descrizione: 'Punta dell\'indice' },
  { id: 9, nome: 'Medio MCP', categoria: 'Medio', descrizione: 'Metacarpo-falangea medio' },
  { id: 10, nome: 'Medio PIP', categoria: 'Medio', descrizione: 'Interfalangea prossimale medio' },
  { id: 11, nome: 'Medio DIP', categoria: 'Medio', descrizione: 'Interfalangea distale medio' },
  { id: 12, nome: 'Medio Punta', categoria: 'Medio', descrizione: 'Punta del medio' },
  { id: 13, nome: 'Anulare MCP', categoria: 'Anulare', descrizione: 'Metacarpo-falangea anulare' },
  { id: 14, nome: 'Anulare PIP', categoria: 'Anulare', descrizione: 'Interfalangea prossimale anulare' },
  { id: 15, nome: 'Anulare DIP', categoria: 'Anulare', descrizione: 'Interfalangea distale anulare' },
  { id: 16, nome: 'Anulare Punta', categoria: 'Anulare', descrizione: 'Punta dell\'anulare' },
  { id: 17, nome: 'Mignolo MCP', categoria: 'Mignolo', descrizione: 'Metacarpo-falangea mignolo' },
  { id: 18, nome: 'Mignolo PIP', categoria: 'Mignolo', descrizione: 'Interfalangea prossimale mignolo' },
  { id: 19, nome: 'Mignolo DIP', categoria: 'Mignolo', descrizione: 'Interfalangea distale mignolo' },
  { id: 20, nome: 'Mignolo Punta', categoria: 'Mignolo', descrizione: 'Punta del mignolo' }
]

const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    'Viso': 'bg-purple-100 text-purple-800 border-purple-300',
    'Spalle': 'bg-blue-100 text-blue-800 border-blue-300',
    'Braccia': 'bg-green-100 text-green-800 border-green-300',
    'Mani': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Bacino': 'bg-red-100 text-red-800 border-red-300',
    'Gambe': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Piedi': 'bg-pink-100 text-pink-800 border-pink-300',
    'Pollice': 'bg-orange-100 text-orange-800 border-orange-300',
    'Indice': 'bg-teal-100 text-teal-800 border-teal-300',
    'Medio': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Anulare': 'bg-lime-100 text-lime-800 border-lime-300',
    'Mignolo': 'bg-amber-100 text-amber-800 border-amber-300',
    'Base': 'bg-gray-100 text-gray-800 border-gray-300'
  }
  return colors[categoria] || 'bg-gray-100 text-gray-800 border-gray-300'
}

export default function LandmarkReferencePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'pose' | 'hand'>('pose')

  const currentData = selectedType === 'pose' ? POSE_LANDMARKS_DATA : HAND_LANDMARKS_DATA

  const filteredData = currentData.filter(landmark =>
    landmark.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landmark.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landmark.id.toString().includes(searchTerm)
  )

  const groupedByCategory = filteredData.reduce((acc, landmark) => {
    if (!acc[landmark.categoria]) {
      acc[landmark.categoria] = []
    }
    acc[landmark.categoria].push(landmark)
    return acc
  }, {} as Record<string, typeof filteredData>)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Riferimento Landmark MediaPipe</h1>
              <p className="text-sm text-gray-600 mt-1">
                Guida completa ai punti di rilevamento del corpo e della mano
              </p>
            </div>
          </div>
        </div>

        {/* Selector tipo */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={selectedType === 'pose' ? 'default' : 'outline'}
            onClick={() => setSelectedType('pose')}
          >
            🧍 Corpo (33 punti)
          </Button>
          <Button
            variant={selectedType === 'hand' ? 'default' : 'outline'}
            onClick={() => setSelectedType('hand')}
          >
            ✋ Mano (21 punti)
          </Button>
        </div>

        {/* Immagini di riferimento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📐 Diagrammi di Riferimento MediaPipe</CardTitle>
            <CardDescription>
              Visualizzazione dei punti di rilevamento su corpo e mano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Immagine Corpo */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Corpo (33 punti)</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 w-full flex justify-center">
                  <img
                    src="/img/corpo.png"
                    alt="Riferimento landmark corpo MediaPipe"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '500px' }}
                  />
                </div>
              </div>

              {/* Immagine Mano */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Mano (21 punti)</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 w-full flex justify-center">
                  <img
                    src="/img/mano.png"
                    alt="Riferimento landmark mano MediaPipe"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '500px' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per ID, nome o categoria (es. 11, spalla, braccia...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Come usare questa guida</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <ul className="list-disc list-inside space-y-1">
              <li>Ogni landmark ha un <strong>ID numerico</strong> (0-32 per corpo, 0-20 per mano)</li>
              <li>I nomi sono quelli che vengono salvati nel database quando crei un esercizio</li>
              <li>Usa la ricerca per trovare rapidamente un punto specifico</li>
              <li>I colori delle categorie corrispondono alle aree anatomiche</li>
            </ul>
          </CardContent>
        </Card>

        {/* Landmark tables by category */}
        <div className="space-y-4">
          {Object.entries(groupedByCategory).map(([categoria, landmarks]) => (
            <Card key={categoria}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getCategoriaColor(categoria)}`}>
                    {categoria}
                  </span>
                  <span className="text-sm font-normal text-gray-500">({landmarks.length} punti)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-semibold text-gray-700">ID</th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700">Nome Landmark</th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700">Descrizione</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landmarks.map((landmark) => (
                        <tr key={landmark.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-mono font-bold text-gray-700">
                              {landmark.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{landmark.nome}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{landmark.descrizione}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 text-center">
              <p className="text-yellow-800">
                Nessun landmark trovato per "<strong>{searchTerm}</strong>"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle>📊 Riepilogo</CardTitle>
            <CardDescription>
              {selectedType === 'pose'
                ? 'MediaPipe Pose rileva 33 landmark del corpo per tracciare postura e movimento'
                : 'MediaPipe Hands rileva 21 landmark della mano per tracciare gesti e articolazioni'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            <p className="mb-2"><strong>Visualizzati:</strong> {filteredData.length} landmark</p>
            <p><strong>Categorie:</strong> {Object.keys(groupedByCategory).join(', ')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
