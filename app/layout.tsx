import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeadGhost — Turn bad websites into clients',
  description: 'Audit weak business websites, generate redesign previews, and turn prospects into web projects.',
  openGraph: { title: 'LeadGhost', description: 'Find websites that are losing customers. Show them what they could have.', type: 'website' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}