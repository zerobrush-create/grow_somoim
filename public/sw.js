const CACHE_NAME = "grow-somoim-v1";
const OFFLINE_ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((network) => {
          const copy = network.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return network;
        })
        .catch(() => caches.match("/"));
    })
  );
});
