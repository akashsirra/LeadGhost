import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegister from './pwa-register'

export const metadata: Metadata = {
  title: 'BROK — AI Agent',
  description: 'A fast, practical AI agent powered by Groq.',
  applicationName: 'BROK',
  appleWebApp: { capable: true, title: 'BROK', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#07070a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><PwaRegister />{children}</body></html>
}
