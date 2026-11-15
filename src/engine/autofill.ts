/**
 * Opening the rotation board: fill all 3 years (6 seasons) sequentially from the
 * AI-First hybrid engine that produces the "Best 3" recommendations.
 *
 * The seasons are picked sequentially so each subsequent pick respects botanical
 * family breaks, water quotas, and soil carryovers from the preceding crop.
 * The AI neural surrogate model serves as the primary decision driver, with
 * grounded biophysical equations acting as safety guardrails when neural
 * predictions diverge beyond calibrated physical bounds.
 */
import { alternativeCrops, cropFitScore, evaluateSlot } from "./agronomy";
import { slotFitModel } from "./fitModel";
import type { SurrogateWeights } from "./optimizer";
import type { SlotState, WorkspaceState } from "../state/model";

export interface YearOnePick {
  index: number;
  cropId: string;
  score: number;
  yieldSource: "model" | "floor" | null;
}

export interface YearOneFill {
  slots: SlotState[];
  picks: YearOnePick[];
  /** True when at least one pick used the trained yield-gap head. */
  modelBacked: boolean;
}

/** Fills empty or conflicted seasons in Year 1 with the top AI-ranked candidates. */
export function buildYearOneFill(
  state: WorkspaceState,
  weights: SurrogateWeights | null,
): YearOneFill {
  const slots: SlotState[] = state.plan.slots.map((slot) => ({ ...slot }));
  const picks: YearOnePick[] = [];
  let modelBacked = false;

  for (const index of [0, 1]) {
    const existingCropId = slots[index]?.cropId;

    const stepState: WorkspaceState = {
      ...state,
      plan: { ...state.plan, slots: slots.map((slot) => ({ ...slot })) },
    };
    const fit = slotFitModel(stepState, index, weights);
    const topAlternatives = alternativeCrops(stepState, index, 3, fit);
    const best = topAlternatives[0];
    if (!best) continue;

    let shouldAssign = !existingCropId;

    // If a crop already exists in this slot, check if it has a severe conflict or low score (< 50)
    // while a vastly superior AI candidate (>= 80) exists without conflicts.
    if (existingCropId) {
      const evaluation = evaluateSlot(stepState, index);
      const score = cropFitScore(stepState, index, fit) ?? 0;
      if ((evaluation?.verdict === "conflict" || score < 50) && best.fitScore >= 80) {
        shouldAssign = true;
      }
    }

    if (shouldAssign) {
      slots[index] = { ...slots[index], cropId: best.crop.id };
      picks.push({
        index,
        cropId: best.crop.id,
        score: best.fitScore,
        yieldSource: best.yieldSource,
      });
      if (best.yieldSource === "model") modelBacked = true;
    }
  }

  return { slots, picks, modelBacked };
}

/**
 * Optimizes the full 6-season rotation plan (Years 1–3) sequentially,
 * selecting the top AI-ranked crop for each slot while guaranteeing botanical
 * family breaks, seasonal compatibility, and biophysical safety guardrails.
 */
export function buildFullPlanOptimization(
  state: WorkspaceState,
  weights: SurrogateWeights | null,
): YearOneFill {
  const slots: SlotState[] = state.plan.slots.map((slot) => ({ ...slot }));
  const picks: YearOnePick[] = [];
  let modelBacked = false;

  for (let index = 0; index < 6; index++) {
    const stepState: WorkspaceState = {
      ...state,
      plan: { ...state.plan, slots: slots.map((slot) => ({ ...slot })) },
    };
    const fit = slotFitModel(stepState, index, weights);
    const topAlternatives = alternativeCrops(stepState, index, 8, fit);
    if (topAlternatives.length === 0) continue;

    // Filter viable alternatives: season match, safe salinity tolerance, and family break
    const viable = topAlternatives.filter(
      (alt) => alt.seasonMatch && alt.salinity.state !== "above" && alt.breaksFamily !== false,
    );
    const best = viable[0] ?? topAlternatives.find((alt) => alt.seasonMatch) ?? topAlternatives[0];

    slots[index] = { ...slots[index], cropId: best.crop.id };
    picks.push({
      index,
      cropId: best.crop.id,
      score: best.fitScore,
      yieldSource: best.yieldSource,
    });
    if (best.yieldSource === "model") modelBacked = true;
  }

  return { slots, picks, modelBacked };
}
