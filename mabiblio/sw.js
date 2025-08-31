// cache-buster 1756652123

const CACHE_NAME = 'hub-cache-v1';
const CORE_ASSETS = [
  'loi_succession.html',
  'index.html',
  'manifest.webmanifest',
  'loiminorite.html',
  'icons/icon-192.png',
  'textes_legislatifs.html',
  'document-divorce.html',
  'code_penal.html',
  'icons/icon-512.png',
  'decret_pension.html',
  'statuts.html',
  'ordonnancepension.html',
  'deontologie.html',
  'loi_mariage.html',
  'document-adoption.html',
  'loietatcivil.html',
  'lois_penales.html',
  'loi_penale.html',
  'loi_penale-reglement.html',
  'cpp.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // App shell-style navigation fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Cache-first for same-origin GETs
  if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        }).catch(() => caches.match('index.html'));
      })
    );
  }
});
