const CACHE = 'brok-shell-v1'
const APP_SHELL = ['/grok', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match('/grok'))),
  )
})
