// Increment this whenever the application shell changes.
const CACHE_NAME = 'hocus-pocus-v7';
const urlsToCache = [
  './',
  './index.html',
  './style.css?v=121',
  './editorTheme.css?v=103',
  './script.js?v=120',
  './exampleSpells.js?v=103',
  './hocuspocus_spellbook.json',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  // CDN dependencies (opaque no-cors responses are fine for <script>/<link>)
  'https://cdn.jsdelivr.net/npm/p5@2.3.4/lib/p5.min.js',
  'https://cdn.jsdelivr.net/npm/p5.sound@0.4.1/dist/p5.sound.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/javascript/javascript.min.js'
];

// --- Installation Event ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event: Caching static assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(urlsToCache.map((url) => {
        const isCrossOrigin = url.startsWith('http');
        return cache.add(isCrossOrigin ? new Request(url, { mode: 'no-cors' }) : url)
          .catch((error) => console.warn('Could not precache', url, error));
      })))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// --- Fetch Event (Offline Strategy) ---
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Navigations are network-first so returning users receive the latest HTML.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put('./index.html', responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return response;
        }

        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));

            return networkResponse;
          })
          .catch((error) => {
            console.error('Fetch failed for:', event.request.url, error);
          });
      })
  );
});

// --- Activation Event (Cleaning up old caches) ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event: Cleaning old caches.');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});