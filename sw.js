// Senior AAC Communication Board - offline cache.
// The push script bumps the number below on each release so old caches are replaced.
const CACHE = 'aac-v30';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Version checks always go to the network (bypass cache entirely)
  if (e.request.url.includes('_uc=')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => new Response('', { status: 408 })));
    return;
  }
  // Cache first (works offline), refresh the cached copy in the background
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(r => {
          if (r && r.status === 200) c.put(e.request, r.clone());
          return r;
        }).catch(() => cached || (e.request.mode === 'navigate' ? c.match('./') : Response.error()));
        return cached || fresh;
      })
    )
  );
});
