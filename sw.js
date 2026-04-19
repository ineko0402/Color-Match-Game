const CACHE_NAME = "color-match-v1";
const ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./main.js",
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
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// フェッチ: キャッシュファースト、フォールバックでネットワーク
self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request)
            .then(cached => cached || fetch(e.request))
    );
});
