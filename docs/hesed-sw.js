const CACHE_NAME = 'hesed-shell-v2';
const SHELL = ['./hesed.html', './hesed.webmanifest', './hesed-icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Never cache API calls or operational records. This worker only provides a basic app shell.
  if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/') || url.pathname.includes('/realtime/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok && url.pathname.endsWith('/hesed.html')) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./hesed.html', copy));
      }
      return response;
    }).catch(() => caches.match('./hesed.html')));
    return;
  }
  if (url.pathname.endsWith('/hesed.webmanifest')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});