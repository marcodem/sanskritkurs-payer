// ============================================================
// Payer Sanskrit Service Worker
// Phase 19 + 20: Service Worker & Locale-aware Offline Caching
// ============================================================

// Cache Name with Version
// Convention: payer-v{phase}-r{revision}
const CACHE_VERSION = 'payer-v20-r1'
const CACHE_NAME = `payer-cache-${CACHE_VERSION}`

// Active locales — synced from client via postMessage.
// Default matches lang-settings.js DEFAULT_LOCALES.
let ACTIVE_LOCALES = ['de', 'en', 'it']

// Cache key for persisting active_locales across SW restarts.
// Not a real URL — lives only inside Cache Storage.
const LOCALES_CACHE_KEY = new Request('/__payer_locales')

// Assets to pre-cache during install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/pwa-icons/icon-192.png',
  '/pwa-icons/icon-512.png'
]

// ============================================================
// INSTALL: Pre-cache critical assets
// ============================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching', PRECACHE_URLS.length, 'assets')
        return Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Failed to cache:', url, err.message)
            })
          )
        )
      })
      .then(() => {
        console.log('[SW] Install complete')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err)
      })
  )
})

// ============================================================
// ACTIVATE: Clean up old caches, restore active locales, claim clients
// ============================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Existing caches:', cacheNames)
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(async () => {
        // Restore persisted ACTIVE_LOCALES from previous session
        try {
          const cache = await caches.open(CACHE_NAME)
          const stored = await cache.match(LOCALES_CACHE_KEY)
          if (stored) {
            const data = await stored.json()
            if (Array.isArray(data.locales) && data.locales.length > 0) {
              ACTIVE_LOCALES = data.locales
              console.log('[SW] Restored active locales:', ACTIVE_LOCALES)
            }
          }
        } catch (err) {
          console.warn('[SW] Could not restore locales:', err.message)
        }
        
        console.log('[SW] Activate complete, claiming clients')
        return self.clients.claim().then(() => {
          // Best-effort: ask browser not to silently purge our cache
          requestPersistentStorage && requestPersistentStorage()
        })
      })
  )
})

// ============================================================
// MESSAGE: Client → SW communication
// ============================================================

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return
  
  if (event.data.type === 'SET_ACTIVE_LOCALES') {
    const locales = event.data.locales
    if (Array.isArray(locales) && locales.length > 0) {
      ACTIVE_LOCALES = locales
      console.log('[SW] Active locales updated:', ACTIVE_LOCALES)
      
      // Persist to cache storage so it survives SW restart
      caches.open(CACHE_NAME).then(cache => {
        cache.put(LOCALES_CACHE_KEY.clone(), new Response(JSON.stringify({
          locales: ACTIVE_LOCALES,
          updated: Date.now()
        }), { headers: { 'Content-Type': 'application/json' }}))
      })
    }
  }
})

// Listen to messages from clients even if no explicit event handler was registered
// (allows navigator.serviceWorker.controller to talk back)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

/**
 * PREFETCH_LOCALE: Pre-cache URLs for a specified locale by fetching from network.
 * Used when user activates a new language in Settings.
 *
 * Request shape:
 *   { type: 'PREFETCH_LOCALE', locale: string, urls: string[] }
 *
 * Response shape (via event.source.postMessage):
 *   Success: { type: 'PREFETCH_COMPLETE', locale, cached: number, failed: number }
 *   Error:   { type: 'PREFETCH_ERROR', locale, error: string }
 */
