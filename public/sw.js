const CACHE_NAME = 'uiwwsw-__CACHE_VERSION__';
// Use relative paths for GitHub Pages compatibility
const urlsToCache = [
  '/',
  '/index.html',
  '/universe.png',
  '/favicon.ico',
  '/fonts/SUITE-Variable.css',
  '/fonts/SUITE-Variable.ttf',
  '/fonts/SUITE-Variable.woff2'
];
const CACHEABLE_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font']);

function shouldCacheRequest(request) {
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith('/data/')) {
    return false;
  }

  return CACHEABLE_DESTINATIONS.has(request.destination);
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          // Cache individual resources with error handling
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
                return Promise.resolve();
              });
            })
          );
        }),
      self.skipWaiting()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                if (shouldCacheRequest(event.request)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});
