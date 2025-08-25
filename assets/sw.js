const VER='2025-08-26a';
const CORE=[
  './index.html','./assets/app.css','./assets/app.js','./assets/firebase.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open('ican-'+VER).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>!k.endsWith(VER)).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if (e.request.method!=='GET') return;
  e.respondWith((async()=>{
    const hit=await caches.match(e.request); if (hit) return hit;
    try{
      const net=await fetch(e.request);
      const cl=net.clone();
      caches.open('ican-'+VER).then(c=>c.put(e.request,cl)).catch(()=>{});
      return net;
    }catch{
      return new Response('Offline', {status:503, statusText:'Offline'});
    }
  })());
});