self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'PREFETCH_LOCALE') return

  const { locale, urls } = event.data
  
  if (!Array.isArray(urls) || urls.length === 0) {
    event.source?.postMessage({
      type: 'PREFETCH_ERROR',
      locale,
      error: 'No URLs provided'
    })
    return
  }

  console.log(`[SW] PREFETCH_LOCALE: ${locale} — ${urls.length} URLs`)

  // Update ACTIVE_LOCALES to include this locale (in case it was just added)
  if (!ACTIVE_LOCALES.includes(locale)) {
    ACTIVE_LOCALES.push(locale)
    // Persist the updated list
    try {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(LOCALES_CACHE_KEY.clone(), new Response(JSON.stringify({
        locales: ACTIVE_LOCALES,
        updated: Date.now()
      }), { headers: { 'Content-Type': 'application/json' }}))
    } catch (err) {
      console.warn('[SW] Failed to persist updated locales:', err)
    }
  }

  const parallel = event.data?.parallel === true ? 6 : 1
  const progressRate = event.data?.progressRate || 10  // post every N URLs
  
  const cached = { count: 0 }
  const failed = { count: 0 }
  const total = urls.length
  const cache = await caches.open(CACHE_NAME)
  const source = event.source
  
  // Helper: fetch one URL and put into cache
  const fetchOne = async (url) => {
    try {
      const response = await fetch(url, { credentials: 'same-origin' })
      if (response.ok) {
        await cache.put(url, response)
        cached.count++
      } else {
        console.warn(`[SW] PREFETCH non-OK (${response.status}): ${url}`)
        failed.count++
      }
    } catch (err) {
      console.warn(`[SW] PREFETCH failed: ${url} — ${err.message}`)
      failed.count++
    }
    // Periodically report progress
    const done = cached.count + failed.count
    if (source && done % progressRate === 0) {
      source.postMessage({
        type: 'PREFETCH_PROGRESS',
        locale,
        cached: cached.count,
        failed: failed.count,
        total,
        done
      })
    }
  }
  
  if (parallel > 1) {
    // Parallel processing: chunk the URL list into groups of `parallel`
    for (let i = 0; i < urls.length; i += parallel) {
      const batch = urls.slice(i, i + parallel)
      await Promise.all(batch.map(fetchOne))
    }
  } else {
    // Sequential (original behaviour)
    for (const url of urls) {
      await fetchOne(url)
    }
  }

  console.log(`[SW] PREFETCH_LOCALE complete: ${locale} — ${cached.count}/${total} cached, ${failed.count} failed`)

  // Silent quota-pressure check after each prefetch — auto-evict stale locales if needed
  autoEvictOnQuotaPressure && await autoEvictOnQuotaPressure()

  source?.postMessage({
    type: 'PREFETCH_COMPLETE',
    locale,
    cached: cached.count,
    failed: failed.count,
    total
  })
})

/**
 * PREFETCH_BATCH: Pre-cache URLs for multiple locales at once.
 * Used during PWA install flow to pre-load all active locales.
 *
 * Request shape:
 *   { type: 'PREFETCH_BATCH', locales: [{ locale, urls }], parallel?: number }
 *
 * Progress events (sent to client):
 *   { type: 'PREFETCH_BATCH_PROGRESS', locale, cached, failed, total,
 *     cumulativeCached, cumulativeTotal }
 *
 * Completion event:
 *   { type: 'PREFETCH_BATCH_COMPLETE', results: [{ locale, cached, failed, total }],
 *     totalCached, totalFailed, total }
 */
