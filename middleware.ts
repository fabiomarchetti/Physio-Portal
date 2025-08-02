import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Pagine che richiedono autenticazione
  const protectedRoutes = ['/dashboard', '/pazienti', '/sessioni', '/obiettivi', '/analytics', '/profilo', '/impostazioni']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Se l'utente è autenticato e sta cercando di accedere a login/register
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}