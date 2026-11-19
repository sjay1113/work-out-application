// 헬스장 와이파이가 약해도 열리도록 한 번 연 화면 파일과 글꼴을 저장해 둡니다.
// 로그인·운동 기록 같은 계정 데이터(Supabase)는 저장하지 않고 항상 서버에서 받아요.
const CACHE = 'pt-note-v9';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const CACHEABLE = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin && !CACHEABLE.test(url.hostname)) return;
  // 새 기록·새 버전이 바로 보이도록 네트워크를 먼저 쓰고, 안 되면 저장본을 씁니다.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