self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'PREFETCH_BATCH') return
  
  const { locales, parallel = 6 } = event.data
  if (!Array.isArray(locales) || locales.length === 0) {
    event.source?.postMessage({ type: 'PREFETCH_BATCH_ERROR', error: 'No locales provided' })
    return
  }
  
  const results = []
  const cumulative = { cached: 0, total: 0 }
  for (const loc of locales) cumulative.total += (loc.urls?.length || 0)
  
  console.log(`[SW] PREFETCH_BATCH: ${locales.length} locales, ${cumulative.total} total URLs`)
  
  for (const { locale, urls } of locales) {
    if (!Array.isArray(urls) || urls.length === 0) {
      results.push({ locale, cached: 0, failed: 0, total: 0 })
      continue
    }
    
    // Ensure locale is in ACTIVE_LOCALES
    if (!ACTIVE_LOCALES.includes(locale)) {
      ACTIVE_LOCALES.push(locale)
    }
    
    const cache = await caches.open(CACHE_NAME)
    const total = urls.length
    let cached = 0
    let failed = 0
    const source = event.source
    
    const fetchOne = async (url) => {
      try {
        const resp = await fetch(url, { credentials: 'same-origin' })
        if (resp.ok) {
          await cache.put(url, resp)
          cached++
          cumulative.cached++
        } else {
          failed++
        }
      } catch {
        failed++
      }
      const done = cached + failed
      if (source && done % 10 === 0) {
        source.postMessage({
          type: 'PREFETCH_BATCH_PROGRESS',
          locale,
          cached, failed, total,
          cumulativeCached: cumulative.cached,
          cumulativeTotal: cumulative.total
        })
      }
    }
    
    for (let i = 0; i < urls.length; i += parallel) {
      await Promise.all(urls.slice(i, i + parallel).map(fetchOne))
    }
    
    results.push({ locale, cached, failed, total })
    console.log(`[SW]   ${locale}: ${cached}/${total} cached, ${failed} failed`)
  }
  
  // Persist final ACTIVE_LOCALES
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(LOCALES_CACHE_KEY.clone(), new Response(JSON.stringify({
      locales: ACTIVE_LOCALES,
      updated: Date.now()
    }), { headers: { 'Content-Type': 'application/json' }}))
  } catch (err) {
    console.warn('[SW] BATCH: Failed to persist locales:', err)
  }
  
  const totalCached = results.reduce((sum, r) => sum + r.cached, 0)
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
  
  console.log(`[SW] PREFETCH_BATCH COMPLETE: ${totalCached}/${cumulative.total} cached, ${totalFailed} failed`)
  
  // Silent quota-pressure check after batch completes
  autoEvictOnQuotaPressure && await autoEvictOnQuotaPressure()
  
  event.source?.postMessage({
    type: 'PREFETCH_BATCH_COMPLETE',
    results,
    totalCached,
    totalFailed,
    total: cumulative.total
  })
})



// ============================================================
// CACHING STRATEGIES
// ============================================================

/**
 * NetworkFirst: Try network, fall back to cache (for HTML documents).
 * URLs belonging to inactive locales are NOT cached (network-only).
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const url = new URL(request.url)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (err) {
    // Bei Netzwerk-Fehler: Fallback-Kette für ALLE Locales (aktiv + inaktiv).
    // Grund: User soll hilfreiche offline.html sehen statt Chrome-Fehlerseite.
    console.log('[SW] Network failed, checking cache:', request.url)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback auf offline.html für Dokument-Requests
    if (request.destination === 'document' 
        || (request.headers.get('accept') || '').includes('text/html')) {
      console.log('[SW] No cache, serving offline.html')
      const offlinePage = await cache.match('/offline.html')
      if (offlinePage) return offlinePage
    }
    
    return new Response('Offline - Payer Sanskrit', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

/**
 * CacheFirst: Check cache first, fall back to network.
 * URLs for inactive locales bypass cache entirely (network-only).
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (err) {
    console.warn('[SW] Asset unavailable offline:', request.url)
    return new Response('Asset unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

/**
 * StaleWhileRevalidate: Serve from cache immediately, revalidate in background.
 * For inactive locales: bypass cache entirely (network-only).
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  
  const cachedResponse = await cache.match(request)
  
  // Start network fetch in parallel
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)
  
  if (cachedResponse) {
    networkResponsePromise // fire-and-forget
    return cachedResponse
  }
  
  const networkResponse = await networkResponsePromise
  
  if (networkResponse) {
    return networkResponse
  }
  
  return new Response('', { status: 404 })
}

// ============================================================
// AUTO QUOTA MANAGEMENT (invisible to user)
// ============================================================
//
// Non-technical users shouldn't need to think about cache size.
// The SW monitors storage pressure and evicts inactive locales silently.

const QUOTA_HIGH_THRESHOLD = 0.8  // start evicting when > 80% used

/**
 * Request persistent storage so the browser doesn't silently purge the cache
 * (iOS Safari / Chrome may evict caches without this under storage pressure).
 * Best-effort — not all browsers honor it.
 */
