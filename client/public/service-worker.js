// Service Worker for ViewerApps PWA
const CACHE_NAME = 'viewerapps-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache files during installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force service worker activation
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients so that the service worker is in control without reload
  self.clients.claim();
});

// Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip chrome-extension requests to fix console error
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();

        // Update cache for next time
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Don't cache API calls or backend routes
            if (event.request.url.includes('/api/')) {
              return;
            }
            try {
              cache.put(event.request, responseToCache);
            } catch (error) {
              console.log('Caching error:', error);
            }
          });

        return response;
      })
      .catch(() => {
        // If network request fails, try to get it from the cache
        return caches.match(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let notification = {
    title: 'ViewerApps',
    body: 'Something new happened!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };

  if (event.data) {
    try {
      notification = JSON.parse(event.data.text());
    } catch (e) {
      notification.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window/tab if none found
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});