/**
 * ViewerApps Service Worker
 * For offline functionality and performance improvements
 */

const CACHE_NAME = 'viewerapps-cache-v1';
const RUNTIME_CACHE = 'viewerapps-runtime-v1';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Lifecycle: Install - Cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Lifecycle: Activate - Clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is an API call
const isApiRequest = (url) => {
  const parsedUrl = new URL(url, self.location.origin);
  return parsedUrl.pathname.startsWith('/api/');
};

// Helper function to determine if a request is for an image
const isImageRequest = (url) => {
  const parsedUrl = new URL(url, self.location.origin);
  const extension = parsedUrl.pathname.split('.').pop().toLowerCase();
  
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
};

// Lifecycle: Fetch - Network first for API, cache first for static assets
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip if the request isn't GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For API requests, use network-first strategy
  if (isApiRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a clone of the response in runtime cache
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              // Only cache successful responses
              if (responseToCache.status === 200) {
                cache.put(event.request, responseToCache);
              }
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For image requests, use cache-first strategy with network fallback
  if (isImageRequest(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, fetch from network
          return fetch(event.request)
            .then(response => {
              // Cache the response for future
              const responseToCache = response.clone();
              
              caches.open(RUNTIME_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
    return;
  }
  
  // For all other requests (HTML, CSS, JS), use stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Update the cache with the fresh version
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Network failed completely
            return new Response('Network error', {
              status: 408,
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
          
        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(
      // Process any saved failed requests here
      Promise.resolve()
    );
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-icon.png',
      data: data.url ? { url: data.url } : undefined
    });
  }
});

// Open the app when a notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});