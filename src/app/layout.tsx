import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ClientProvider } from '@/components/providers/ClientProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Portale Riabilitazione Motoria',
  description: 'Sistema di riabilitazione motoria con computer vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <ClientProvider>
          {children}
        </ClientProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
