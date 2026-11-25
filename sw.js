// Service worker (v2 / Firebase): يفتح التطبيق دون إنترنت. لا يعترض أي طلب إلى Firebase أبداً.
const V='madrassety-v2-5';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
const CACHE_HOSTS=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  const same=u.origin===self.location.origin;
  if(!same&&!CACHE_HOSTS.includes(u.hostname))return;   // Firebase (googleapis.com) وغيره: مباشرة من الشبكة
  e.respondWith(caches.open(V).then(async c=>{
    const key=req.mode==='navigate'?'index.html':req;
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(key,r.clone());return r;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    const r=await net;
    return r||(req.mode==='navigate'?c.match('index.html'):Response.error());
  }));
});
