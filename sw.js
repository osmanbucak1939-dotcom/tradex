const CACHE_NAME = 'commerz-v1';
const OFFLINE_URL = '/trader';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Sadece GET isteklerini yakala
  if(event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Başarılı yanıtı cache'e kaydet
        if(response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline: cache'den sun
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
