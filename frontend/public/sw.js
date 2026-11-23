// Kinga Binti Offline PWA Service Worker
const CACHE_NAME = 'kinga-binti-v1';

const STATIC_ROUTES = [
  '/',
  '/capture',
  '/translate',
  '/dashboard',
  '/explorer',
  '/map',
  '/validation',
  '/ethics',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ROUTES).catch((err) => {
        console.warn('Pre-cache non-blocking notice:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept non-GET requests or backend API queries
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  // Network-first with Cache fallback for all static and route navigation
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // When disconnected / offline, retrieve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigating to an HTML route while offline, fallback to root or capture
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/capture') || await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Offline mode: content not cached yet.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
