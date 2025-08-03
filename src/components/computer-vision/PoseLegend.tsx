'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PoseLegendProps {
  isVisible?: boolean
  className?: string
}

export function PoseLegend({ isVisible = true, className = '' }: PoseLegendProps) {
  if (!isVisible) return null

  const bodyParts = [
    { name: 'Testa', color: 'rgb(255, 50, 50)', description: 'Naso' },
    { name: 'Torso', color: 'rgb(50, 255, 150)', description: 'Spalle, fianchi' },
    { name: 'Braccio Sinistro', color: 'rgb(50, 150, 255)', description: 'Spalla, gomito, polso' },
    { name: 'Braccio Destro', color: 'rgb(255, 50, 150)', description: 'Spalla, gomito, polso' },
    { name: 'Gamba Sinistra', color: 'rgb(255, 200, 50)', description: 'Anca, ginocchio, caviglia' },
    { name: 'Gamba Destra', color: 'rgb(150, 50, 255)', description: 'Anca, ginocchio, caviglia' }
  ]

  return (
    <Card className={`border-0 ${className}`} style={{ border: 'none !important', outline: 'none !important' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-purple-500"></div>
          Legenda Parti del Corpo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bodyParts.map((part, index) => (
          <div key={index} className="flex items-center gap-3 text-xs">
            <div 
              className="w-4 h-4 rounded-full shadow-lg border-2 border-white"
              style={{ 
                backgroundColor: part.color,
                boxShadow: `0 0 8px ${part.color}40`
              }}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{part.name}</div>
              <div className="text-gray-500 text-xs">{part.description}</div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-white rounded-full border border-gray-300"></div>
            <span>Punto centrale = alta confidenza</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            <div className="w-8 h-1 bg-white rounded border border-gray-300"></div>
            <span>Barra = livello di confidenza</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}