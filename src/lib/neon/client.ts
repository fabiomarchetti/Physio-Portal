import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL non definita nelle variabili d\'ambiente')
}

// Client SQL per query dirette
export const sql = neon(process.env.DATABASE_URL)

// Helper per eseguire query con gestione errori
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  try {
    const result = await sql(query, params)
    return result as T
  } catch (error) {
    console.error('Errore query database:', error)
    throw error
  }
}

// Helper per query con parametri named
export async function query<T = any>(
  queryTemplate: string,
  params?: Record<string, any>
): Promise<T> {
  try {
    // Converti parametri named in array ordinato
    const paramValues: any[] = []
    let paramIndex = 1

    const processedQuery = queryTemplate.replace(
      /\$\{(\w+)\}/g,
      (match, paramName) => {
        if (params && paramName in params) {
          paramValues.push(params[paramName])
          return `$${paramIndex++}`
        }
        return match
      }
    )

    const result = await sql(processedQuery, paramValues)
    return result as T
  } catch (error) {
    console.error('Errore query database:', error)
    throw error
  }
}
