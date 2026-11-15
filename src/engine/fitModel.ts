import { workspaceToAgronomicVector } from "./estimate";
import { INPUT_SPECS, finiteOr, resolveNumericInput } from "./numericInput.ts";
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


async function readCachedWeights(): Promise<SurrogateWeights | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(MODEL_CACHE);
    const cached = await cache.match(WEIGHTS_URL);
    if (cached?.ok) return parseWeights(await cached.text());
  } catch {

  }
  try {
    const response = await fetch(WEIGHTS_URL, { cache: "force-cache" });
    if (response.ok) return parseWeights(await response.text());
  } catch {

  }
  return null;
}






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

  lossPct: Record<string, number>;

  sourceByCrop: Record<string, YieldScoreSource>;

  modelBacked: boolean;

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


  const quota = resolveNumericInput(
    state.water.quotaMm,
    INPUT_SPECS.waterQuotaMm,
    isRainfed ? 1500 : 5500,
  ).value;
  const ece = finiteOr(vector.soilChemical.eceDsm, 2.1);
  const som = finiteOr(vector.soilChemical.somPercent, 1.2);
  const ecw = resolveNumericInput(
    state.water.ecwDsm,
    INPUT_SPECS.waterEcwDsm,
    1.1,
  ).value;
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

      if (discrepancy <= DISCREPANCY_THRESHOLD_PCT) {
        loss = Math.round(neural);
        source = "model";
      } else {


        loss = Math.round(floor.yieldReductionPct);
        source = "floor";
      }
    } else {

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


export function fitProfileFor(cropId: string | null | undefined): CropAgronomicProfile | null {
  if (!cropId) return null;
  if (!cropById(cropId)) return null;
  return profileFor(cropId);
}
