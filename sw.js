// Service worker: يفتح التطبيق بدون إنترنت. بيانات jsonbin لا تُخزَّن هنا أبداً.
const V='madrassety-v1';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
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
  if(u.hostname==='api.jsonbin.io')return;            // البيانات دائماً من الشبكة
  const same=u.origin===self.location.origin;
  const ext=/(^|\.)(googleapis|gstatic)\.com$|^cdnjs\.cloudflare\.com$/.test(u.hostname);
  if(!same&&!ext)return;
  // الصفحة: نعرض المخزَّن فوراً ونحدّثه في الخلفية
  e.respondWith(caches.open(V).then(async c=>{
    const key=req.mode==='navigate'?'index.html':req;
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(key,r.clone());return r;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    const r=await net;
    return r||(req.mode==='navigate'?c.match('index.html'):Response.error());
  }));
});
