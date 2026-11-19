// PT 운동 노트 — 오프라인 저장 + 업데이트 알림
// 새 버전을 올릴 때마다 CACHE 숫자와 version.json 의 notes 를 바꿔 주세요.
// 새 버전은 미리 받아 두기만 하고, 앱에서 "업데이트"를 눌러야 적용돼요.
const CACHE = 'pt-note-v13';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
// 계정 데이터(Supabase)는 저장하지 않아요. 글꼴과 라이브러리만 함께 보관해요.
const CACHEABLE = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/;

self.addEventListener('install', e => {
  // 새 버전 파일을 서버에서 새로 받아 둡니다 (10분 임시 보관 무시).
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    fetch(u, { cache: 'no-cache' }).then(r => { if (r.ok) return c.put(u, r); })
  ))));
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const same = url.origin === self.location.origin;
  if (!same && !CACHEABLE.test(url.hostname)) return;
  // 지금 쓰는 버전을 먼저 보여주고, 없는 파일(그림 등)만 서버에서 받아 보관해요.
  e.respondWith(caches.open(CACHE).then(c =>
    c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
      return res;
    }).catch(() => e.request.mode === 'navigate' ? c.match('index.html') : Response.error()))
  ));
});
