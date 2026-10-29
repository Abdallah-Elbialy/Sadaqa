/* Service worker: يخلّي الموقع يشتغل أوفلاين ويتحدّث لوحده */
const CACHE = 'sadaqa-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'photo.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // الخطوط: كاش أولاً
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
    return;
  }
  // أي شيء تاني خارجي (Firebase / الصوت / القرآن): من النت مباشرة
  if (url.origin !== location.origin) return;
  // فحص التحديث التلقائي: متتخزنش
  if (url.search.includes('_v=') || url.search.includes('_u=')) return;
  // ملفات الموقع: النت أولاً، وعند الانقطاع من الكاش
  e.respondWith(
    fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
