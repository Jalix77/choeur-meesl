// Service worker minimal — MEESL Chœur PWA.
// Ne met en cache QUE les fichiers statiques publics (JS/CSS Next.js, polices,
// logo, icônes, manifest). Ne touche jamais aux routes /api/*, aux pages
// authentifiées ni à aucune donnée métier : tout le reste passe directement
// au réseau, sans interception.

const CACHE_NAME = 'meesl-static-v1'

const STATIC_PATH_PREFIXES = ['/_next/static/', '/icons/']
const STATIC_EXACT_PATHS = ['/logo-meesl.png', '/manifest.webmanifest']
const STATIC_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.otf']

function isCacheableStaticAsset(url) {
  if (url.origin !== self.location.origin) return false
  if (STATIC_EXACT_PATHS.includes(url.pathname)) return true
  if (STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return true
  if (STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) return true
  return false
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (!isCacheableStaticAsset(url)) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) cache.put(request, response.clone())
      return response
    })
  )
})
