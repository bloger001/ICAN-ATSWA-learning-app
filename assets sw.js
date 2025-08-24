const CACHE = 'ican-prep-v1';
const ASSETS = [
  'index.html','quiz.html','admin.html','leaderboard.html','resources.html',
  'assets/app.css','assets/app.js','assets/quiz.js','assets/admin.js',
  'assets/manifest.json','assets/sw.js',
  'data/atswa1_basic_accounting.sample.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(res=>res || fetch(e.request))
  );
});
