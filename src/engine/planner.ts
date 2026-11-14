import type { SlotState, WorkspaceState } from "../state/model";

/**
 * AgroRotate — Rotation Engine & AI Contract Bridge
 *
 * Automated heuristic recommendation algorithms have been removed in favor of the
 * 32-dimensional NormalizedAgronomicVector and AI Input/Output Contract.
 * The core biophysical constraints (Biophysical Floor & PTFs) govern slot validation.
 */

export interface EngineSlotDecision {
  index: number;
  label: string;
  cropId: string | null;
  cropName: string;
  verdict: "open" | "caution" | "conflict" | null;
  reasons: string[];
  cautions: string[];
}

export interface EnginePlan {
  slots: SlotState[];
  decisions: EngineSlotDecision[];
}

export function planIsEmpty(state: WorkspaceState): boolean {
  return state.plan.slots.every((slot) => !slot.cropId);
}
