// src/app/sessione/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'

export default function SessionePage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sessione {sessionId}</h1>
      <p>Pagina della sessione in sviluppo...</p>
    </div>
  )
}