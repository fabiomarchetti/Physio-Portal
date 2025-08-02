'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  User, 
  LogOut, 
  Settings, 
  Activity,
  Heart,
  Menu,
  X
} from 'lucide-react'
import { AuthService } from '@/lib/supabase/auth'
import { Profilo } from '@/types/database'
import { toast } from 'sonner'

interface NavbarProps {
  utente?: SupabaseUser | null
  profilo?: Profilo | null
}

export function Navbar({ utente, profilo }: NavbarProps) {
  const router = useRouter()
  const [menuAperto, setMenuAperto] = useState(false)

  const handleLogout = async () => {
    const result = await AuthService.logout()
    if (result.success) {
      toast.success('Logout effettuato con successo')
      router.push('/')
    } else {
      toast.error('Errore durante il logout')
    }
  }

  const getInitials = (nome: string, cognome: string) => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
  }

  const navLinks = profilo?.ruolo === 'fisioterapista' ? [
    { href: '/dashboard/fisioterapista', label: 'Dashboard', icon: Activity },
    { href: '/pazienti', label: 'Pazienti', icon: User },
    { href: '/analytics', label: 'Analytics', icon: Heart },
  ] : [
    { href: '/dashboard/paziente', label: 'Dashboard', icon: Activity },
    { href: '/sessioni', label: 'Le Mie Sessioni', icon: Heart },
    { href: '/obiettivi', label: 'Obiettivi', icon: Settings },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">
                Physio Portal
              </span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          {profilo && (
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {utente && profilo ? (
              <>
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuAperto(!menuAperto)}
                  >
                    {menuAperto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(profilo.nome, profilo.cognome)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profilo.nome} {profilo.cognome}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {utente?.email}
                        </p>
                        <p className="text-xs leading-none text-blue-600 capitalize">
                          {profilo.ruolo}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profilo" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profilo</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/impostazioni" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Impostazioni</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Accedi</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrati</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuAperto && profilo && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setMenuAperto(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}