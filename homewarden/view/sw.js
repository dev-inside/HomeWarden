const CACHE_NAME = 'homewarden-cache-v1';
const urlsToCache = [
  '/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching initial files');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
      
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              console.log('Updated cache with new data:', event.request.url);
            });
          }
        }).catch((error) => {
          console.error('Network fetch failed:', error);
        });

        return cachedResponse; 
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse.ok) {
          throw new Error('Network response was not ok');
        }

        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch((error) => {
        console.error('Fetch failed; returning offline page instead.', error);
        return new Response('Offline: Unable to fetch resource', {
          status: 404,
          statusText: 'Not Found',
        });
      });
    })
  );
});
