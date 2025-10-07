import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

/**
 * POST /api/sessioni/[id]/frames
 * Aggiunge un frame di movimento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autenticato' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params
    const body = await request.json()
    const { frameData, frameNumber } = body

    if (!frameData) {
      return NextResponse.json(
        { success: false, message: 'frameData richiesto' },
        { status: 400 }
      )
    }

    await sql`
      INSERT INTO dati_movimento (
        sessione_id,
        timestamp_rilevamento,
        punti_corpo,
        punti_mani,
        punti_pose,
        frame_numero,
        confidenza_rilevamento
      ) VALUES (
        ${sessionId},
        NOW(),
        ${{}}::jsonb,
        ${{}}::jsonb,
        ${JSON.stringify({
          landmarks: frameData.poseLandmarks,
          worldLandmarks: frameData.worldLandmarks
        })}::jsonb,
        ${frameNumber || null},
        ${frameData.confidence || null}
      )
    `

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Errore salvataggio frame:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sessioni/[id]/frames
 * Ottiene i frames di una sessione
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autenticato' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token non valido' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params

    const result = await sql`
      SELECT
        id,
        timestamp_rilevamento,
        punti_pose,
        frame_numero,
        confidenza_rilevamento
      FROM dati_movimento
      WHERE sessione_id = ${sessionId}
      ORDER BY frame_numero ASC
    `

    return NextResponse.json({
      success: true,
      frames: result
    })

  } catch (error) {
    console.error('Errore recupero frames:', error)
    return NextResponse.json(
      { success: false, message: 'Errore server' },
      { status: 500 }
    )
  }
}
