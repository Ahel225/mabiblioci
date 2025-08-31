// service-worker.js — generated
const CACHE_VERSION = "1756652123";
const PRECACHE = "precache-v" + CACHE_VERSION;
const RUNTIME = "runtime-v" + CACHE_VERSION;

const ASSETS = [
  "annexe_diplomate.html",
  "annexe_greffier.html",
  "annexe_magistrature.html",
  "annexe_prefets.html",
  "annexe_sgfp.html",
  "code_penal.html",
  "code_penal_reglement.html",
  "cpp.html",
  "decret_diplomate.html",
  "decret_greffier.html",
  "decret_modalites_communes.html",
  "decret_prefets.html",
  "decretpolice.html",
  "decrets_application_sgfp.html",
  "deontologie.html",
  "deontologie_enseignement.html",
  "deontologie_pharmacien.html",
  "deontologiemedecin.html",
  "fonctionmilitaire.html",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "index.html",
  "loi_diplomate.html",
  "loi_mariage.html",
  "loi_notaire.html",
  "loi_prefets.html",
  "loi_succession.html",
  "loietatcivil.html",
  "loiminorite.html",
  "lois_penales.html",
  "mescodes.html",
  "offline.html",
  "ordonnancepension.html",
  "profession_architecte.html",
  "sgfp.html",
  "statut_magistrature.html",
  "statutdiplomate.html",
  "statutgreffier.html",
  "statutpolice.html",
  "statuts.html",
  "style-autreDocs.css",
  "style-doc12.css",
  "style-tableau1.css",
  "style-tableau4.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (![PRECACHE, RUNTIME].includes(k) ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

async function networkFirst(req, fallbackURL) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (fallbackURL) return caches.match(fallbackURL);
    throw e;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || networkPromise || fetch(req);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    event.respondWith(networkFirst(req, "offline.html"));
    return;
  }
  if (accept.includes("text/css") || accept.includes("application/javascript") || req.destination === "script" || req.destination === "style") {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  event.respondWith(caches.match(req).then((c) => c || fetch(req)));
});
