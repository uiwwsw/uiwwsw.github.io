const CACHE_NAME = '__CACHE_VERSION__';
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

function isCacheableResponse(response) {
  return !!response && response.status === 200 && response.type === 'basic';
}

async function putInCache(request, response) {
  if (!shouldCacheRequest(request) || !isCacheableResponse(response)) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function handleDocumentRequest(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const appShell = await caches.match('/index.html');

    if (appShell) {
      return appShell;
    }

    throw error;
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
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
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(handleDocumentRequest(event.request));
    return;
  }

  event.respondWith(handleStaticRequest(event.request));
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
