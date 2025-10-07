import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon/client'

export async function POST() {
  try {
    console.log('🔧 Fix funzione login_sviluppatore...')

    // Ricrea funzione con alias corretti per evitare ambiguità
    await sql`
      CREATE OR REPLACE FUNCTION login_sviluppatore(
        p_email VARCHAR,
        p_password VARCHAR
      )
      RETURNS TABLE (
        profilo_id UUID,
        sviluppatore_id UUID,
        nome VARCHAR,
        cognome VARCHAR,
        email VARCHAR,
        azienda VARCHAR,
        success BOOLEAN,
        message TEXT
      ) AS $$
      DECLARE
        v_profilo profili%ROWTYPE;
        v_sviluppatore sviluppatori%ROWTYPE;
      BEGIN
        -- Cerca profilo per email
        SELECT * INTO v_profilo
        FROM profili prof
        WHERE prof.email = p_email
          AND prof.ruolo = 'sviluppatore';

        IF NOT FOUND THEN
          RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
                              NULL::VARCHAR, NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
          RETURN;
        END IF;

        -- Verifica password
        IF NOT verifica_password(p_password, v_profilo.password_hash) THEN
          RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
                              NULL::VARCHAR, NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
          RETURN;
        END IF;

        -- Ottieni dati sviluppatore (usa alias nella subquery)
        SELECT * INTO v_sviluppatore
        FROM sviluppatori svil
        WHERE svil.profilo_id = v_profilo.id;

        RETURN QUERY SELECT
          v_profilo.id,
          v_sviluppatore.id,
          v_profilo.nome,
          v_profilo.cognome,
          v_profilo.email,
          v_sviluppatore.azienda,
          TRUE,
          'Login effettuato'::TEXT;
      END;
      $$ LANGUAGE plpgsql
    `

    console.log('✅ Funzione login_sviluppatore fixata')

    return NextResponse.json({
      success: true,
      message: 'Fix applicato con successo!',
    })
  } catch (error: any) {
    console.error('❌ Errore fix:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore durante il fix',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
