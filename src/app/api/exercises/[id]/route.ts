import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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
    
    // Carica l'esercizio con la categoria
    const { data: exercise, error } = await supabase
      .from('esercizi')
      .select(`
        *,
        categoria: categorie_esercizi (
          id,
          nome_categoria
        )
      `)
      .eq('id_esercizio', exerciseId)
      .single()
    
    if (error) {
      console.error('Errore nel caricamento esercizio:', error)
      return NextResponse.json({ error: 'Esercizio non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(exercise)
    
  } catch (error) {
    console.error('Errore API esercizio:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
