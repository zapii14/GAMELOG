/* =========================================================
   SERVICE WORKER DE GAMELOG
   Guarda la app en el dispositivo para que abra sin internet.
   Si cambias algo de la app, sube el número de VERSION para
   que los móviles descarguen la versión nueva.
   ========================================================= */
const VERSION = 'gamelog-v1';
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icon-180.png', './icon-192.png', './icon-512.png'];

// Al instalar: guarda los archivos básicos
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

// Al activar: borra versiones antiguas
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // La página: primero intenta internet (para recibir mejoras); si no hay, usa la guardada
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Fuentes pixel de Google y archivos propios: usa la copia guardada y la refresca por detrás
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (isFont || url.origin === self.location.origin){
    e.respondWith(caches.open(VERSION).then(async c => {
      const cached = await c.match(req);
      const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || fresh;
    }));
  }
});
