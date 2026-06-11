// TradeX PWA Service Worker
// Strateji: NETWORK-FIRST — her zaman önce ağdan dene, başarısızsa cache'e düş.
// Böylece yeni yüklenen HTML sürümleri anında alınır (eski cache asla öncelik kazanmaz).
const CACHE = 'tradex-v2';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  // Firebase / API / WS upgrade isteklerine hiç karışma — her zaman doğrudan ağ
  if (e.request.method !== 'GET') return;
  var u = e.request.url;
  if (u.includes('firebase') || u.includes('googleapis') || u.includes('firestore') ||
      u.includes('twelvedata') || u.includes('binance') || u.includes('railway.app') ||
      u.includes('yahoo') || u.includes('stooq')) {
    return;
  }
  // Network-first: ağdan al + cache'i tazele; ağ yoksa cache'ten servis et
  e.respondWith(
    fetch(e.request).then(function (res) {
      try {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      } catch (err) {}
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
