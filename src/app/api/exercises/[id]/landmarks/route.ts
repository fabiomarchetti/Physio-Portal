import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    
    const exerciseId = params.id
    const body = await request.json()
    const { landmark, landmark_config } = body
    
    // Aggiorna l'esercizio con i landmark configurati
    const { data, error } = await supabase
      .from('esercizi')
      .update({
        landmark: landmark,
        landmark_config: landmark_config,
        data_aggiornamento: new Date().toISOString()
      })
      .eq('id_esercizio', exerciseId)
      .select()
      .single()
    
    if (error) {
      console.error('Errore nell\'aggiornamento landmark:', error)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dei landmark' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Landmark aggiornati con successo',
      data
    })
    
  } catch (error) {
    console.error('Errore API aggiornamento landmark:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
