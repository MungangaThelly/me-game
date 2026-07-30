const CACHE_NAME = 'memory-game-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok && new URL(event.request.url).origin === self.location.origin) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') return caches.match('/index.html');
            throw new Error('Resource unavailable offline');
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for offline game data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync game data when connection is restored
      syncGameData()
    );
  }
});

async function syncGameData() {
  try {
    // Sync any pending game statistics or achievements
    const cache = await caches.open('memory-game-data');
    const response = await cache.match('/pending-sync');
    if (response) {
      const data = await response.json();
      // Send data to server when online
      // Implementation would depend on backend API
      console.log('Syncing offline data:', data);
    }
  } catch (error) {
    console.error('Failed to sync game data:', error);
  }
}