async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    try {
      const granted = await navigator.storage.persist()
      console.log(`[SW] Persistent storage: ${granted ? 'granted' : 'denied'}`)
    } catch (err) {
      console.warn('[SW] storage.persist() failed:', err.message)
    }
  }
}

/**
 * If storage usage > QUOTA_HIGH_THRESHOLD, evict URLs belonging to locales
 * that are NOT currently active (stale / previously deselected data).
 *
 * Never evicts:
 * - Shared assets (CSS, JS, fonts, images)
 * - Current ACTIVE_LOCALES
 * - Infrastructure URLs (/, /offline.html, manifest.json)
 *
 * @returns {Promise<number>} Number of evicted entries
 */
async function autoEvictOnQuotaPressure() {
  let evicted = 0
  try {
    if (!navigator.storage?.estimate) return 0
    const est = await navigator.storage.estimate()
    if (!est.quota || !est.usage) return 0
    const usageRatio = est.usage / est.quota
    if (usageRatio < QUOTA_HIGH_THRESHOLD) return 0

    console.log(`[SW] Storage pressure ${(usageRatio * 100).toFixed(1)}% — auto-evicting inactive locales`)

    const cache = await caches.open(CACHE_NAME)

    const requests = await cache.keys()
    for (const request of requests) {
      if (request.url === LOCALES_CACHE_KEY.url) continue
      const url = new URL(request.url)
      
      // Protect infrastructure assets
      if (['/', '/index.html', '/offline.html', '/manifest.json'].includes(url.pathname) ||
          url.pathname.startsWith('/pwa-icons/') ||
          url.pathname.startsWith('/assets/')) {
        continue
      }
      
      // Protect binary assets shared across locales
      if (url.pathname.match(/\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico|mp3|wav|pdf)$/i)) {
        continue
      }
      
      const m = url.pathname.match(/^\/([a-z]{2,3}(?:-[A-Z]{2})?)(?:\/|$)/)
      
      if (!m) {
         // DE root path without prefix
         if (!url.pathname.match(/^\/[a-z]{2}/) && !ACTIVE_LOCALES.includes('de')) {
             await cache.delete(request)
             evicted++
         }
         continue
      }
      
      const locale = m[1]
      if (!ACTIVE_LOCALES.includes(locale)) {
        await cache.delete(request)
        evicted++
      }
    }

    if (evicted > 0) {
      console.log(`[SW] Auto-evicted ${evicted} inactive-locale entries`)
    }
  } catch (err) {
    console.warn('[SW] autoEvictOnQuotaPressure failed:', err.message)
  }
  return evicted
}

// ============================================================
// FETCH: Routing based on request type
// ============================================================

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // HTML documents → NetworkFirst (always fresh, fallback to cache)
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request))
    return
  }
  
  // CSS, JS, Fonts → CacheFirst (immutable, content-hashed URLs)
  if (request.destination === 'style'
      || request.destination === 'script'
      || request.destination === 'font'
      || url.pathname.endsWith('.css')
      || url.pathname.endsWith('.js')
      || url.pathname.endsWith('.woff2')
      || url.pathname.endsWith('.woff')
      || url.pathname.endsWith('.ttf')) {
    event.respondWith(cacheFirst(request))
    return
  }
  
  // Images → StaleWhileRevalidate (fast + fresh)
  if (request.destination === 'image'
      || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  
  // Manifest + PWA icons → NetworkFirst
  if (url.pathname === '/manifest.json'
      || url.pathname.startsWith('/pwa-icons/')) {
    event.respondWith(networkFirst(request))
    return
  }
  
  // Everything else → NetworkFirst
  event.respondWith(networkFirst(request))
})
