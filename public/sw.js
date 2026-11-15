const VERSION = "agrorotate-offline-v3";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const MODEL_CACHE = "agrorotate-ai-models-v2";
const KEEP = new Set([SHELL_CACHE, RUNTIME_CACHE, MODEL_CACHE]);

const CORE_ASSETS = [
  "index.html",
  "models/agrorotate_surrogate_weights.json",
  "models/conformal_calibration.json",
  "models/model_manifest.json",
  "hero/hero-1.jpg",
  "hero/hero-2.jpg",
  "hero/hero-3.jpg",
  "sounds/click.wav",
  "sounds/resolve.wav",
  "sounds/type.wav",
  "sounds/whoosh.wav",
];

const META_KEY = "__offline_meta.json";

function scopeUrl(path) {
  return new URL(String(path).replace(/^\/+/, ""), self.registration.scope).href;
}

async function readManifest() {
  try {
    const response = await fetch(scopeUrl("precache-manifest.json"), { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}


async function precacheAll() {
  const cache = await caches.open(SHELL_CACHE);
  const manifest = await readManifest();
  const files = Array.from(
    new Set(
      [...CORE_ASSETS, ...((manifest && manifest.files) || [])].map(
        (file) => `/${String(file).replace(/^\/+/, "")}`,
      ),
    ),
  ).filter((file) => !file.endsWith("/sw.js"));

  // index.html must always be re-fetched: a cached shell can point at assets
  // from a previous deploy that are about to be pruned.
  const fetched = await Promise.all(
    files.map(async (file) => {
      const url = scopeUrl(file);
      const isDynamic = file === "/index.html" || file.startsWith("/models/");
      if (!isDynamic && (await cache.match(url))) return { url, response: null };
      try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (!response.ok) return null;
        return { url, response };
      } catch {
        return null;
      }
    }),
  );

  const failed = fetched.filter((item) => !item).length;

  // All-or-nothing: a partial snapshot would let a new shell reference files
  // that were never stored, which is exactly the offline white screen.
  if (failed > 0) {
    return { ok: false, failed, total: files.length, manifest };
  }

  for (const item of fetched) {
    if (item && item.response) await cache.put(item.url, item.response);
  }

  const keep = new Set(files.map(scopeUrl));
  const metaUrl = scopeUrl(META_KEY);
  for (const request of await cache.keys()) {
    if (request.url !== metaUrl && !keep.has(request.url)) {
      await cache.delete(request);
    }
  }

  const meta = {
    version: VERSION,
    total: files.length,
    failed: 0,
    manifestVersion: (manifest && manifest.version) || null,
    generatedAtIso: (manifest && manifest.generatedAtIso) || new Date().toISOString(),
    cachedAtIso: new Date().toISOString(),
  };
  await cache.put(
    metaUrl,
    new Response(JSON.stringify(meta), {
      headers: { "Content-Type": "application/json" },
    }),
  );
  return { ok: true, meta };
}






async function syncManifest() {
  const manifest = await readManifest();
  if (!manifest) return;
  const cache = await caches.open(SHELL_CACHE);
  const stored = await cache.match(scopeUrl(META_KEY));
  if (stored) {
    const meta = await stored.json().catch(() => null);
    if (meta && meta.manifestVersion === manifest.version && meta.failed === 0) return;
  }
  await precacheAll();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheAll().then((result) => {
      if (!result.ok) throw new Error(`precache incomplete: ${result.failed}/${result.total}`);
      return self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("agrorotate-") && !KEEP.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
      await syncManifest().catch(() => undefined);
    })(),
  );
});

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgroRotate — offline</title>
<style>body{font-family:system-ui,sans-serif;background:#060a07;color:#e8f5ec;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}p{max-width:46ch;line-height:1.6;color:#a7bcae}</style>
</head><body><main><h1>AgroRotate is ready offline</h1><p>This page was not cached yet. The field, soil, water and plan screens you already opened keep working without a connection.</p></main></body></html>`;

async function networkFirst(request, cacheName, fallbackPath) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await cache.match(scopeUrl(fallbackPath));
      if (fallback) return fallback;
    }
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("/precache-manifest.json")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, "index.html"));
    event.waitUntil(syncManifest().catch(() => undefined));
    return;
  }

  if (url.origin !== self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (url.pathname.startsWith("/models/")) {


    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/hero/") ||
    url.pathname.startsWith("/sounds/")
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }


  event.respondWith(networkFirst(request, SHELL_CACHE));
});

async function reportCacheStatus(port) {
  try {
    const names = (await caches.keys()).filter((name) => name.startsWith("agrorotate-"));
    let entries = 0;
    let bytes = 0;
    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      for (const request of requests) {

        if (request.url === scopeUrl(META_KEY)) continue;
        const response = await cache.match(request);
        if (!response) continue;
        entries += 1;
        const header = Number(response.headers.get("content-length"));
        if (Number.isFinite(header) && header > 0) {
          bytes += header;
        } else {
          try {
            bytes += (await response.clone().blob()).size;
          } catch {

          }
        }
      }
    }

    let precache = null;
    try {
      const meta = await (await caches.open(SHELL_CACHE)).match(scopeUrl(META_KEY));
      if (meta) precache = await meta.json();
    } catch {

    }

    port &&
      port.postMessage({
        type: "AGROTATE_CACHE_STATUS",
        supported: true,
        ready: true,
        entries,
        bytes,
        version: VERSION,
        precache,
      });
  } catch (error) {
    port &&
      port.postMessage({
        type: "AGROTATE_CACHE_STATUS",
        supported: true,
        ready: false,
        entries: 0,
        bytes: 0,
        version: VERSION,
        error: String(error),
      });
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "AGROTATE_CACHE_STATUS") {
    event.waitUntil(reportCacheStatus(event.ports && event.ports[0]));
    return;
  }
  if (data.type === "AGROTATE_PRECACHE_NOW") {
    event.waitUntil(precacheAll().catch(() => undefined));
  }
});
