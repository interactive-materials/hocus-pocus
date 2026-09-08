// Define the cache name and the list of files to cache on installation
const CACHE_NAME = 'hocus-pocus-v1';
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'editorTheme.css',
  'script.js',
  'exampleSpells.js',
  // Make sure to include the paths to your manifest icons here as well
  '/icons/icon-512x512.png'
];

// --- Installation Event ---
self.addEventListener('install', (event) => {
  // Perform install steps
  console.log('[Service Worker] Install Event: Caching static assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add all required assets to the cache
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// --- Fetch Event (Offline Strategy) ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return response;
        }

        // No cache hit - fetch from network
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. Since we are consuming this
            // once by the browser and once by the cache, we need to clone it.
            const responseToCache = networkResponse.clone();

            // Only cache GET requests and non-opaque responses
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch((error) => {
            console.error('Fetch failed for:', event.request.url, error);
            // Optional: You can return an offline fallback page here
            // return caches.match('/offline.html');
          });
      })
  );
});

// --- Activation Event (Cleaning up old caches) ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event: Cleaning old caches.');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete caches that are not in the whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});