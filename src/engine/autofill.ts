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

  modelBacked: boolean;
}


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
