/**
 * AgroRotate Web Worker for client-side crop-rotation optimization.
 *
 * Loads ONE artefact: the real-data surrogate trained by AI/pipeline
 * (`/models/agrorotate_surrogate_weights.json`). The old synthetic GRU, ONNX
 * and pred-contribution files are retired and are no longer fetched.
 *
 * The worker only keeps the UI thread free; all decision logic stays in
 * src/engine/optimizer.ts so the browser and the Node API share one contract.
 */

import {
  runBatchedOptimization,
  type OptimizationOptions,
  type SurrogateWeights,
} from "../engine/optimizer";
import type { WorkspaceState } from "../state/model";

const CACHE_NAME = "agrorotate-ai-models-v2";
const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
  ? import.meta.env.BASE_URL
  : "./"
).replace(/\/$/, "");
const WEIGHTS_URL = `${BASE_URL}/models/agrorotate_surrogate_weights.json`;

let surrogateWeights: SurrogateWeights | null = null;
let loadAttempted = false;

async function fetchWeights(): Promise<SurrogateWeights | null> {
  const parse = (text: string): SurrogateWeights | null => {
    try {
      return JSON.parse(text) as SurrogateWeights;
    } catch {
      return null;
    }
  };

  // Network-first: a freshly trained model must take effect on the next reload.
  // The cache is only the offline fallback.
  try {
    const response = await fetch(WEIGHTS_URL, { cache: "no-cache" });
    if (response.ok) {
      const text = await response.text();
      if (typeof caches !== "undefined") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(WEIGHTS_URL, new Response(text));
      }
      return parse(text);
    }
  } catch {
    // Offline: fall back to the last cached model.
  }

  try {
    if (typeof caches !== "undefined") {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(WEIGHTS_URL);
      if (cached?.ok) return parse(await cached.text());
    }
  } catch {
    // CacheStorage unavailable.
  }

  // Nothing loaded: the engine runs on the physical floor only.
  return null;
}

self.addEventListener("message", async (event: MessageEvent) => {
  const data = event.data;
  if (!data || data.type !== "OPTIMIZE_REQUEST") return;

  try {
    const workspace: WorkspaceState = data.workspace;
    if (!loadAttempted) {
      loadAttempted = true;
      surrogateWeights = await fetchWeights();
    }

    const options: OptimizationOptions = { surrogateWeights };
    const contract = runBatchedOptimization(workspace, options);
    self.postMessage({ type: "OPTIMIZE_SUCCESS", contract });
  } catch (error) {
    self.postMessage({
      type: "OPTIMIZE_ERROR",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
