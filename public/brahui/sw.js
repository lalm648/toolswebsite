/*
  Service worker for the Brahui app. Scope is /brahui/, so nothing it does
  reaches the rest of Webutilia — the site is a separate origin path and stays
  on the network exactly as before.

  What it makes possible is the point of the Android work: an installed app that
  opens and works with no connection. That means the shell — the document, the
  sidecar of senses and examples, the icons — is precached on install, and the
  app is usable from cache from then on.

  What is deliberately NOT precached is the audio. There are 6,646 recordings
  totalling 113 MB, and no one should spend that on first open to hear a dozen
  words. They are cached as they are played, and the store is trimmed when it
  grows past AUDIO_MAX so a long session cannot fill a phone.

  Bump VERSION whenever the shell changes. Old caches are dropped on activate,
  so a bump is how an update actually reaches an installed app.
*/

const VERSION = "1";
const SHELL = `brahui-shell-v${VERSION}`;
const AUDIO = `brahui-audio-v${VERSION}`;
const MINE = new Set([SHELL, AUDIO]);

// How many recordings to keep. 600 files is roughly 10 MB at this bitrate —
// far more than anyone plays in a sitting, far less than a phone will miss.
const AUDIO_MAX = 600;

// The document is the app, so it is the one entry that must land; if any of the
// rest fails the install still succeeds and it is fetched on demand later.
const REQUIRED = "./index.html";
const OPTIONAL = [
  "./lexdetail.c6ebf98142d2.json",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.add(new Request(REQUIRED, { cache: "reload" }));
      await Promise.allSettled(
        OPTIONAL.map((url) => cache.add(new Request(url, { cache: "reload" })))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("brahui-") && !MINE.has(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/** A response worth storing: same-origin, 200, and actually a response. */
function cacheable(res) {
  return res && res.status === 200 && res.type === "basic";
}

/** Serve from cache, refresh in the background. The app never waits on the network. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreSearch: true });
  const fetching = fetch(request)
    .then((res) => {
      if (cacheable(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await fetching) || Response.error();
}

/**
 * Build the 206 the player asked for out of a whole file we hold in cache.
 *
 * This is the part that is easy to get wrong. An <audio> element does not ask
 * for a file, it asks for a byte range, and the server answers 206 Partial
 * Content — which Cache.put() refuses to store. Cache the response the player
 * receives and nothing is ever stored; skip the range requests and the audio
 * never works offline. So we fetch the whole file ourselves, store that, and
 * cut the requested range out of it here.
 */
async function sliceRange(full, rangeHeader) {
  const buf = await full.clone().arrayBuffer();
  const total = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m) return full;

  let start = m[1] === "" ? null : parseInt(m[1], 10);
  let end = m[2] === "" ? null : parseInt(m[2], 10);
  if (start === null && end === null) return full;
  if (start === null) {
    // "bytes=-500" means the last 500 bytes.
    start = Math.max(0, total - end);
    end = total - 1;
  } else if (end === null || end >= total) {
    end = total - 1;
  }
  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const body = buf.slice(start, end + 1);
  return new Response(body, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": full.headers.get("Content-Type") || "audio/mp4",
      "Content-Length": String(body.byteLength),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
    },
  });
}

/** Cache-first, and trim the store once it runs long. Used for the recordings. */
async function audioFirst(request) {
  const cache = await caches.open(AUDIO);

  // Key on the URL alone — the ?v= the app appends is its own cache-busting
  // version and belongs in the key, but the Range header must not be, or every
  // seek would be stored as a separate entry.
  const key = new Request(request.url);
  let full = await cache.match(key);

  if (!full) {
    try {
      // No Range on this one, so the server answers 200 with the whole file.
      const res = await fetch(key);
      if (!cacheable(res)) return res;
      await cache.put(key, res.clone());
      const keys = await cache.keys();
      if (keys.length > AUDIO_MAX) {
        // keys() comes back in insertion order, so the front is the oldest.
        await Promise.all(
          keys.slice(0, keys.length - AUDIO_MAX).map((k) => cache.delete(k))
        );
      }
      full = res;
    } catch {
      return Response.error();
    }
  }

  const range = request.headers.get("range");
  return range ? sliceRange(full, range) : full.clone();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/brahui/")) return;

  // Opening the app — from the launcher, a bookmark or a reload. Answer with the
  // document from cache when the network is gone, which is the offline case.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (cacheable(res)) {
            const cache = await caches.open(SHELL);
            cache.put(REQUIRED, res.clone());
          }
          return res;
        } catch {
          const cache = await caches.open(SHELL);
          return (
            (await cache.match(REQUIRED)) ||
            (await cache.match("./index.html")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/brahui/audio/")) {
    event.respondWith(audioFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, SHELL));
});
