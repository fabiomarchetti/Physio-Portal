/**
 * Shim per compatibilità con vecchio codice Supabase
 * Ora usa API routes Neon invece di chiamate dirette al database
 */

export interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder
  auth: {
    getUser: () => Promise<{ data: { user: any } }>
  }
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder
  insert: (data: any) => SupabaseQueryBuilder
  update: (data: any) => SupabaseQueryBuilder
  delete: () => SupabaseQueryBuilder
  eq: (column: string, value: any) => SupabaseQueryBuilder
  single: () => Promise<{ data: any; error: any }>
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder
  _table?: string
  _select?: string
  _data?: any
  _where?: Array<{ column: string; value: any }>
  _order?: { column: string; ascending: boolean }
  _limit?: number
  _single?: boolean
}

class NeonQueryBuilder implements SupabaseQueryBuilder {
  _table?: string
  _select?: string = '*'
  _data?: any
  _where?: Array<{ column: string; value: any }> = []
  _order?: { column: string; ascending: boolean }
  _limit?: number
  _single?: boolean = false
  _isDelete?: boolean = false
  _isInsert?: boolean = false
  _isUpdate?: boolean = false

  constructor(table: string) {
    this._table = table
  }

  select(columns?: string): SupabaseQueryBuilder {
    this._select = columns || '*'
    return this
  }

  insert(data: any): SupabaseQueryBuilder {
    this._data = data
    this._isInsert = true
    return this
  }

  update(data: any): SupabaseQueryBuilder {
    this._data = data
    this._isUpdate = true
    return this
  }

  delete(): SupabaseQueryBuilder {
    this._isDelete = true
    return this
  }

  eq(column: string, value: any): SupabaseQueryBuilder {
    if (!this._where) this._where = []
    this._where.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder {
    this._order = { column, ascending: options?.ascending ?? true }
    return this
  }

  single(): Promise<{ data: any; error: any }> {
    this._single = true
    return this.execute()
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      // Chiama l'API route invece di eseguire query dirette
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          table: this._table,
          operation: this._isInsert ? 'insert' : this._isUpdate ? 'update' : this._isDelete ? 'delete' : 'select',
          select: this._select,
          data: this._data,
          where: this._where,
          order: this._order,
          limit: this._limit,
          single: this._single,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Query error:', error)
      return { data: null, error }
    }
  }
}

class NeonClient implements SupabaseClient {
  from(table: string): SupabaseQueryBuilder {
    return new NeonQueryBuilder(table)
  }

  auth = {
    getUser: async () => {
      // Questa funzione ora è gestita dalle API routes
      return { data: { user: null } }
    }
  }
}

export function createClient(): SupabaseClient {
  return new NeonClient()
}
