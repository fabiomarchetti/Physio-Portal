import { supabase } from './client'
import { Database } from '@/types/database'

export class DatabaseQueries {
  // Query per fisioterapisti
  static async getPazientiDelFisioterapista(fisioterapistaId: string) {
    const { data, error } = await supabase
      .from('pazienti')
      .select(`
        *,
        profilo:profili(*)
      `)
      .eq('fisioterapista_id', fisioterapistaId)
      .eq('attivo', true)

    return { data, error }
  }

  // Query per pazienti
  static async getSessioniDelPaziente(pazienteId: string) {
    const { data, error } = await supabase
      .from('sessioni_riabilitazione')
      .select(`
        *,
        metriche:metriche_sessione(*)
      `)
      .eq('paziente_id', pazienteId)
      .order('data_inizio', { ascending: false })

    return { data, error }
  }

  // Query per sessioni
  static async getDatiMovimentoSessione(sessioneId: string) {
    const { data, error } = await supabase
      .from('dati_movimento')
      .select('*')
      .eq('sessione_id', sessioneId)
      .order('timestamp_rilevamento')

    return { data, error }
  }

  // Query per metriche
  static async getMetrichePerTipo(sessioneId: string, tipoMetrica: string) {
    const { data, error } = await supabase
      .from('metriche_sessione')
      .select('*')
      .eq('sessione_id', sessioneId)
      .eq('tipo_metrica', tipoMetrica)
      .order('timestamp_calcolo')

    return { data, error }
  }

  // Salva dati movimento in tempo reale
  static async salvaDatiMovimento(
    sessioneId: string,
    puntiCorpo: Record<string, unknown>,
    puntiMani: Record<string, unknown>,
    puntiPose: Record<string, unknown>,
    frameNumero: number,
    confidenza: number
  ) {
    const { data, error } = await supabase
      .from('dati_movimento')
      .insert({
        sessione_id: sessioneId,
        timestamp_rilevamento: new Date().toISOString(),
        punti_corpo: puntiCorpo,
        punti_mani: puntiMani,
        punti_pose: puntiPose,
        frame_numero: frameNumero,
        confidenza_rilevamento: confidenza
      })

    return { data, error }
  }

  // Salva metriche calcolate
  static async salvaMetrica(
    sessioneId: string,
    tipoMetrica: string,
    valore: number,
    unitaMisura: string,
    articolazione?: string
  ) {
    const { data, error } = await supabase
      .from('metriche_sessione')
      .insert({
        sessione_id: sessioneId,
        tipo_metrica: tipoMetrica,
        valore_metrica: valore,
        unita_misura: unitaMisura,
        articolazione,
        timestamp_calcolo: new Date().toISOString()
      })

    return { data, error }
  }
}