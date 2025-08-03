'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import PatientView from '@/components/session/PatientView'
import TherapistView from '@/components/session/TherapistView'

function SessionContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.id as string
  const mode = searchParams.get('mode') || 'therapist'

  // Vista paziente: fullscreen, semplice, mirror
  if (mode === 'patient') {
    return <PatientView sessionId={sessionId} />
  }

  // Vista fisioterapista: split-screen con controlli
  return <TherapistView sessionId={sessionId} />
}

export default function SessionePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Caricamento sessione...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  )
}