const CACHE_NAME = "color-match-v6";
const CACHE_PREFIX = "color-match-";
const ASSETS = [
    "./",
    "./index.html",
    "./style.css?v=20261107.5",
    "./color-science.js?v=20261107.1",
    "./practice-records.js?v=20261107.1",
    "./main.js?v=20261107.5",
    "./manifest.json",
    "./src/favicons/android-chrome-192x192.png",
    "./src/favicons/android-chrome-512x512.png",
    "./src/favicons/apple-touch-icon.png",
    "./src/favicons/favicon-16x16.png",
    "./src/favicons/favicon-32x32.png"
];

// インストール: アセットをキャッシュ
self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// フェッチ: キャッシュファースト、フォールバックでネットワーク
self.addEventListener("fetch", e => {
    if(e.request.method !== "GET") return;

    if(e.request.mode === "navigate"){
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put("./index.html", copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    e.respondWith(
        caches.match(e.request)
            .then(cached => cached || fetch(e.request))
    );
});
