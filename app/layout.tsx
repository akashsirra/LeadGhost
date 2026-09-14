import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEGIS — Autonomous Engineering & Intelligence System',
  description: 'A verification-first agent engineering system for trustworthy autonomous development.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}