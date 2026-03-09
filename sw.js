const CACHE_NAME = 'pms-v1';
const ASSETS = [
  '/parachute-ops/',
  '/parachute-ops/index.html',
  '/parachute-ops/manifest.json',
  '/parachute-ops/icon-192.png',
  '/parachute-ops/icon-512.png'
];

// Install - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  
  // For CDN resources (Supabase, JsBarcode), network only
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Offline - serve from cache
        return caches.match(event.request);
      })
  );
});
