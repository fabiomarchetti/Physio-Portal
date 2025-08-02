'use client'

import { AuthWrapper } from '@/components/shared/AuthWrapper'

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  return <AuthWrapper>{children}</AuthWrapper>
}