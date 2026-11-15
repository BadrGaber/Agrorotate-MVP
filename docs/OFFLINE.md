# Offline cache and first-load download

AgroRotate is a browser-only decision-support app. The production build ships a
service worker (`public/sw.js`) and a build-generated `precache-manifest.json`.
Together they download the complete working app on the first visit and serve it
from Cache Storage afterwards, with no connection.

## What is downloaded on first open

Measured from the production build in this workspace (`npm run build`, then
`npm run audit:offline`):

| Group | Contents | Files | Size (uncompressed) |
| --- | --- | ---: | ---: |
| App shell | `index.html`, `assets/index-*.js`, `assets/index-*.css` | 3 | ~ 1.08 MB |
| Lazy pages | Crops, Evidence, Method, Sources, Preview, Landing | 6 | ~ 65 KB |
| AI worker | `assets/aiOptimizer.worker-*.js` | 1 | ~ 60 KB |
| AI model | `models/agrorotate_surrogate_weights.json` (real-v1) | 1 | ~ 102 KB |
| Model metadata | `models/conformal_calibration.json`, `models/model_manifest.json` | 2 | ~ 1 KB |
| Media | 3 hero images + 4 interface sounds | 7 | ~ 417 KB |
| **Total** | | **20** | **~ 1.66 MB** |

The transfer size is smaller because the server compresses JS/CSS (the main
bundle is ~ 266 KB gzip). The numbers above are what the service worker stores
for offline use. Run `npm run audit:offline` for the exact current build.

## How it works

1. `src/main.tsx` registers `sw.js` after the page loads, and starts
   `loadSurrogateWeights()` in parallel so the model is ready before the farmer
   reaches the plan.
2. The worker's install step reads `precache-manifest.json`, fetches every listed
   file plus its own core list (app shell, model, sounds, hero images) and stores
   them in `agrorotate-offline-v1-shell`. Files from older builds are pruned in
   the same pass, so the cache stays at the current build size and does not grow
   on every deploy.
3. On each navigation the worker compares the manifest version with the stored
   copy and downloads any new files (and prunes old ones), so a rebuild does not
   leave the cache on the previous hashes.
4. Later visits: navigations are network-first with an `index.html` fallback; the
   model is network-first so a retrained model takes effect, then falls back to
   cache; hashed assets/media are cache-first; external map tiles and API GETs
   use stale-while-revalidate.
5. The workspace itself is already saved in `localStorage` under
   `agrorotate.v6.workspace`.

### Development vs production

`npm run dev` has no `precache-manifest.json`, so the worker caches the core
files plus whatever modules the page requests. Full first-load coverage of every
lazy page needs the production build: run `npm run build`, then `npm run preview`
(or host the `dist/` folder). That is the offline-capable deployment.

## What works offline

- Every page and lazy chunk: landing, field, soil, water, priorities, plan,
  crops, evidence, method, sources.
- The rotation board, Best 3 scores and the auto-filled Year 1.
- AI inference: the model is a pure-JavaScript MLP (`40->64->32->4`), so no network
  is needed once the weights are cached.
- The last cached API response (NASA POWER context, geocode, SoilGrids) is shown
  if a request fails.

## What still needs a connection

- A fresh NASA POWER request, external map/imagery tiles, and the optional local
  API (`server/index.mjs`). Their cached responses remain available.
- A browser with service workers disabled keeps working online; the workspace
  still persists in `localStorage`.

## Verifying

```bash
npm run build
npm run audit:offline
npm run typecheck
npm test
```

To inspect the cache from the running app, open `#/method`; the
"Offline, cache and first-load download" card reads the active worker's file
count and byte size. The same card can request a re-check. That live number also
counts cached API responses and the model's local copy, so it can be larger than
the 1.66 MB first-load payload in the table above.
