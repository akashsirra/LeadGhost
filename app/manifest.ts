import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BROK — AI Agent',
    short_name: 'BROK',
    description: 'A fast, practical AI agent powered by Groq.',
    start_url: '/grok',
    display: 'standalone',
    background_color: '#07070a',
    theme_color: '#07070a',
    orientation: 'portrait',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }
}
