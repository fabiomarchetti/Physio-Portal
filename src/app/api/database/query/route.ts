import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/neon/client'
import { verifyToken } from '@/lib/neon/auth'

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { table, operation, select, data, where, order, limit, single } = body

    let query = ''
    const params: any[] = []
    let paramIndex = 1

    if (operation === 'insert') {
      // INSERT
      const columns = Object.keys(data)
      const values = Object.values(data)
      const placeholders = values.map(() => `$${paramIndex++}`).join(', ')

      query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      params.push(...values)

      if (select) {
        query += ` RETURNING ${select}`
      }
    } else if (operation === 'update') {
      // UPDATE
      const sets = Object.keys(data).map(key => {
        params.push(data[key])
        return `${key} = $${paramIndex++}`
      }).join(', ')

      query = `UPDATE ${table} SET ${sets}`

      if (where && where.length > 0) {
        const whereClause = where.map((w: any) => {
          params.push(w.value)
          return `${w.column} = $${paramIndex++}`
        }).join(' AND ')
        query += ` WHERE ${whereClause}`
      }

      if (select) {
        query += ` RETURNING ${select}`
      }
    } else if (operation === 'delete') {
      // DELETE
      query = `DELETE FROM ${table}`

      if (where && where.length > 0) {
        const whereClause = where.map((w: any) => {
          params.push(w.value)
          return `${w.column} = $${paramIndex++}`
        }).join(' AND ')
        query += ` WHERE ${whereClause}`
      }
    } else {
      // SELECT
      query = `SELECT ${select || '*'} FROM ${table}`

      if (where && where.length > 0) {
        const whereClause = where.map((w: any) => {
          params.push(w.value)
          return `${w.column} = $${paramIndex++}`
        }).join(' AND ')
        query += ` WHERE ${whereClause}`
      }

      if (order) {
        query += ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}`
      }

      if (limit) {
        query += ` LIMIT ${limit}`
      }
    }

    const result = await sql(query, params)

    if (single) {
      return NextResponse.json({ data: result[0] || null, error: null })
    }

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    )
  }
}
