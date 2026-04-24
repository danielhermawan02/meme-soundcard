const CACHE_NAME = 'meme-soundboard-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/sounds/a-few-moments-later-sponge-bob-sfx-fun.mp3',
  './assets/sounds/angry-birds-plush-yeah-sfx.mp3',
  './assets/sounds/bass-drop-edit_mixdown.mp3',
  './assets/sounds/ding-sound-effect_2.mp3',
  './assets/sounds/dun-dun-dun-sound-effect-brass_8nFBccR.mp3',
  './assets/sounds/error_CDOxCYm.mp3',
  './assets/sounds/fahhhhhhhhhhhhhh.mp3',
  './assets/sounds/gta-san-andreas-mission-complete-sound-hq.mp3',
  './assets/sounds/halo-gaes.mp3',
  './assets/sounds/happy-happy-happy-song.mp3',
  './assets/sounds/kids-saying-yay-sound-effect_3.mp3',
  './assets/sounds/mentality.mp3',
  './assets/sounds/mlg-airhorn.mp3',
  './assets/sounds/movie_1.mp3',
  './assets/sounds/patrick-pembohong-kau-pembohong.mp3',
  './assets/sounds/punch_u4LmMsr.mp3',
  './assets/sounds/record-scratch-2.mp3',
  './assets/sounds/rizz-sound-effect.mp3',
  './assets/sounds/shock-kaget.mp3',
  './assets/sounds/sudden-suspense-sound-effect.mp3',
  './assets/sounds/vine-boom.mp3'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching all assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionally cache new requests here
        return fetchResponse;
      });
    }).catch(() => {
      // Offline fallback if needed
    })
  );
});
