const C='desk-v2',SHELL=['./','index.html','app.css','app.js','chart.js','manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(u.pathname.includes('/api/')||u.pathname.includes('/d/')||u.pathname.includes('/data/'))return; // live data never cached
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
