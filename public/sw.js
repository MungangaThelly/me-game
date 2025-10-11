const CACHE_NAME = 'memory-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/components/MemoryGame.jsx',
  '/src/components/MemoryGame.css',
  '/src/utils/soundEffects.js',
  '/src/utils/animations.js',
  '/src/utils/gameStats.js',
  '/src/utils/customThemes.js',
  '/src/utils/multiplayerManager.js',
  '/src/utils/accessibilityManager.js',
  '/src/utils/gameModes.js',
  '/src/utils/mobileManager.js',
  '/src/locales/en.json',
  '/src/locales/sv.json'
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
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