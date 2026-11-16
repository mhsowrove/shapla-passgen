'use strict';
// Only immutable application assets are cached. Never cache secrets or API responses.
const CACHE='shapla-passgen-v3';
const ASSETS=['./','./index.html','./style.css','./core.js','./app.js','./words.js','./wordlists.js','./favicon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./vendor/qrcode.js','./vendor/zxcvbn.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shapla-passgen-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.search)return;
  const allowed=ASSETS.some(path=>new URL(path,self.registration.scope).href===url.href);
  if(!allowed)return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
