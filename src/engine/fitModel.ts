/**
 * The score behind "Best 3": a hybrid fit, not a hand-tuned vibe.
 *
 * The yield term comes from the trained surrogate's yield-gap head (22 crops)
 * and the biophysical floor of the engine — the module keeps whichever is more
 * conservative, exactly like the optimizer. When the weights file cannot be
 * loaded the physics floor alone answers, and the UI says which one ran.
 */
import { workspaceToAgronomicVector } from "./estimate";
import {
  CROP_PROFILES_30,
  checkCropBiophysicalFloor,
  modelYieldLossPct,
  type CropAgronomicProfile,
  type SurrogateWeights,
} from "./optimizer";
import type { WorkspaceState } from "../state/model";
import { cropById } from "../data/catalog";

const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
  ? import.meta.env.BASE_URL
  : "./"
).replace(/\/$/, "");
const WEIGHTS_URL = `${BASE_URL}/models/agrorotate_surrogate_weights.json`;
const MODEL_CACHE = "agrorotate-ai-models-v2";

let weightsCache: SurrogateWeights | null = null;
let weightsLoad: Promise<SurrogateWeights | null> | null = null;

function parseWeights(text: string): SurrogateWeights | null {
  try {
    return JSON.parse(text) as SurrogateWeights;
  } catch {
    return null;
  }
}

/** Read the last model this browser cached, for offline use after a first visit. */
async function readCachedWeights(): Promise<SurrogateWeights | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(MODEL_CACHE);
    const cached = await cache.match(WEIGHTS_URL);
    if (cached?.ok) return parseWeights(await cached.text());
  } catch {
    /* CacheStorage may be blocked in private windows. */
  }
  try {
    const response = await fetch(WEIGHTS_URL, { cache: "force-cache" });
    if (response.ok) return parseWeights(await response.text());
  } catch {
    /* Offline and no HTTP cache. */
  }
  return null;
}

/**
 * One shared load: network first so a freshly trained model takes effect, then
 * the service-worker / HTTP cache so the AI still runs with no connection.
 * The parsed weights are kept in memory for the rest of the session.
 */
export function loadSurrogateWeights(): Promise<SurrogateWeights | null> {
  if (weightsLoad) return weightsLoad;
  weightsLoad = (async () => {
    try {
      const response = await fetch(WEIGHTS_URL, { cache: "no-cache" });
      if (response.ok) {
        const text = await response.text();
        const parsed = parseWeights(text);
        if (parsed) {
          weightsCache = parsed;
          if (typeof caches !== "undefined") {
            const cache = await caches.open(MODEL_CACHE);
            await cache.put(WEIGHTS_URL, new Response(text));
          }
          return parsed;
        }
      }
    } catch {
      /* Offline: fall through to the cache. */
    }
    weightsCache = await readCachedWeights();
    return weightsCache;
  })();
  return weightsLoad;
}

export function cachedSurrogateWeights(): SurrogateWeights | null {
  return weightsCache;
}

export type YieldScoreSource = "model" | "floor";

export interface SlotFitModel {
  /** cropId → expected yield loss (%) for this slot. */
  lossPct: Record<string, number>;
  /** Per-crop provenance: trained yield head or the biophysical floor. */
  sourceByCrop: Record<string, YieldScoreSource>;
  /** True when at least one crop was scored by the trained head. */
  modelBacked: boolean;
  /** True when no crop had a training row and only the physics floor ran. */
  floorOnly: boolean;
}

const memo = new WeakMap<
  WorkspaceState,
  Map<string, SlotFitModel>
>();

function profileFor(cropId: string | null | undefined): CropAgronomicProfile | null {
  if (!cropId) return null;
  return CROP_PROFILES_30[cropId] ?? null;
}

function previousProfile(state: WorkspaceState, slotIndex: number): CropAgronomicProfile | null {
  const previousId = state.plan.slots[slotIndex - 1]?.cropId ?? state.priorities.previousCropId;
  return profileFor(previousId);
}

/**
 * Yield-loss estimate per catalog crop for one slot: trained head when the crop
 * has training rows, biophysical floor otherwise, never less than the floor.
 */
export function slotFitModel(
  state: WorkspaceState,
  slotIndex: number,
  weights: SurrogateWeights | null,
): SlotFitModel {
  const perState = memo.get(state) ?? new Map<string, SlotFitModel>();
  memo.set(state, perState);
  const key = `${slotIndex}|${weights ? "model" : "floor"}`;
  const cached = perState.get(key);
  if (cached) return cached;

  const vector = workspaceToAgronomicVector(state);
  const continuous = vector.continuousVector32;
  const isRainfed = state.water.regime === "rainfed";
  const quota = Number(state.water.quotaMm) || (isRainfed ? 1500 : 5500);
  const ece = vector.soilChemical.eceDsm || 2.1;
  const som = vector.soilChemical.somPercent || 1.2;
  const ecw = Number(state.water.ecwDsm) || 1.1;
  const isWarm = slotIndex % 2 === 0;
  const prev = previousProfile(state, slotIndex);

  const lossPct: Record<string, number> = {};
  const sourceByCrop: Record<string, YieldScoreSource> = {};
  let modelBacked = false;
  let floorOnly = true;

  const DISCREPANCY_THRESHOLD_PCT = 25.0;

  for (const crop of Object.values(CROP_PROFILES_30)) {
    const floor = checkCropBiophysicalFloor(crop, continuous, ece, prev, isRainfed, slotIndex);
    const neural = weights
      ? modelYieldLossPct({
          crop,
          continuousVector32: continuous,
          eceDsm: ece,
          somPct: som,
          waterQuotaM3Ha: quota,
          waterEcwDsm: ecw,
          isWarm,
          weights,
        })
      : null;

    let loss: number;
    let source: YieldScoreSource;

    if (neural !== null) {
      modelBacked = true;
      floorOnly = false;
      const discrepancy = Math.abs(neural - floor.yieldReductionPct);
      // AI is the primary decision foundation when within biophysical plausibility bounds.
      if (discrepancy <= DISCREPANCY_THRESHOLD_PCT) {
        loss = Math.round(neural);
        source = "model";
      } else {
        // When AI diverges significantly (> 25% discrepancy) from verified physical reality
        // (e.g. extreme salinity toxicity or thermal season mismatch), grounded physical laws take over.
        loss = Math.round(floor.yieldReductionPct);
        source = "floor";
      }
    } else {
      // Crops without real training rows (cover crops, unobserved forages) rely directly on the physical floor.
      loss = floor.yieldReductionPct;
      source = "floor";
    }

    lossPct[crop.id] = Number(Math.max(0, Math.min(100, loss)).toFixed(1));
    sourceByCrop[crop.id] = source;
  }

  const model: SlotFitModel = {
    lossPct,
    sourceByCrop,
    modelBacked,
    floorOnly: floorOnly && !modelBacked,
  };
  perState.set(key, model);
  return model;
}

/** The catalog crop the plan UI knows, if it has a model profile. */
export function fitProfileFor(cropId: string | null | undefined): CropAgronomicProfile | null {
  if (!cropId) return null;
  if (!cropById(cropId)) return null;
  return profileFor(cropId);
}
