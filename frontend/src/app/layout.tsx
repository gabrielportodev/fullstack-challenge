import type { Metadata } from 'next'
import { Outfit, Space_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin']
})

const spaceMono = Space_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'Crash Game',
  description: 'Multiplayer crash game'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR' className={`${outfit.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col bg-zinc-950 text-white'>
        <Providers>{children}</Providers>
        <Toaster richColors position='bottom-center' />
      </body>
    </html>
  )
}
