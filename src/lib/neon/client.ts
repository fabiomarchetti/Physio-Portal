import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL non definita nelle variabili d\'ambiente')
}

// Client SQL per query dirette
export const sql = neon(process.env.DATABASE_URL)

// Helper per eseguire query con gestione errori (legacy - non più necessario)
// Nota: Preferire l'uso diretto di sql`...` con template tags
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  console.warn('executeQuery è deprecato. Usare sql`...` template tags invece.')
  try {
    // Per query dinamiche con nomi di tabelle validati, usare sql.unsafe()
    throw new Error('executeQuery non supportato. Usare sql`...` template tags o sql.unsafe() per identificatori dinamici.')
  } catch (error) {
    console.error('Errore query database:', error)
    throw error
  }
}
