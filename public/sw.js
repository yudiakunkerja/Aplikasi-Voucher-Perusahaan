const CACHE_NAME = 'nmsa-portal-v2';
const ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg'
];

// Install process
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation and Cache Cleanup
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events with offline-resilience
self.addEventListener('fetch', (e) => {
  // Only intercept normal safe GET requests within our origin
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  
  // Prevent caching of Google Drive/Sheets external tokens/auth sequences
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Bypass caching check for hot update file or development proxy
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/src/')) {
    return;
  }

  // Network-First for main documents and navigations to prevent stale index.html issues
  const isNavigation = e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, try cached index.html or root
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-First (Stale-While-Revalidate) for other static assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch up-to-date version in background when network matches successfully (Stale-While-Revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Handle offline silently */});
        
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
