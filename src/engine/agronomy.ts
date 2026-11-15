import { CROP_CATALOG, cropById, type CatalogCrop } from "../data/catalog";
import { OBSERVATIONS } from "../data/observations";
import { SALINITY_CHECK_BY_CROP } from "../data/evidence/verification";
import { SLOT_META, type WorkspaceState } from "../state/model";
import type { SlotFitModel } from "./fitModel";

export type Severity = "conflict" | "caution" | "info";
export type Verdict = "open" | "caution" | "conflict";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface Dimension {
  key: string;
  label: string;
  status: "assessed" | "partial" | "unassessed";
  detail: string;
}

export interface SalinityResult {
  state: "no_ec" | "no_threshold" | "below" | "above";
  relativeYieldPct: number | null;
  thresholdDsm: number | null;
  slopePctPerDsm: number | null;

  endpoint: string | null;
  detail: string;
}

export interface SlotEvaluation {
  verdict: Verdict;
  findings: Finding[];
  dimensions: Dimension[];
  salinity: SalinityResult;
  assessedCount: number;
  unassessedCount: number;
}

export function parseNum(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function measuredEce(state: WorkspaceState): number | null {
  return parseNum(state.soil.lab.eceDsm);
}

export function salinityAssessment(
  crop: CatalogCrop,
  eceDsm: number | null,
): SalinityResult {
  const check = SALINITY_CHECK_BY_CROP[crop.name];
  const endpoint = check?.endpoint ?? null;
  if (eceDsm === null) {
    return {
      state: "no_ec",
      relativeYieldPct: null,
      thresholdDsm: crop.salinityLimitDsm,
      slopePctPerDsm: crop.salinitySlopePercentPerDsm,
      endpoint,
      detail:
        "No saturated-paste ECe was entered for this field, so salinity cannot be assessed.",
    };
  }
  if (crop.salinityLimitDsm === null || crop.salinitySlopePercentPerDsm === null) {
    return {
      state: "no_threshold",
      relativeYieldPct: null,
      thresholdDsm: null,
      slopePctPerDsm: null,
      endpoint,
      detail: `No source-supported salinity threshold is attached for ${crop.name} yet, so the check stays qualitative rather than guessing a number.`,
    };
  }
  const threshold = crop.salinityLimitDsm;
  const slope = crop.salinitySlopePercentPerDsm;
  if (eceDsm <= threshold) {
    return {
      state: "below",
      relativeYieldPct: 100,
      thresholdDsm: threshold,
      slopePctPerDsm: slope,
      endpoint,
      detail: `Measured ECe ${eceDsm.toFixed(2)} dS/m is at or below the FAO threshold of ${threshold.toFixed(1)} dS/m. No salinity yield penalty is expected on the FAO curve${
        endpoint ? ` for ${endpoint.toLowerCase()}` : ""
      }.`,
    };
  }
  const relativeYield = Math.max(0, Math.min(100, 100 - slope * (eceDsm - threshold)));
  return {
    state: "above",
    relativeYieldPct: relativeYield,
    thresholdDsm: threshold,
    slopePctPerDsm: slope,
    endpoint,
    detail: `Measured ECe ${eceDsm.toFixed(2)} dS/m is ${(eceDsm - threshold).toFixed(2)} dS/m above the FAO threshold of ${threshold.toFixed(1)} dS/m. At ${slope.toFixed(1)} %/dS/m that is an estimated relative yield of ${relativeYield.toFixed(0)}%${
      endpoint ? ` for the tabulated endpoint (${endpoint.toLowerCase()})` : " for the tabulated endpoint"
    }.`,
  };
}


export function textureClassFromFractions(
  sand: number,
  silt: number,
  clay: number,
): string {
  const classes: [string, number, number, number][] = [
    ["Sand", 85, 10, 5],
    ["Loamy sand", 80, 15, 5],
    ["Sandy loam", 65, 25, 10],
    ["Loam", 40, 40, 20],
    ["Silt loam", 20, 65, 15],
    ["Silt", 8, 87, 5],
    ["Sandy clay loam", 60, 20, 20],
    ["Clay loam", 32, 33, 35],
    ["Silty clay loam", 10, 55, 35],
    ["Sandy clay", 52, 8, 40],
    ["Silty clay", 6, 46, 48],
    ["Clay", 22, 22, 56],
  ];
  let best = classes[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of classes) {
    const distance =
      (sand - candidate[1]) ** 2 + (silt - candidate[2]) ** 2 + (clay - candidate[3]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best[0];
}

export function previousCropForSlot(
  state: WorkspaceState,
  index: number,
): CatalogCrop | null {
  if (index === 0) return cropById(state.priorities.previousCropId);
  return cropById(state.plan.slots[index - 1]?.cropId ?? null);
}

export function nextCropForSlot(
  state: WorkspaceState,
  index: number,
): CatalogCrop | null {
  return cropById(state.plan.slots[index + 1]?.cropId ?? null);
}

export function evaluateSlot(state: WorkspaceState, index: number): SlotEvaluation | null {
  const slot = state.plan.slots[index];
  const crop = cropById(slot?.cropId ?? null);
  if (!crop) return null;

  const findings: Finding[] = [];
  const dimensions: Dimension[] = [];
  const ece = measuredEce(state);
  const salinity = salinityAssessment(crop, ece);
  const previous = previousCropForSlot(state, index);
  const next = nextCropForSlot(state, index);
  const slotMeta = SLOT_META[index];


  if (state.priorities.excluded[crop.id]) {
    findings.push({
      id: "excluded",
      severity: "conflict",
      title: "Excluded by your own constraint",
      detail: `You excluded ${crop.name}: ${
        state.priorities.excluded[crop.id] || "no reason recorded"
      }. It is kept in the plan only because you placed it here.`,
    });
  }


  if (salinity.state === "above" && salinity.relativeYieldPct !== null) {
    const severe = salinity.relativeYieldPct < 50;
    findings.push({
      id: "salinity",
      severity: severe ? "conflict" : "caution",
      title: severe
        ? "Measured salinity implies a large estimated yield loss"
        : "Measured salinity exceeds the FAO threshold",
      detail: salinity.detail,
    });
  }



  const endpointCheck = SALINITY_CHECK_BY_CROP[crop.name];
  if (salinity.state === "above" && endpointCheck?.endpointCaveat) {
    findings.push({
      id: "salinity-endpoint",
      severity: "info",
      title: "The FAO salinity endpoint is not the harvested product",
      detail: endpointCheck.endpointCaveat,
    });
  }
  dimensions.push({
    key: "salinity",
    label: "Salinity response",
    status:
      salinity.state === "below" || salinity.state === "above"
        ? "assessed"
        : salinity.state === "no_ec"
          ? "unassessed"
          : "partial",
    detail:
      salinity.state === "no_threshold"
        ? "No source-scoped threshold for this species."
        : salinity.detail,
  });


  if (previous && previous.id !== crop.id && previous.family === crop.family) {
    findings.push({
      id: "family-repeat",
      severity: "caution",
      title: "Same botanical family as the previous season",
      detail: `${previous.name} and ${crop.name} are both ${crop.family}. Crops in one family often share pests, diseases and nutrient traits, which erodes the rotation break. The planner flags the repetition; return intervals are calibrated per pathogen and host.`,
    });
  }
  dimensions.push({
    key: "family",
    label: "Family break",
    status: previous ? "assessed" : "partial",
    detail: previous
      ? `Previous season: ${previous.name} (${previous.family}).`
      : "No previous crop is recorded, so the break cannot be assessed for the first season.",
  });


  if (slotMeta) {
    const expected = slotMeta.season;
    if (crop.season !== expected) {
      findings.push({
        id: "season",
        severity: "caution",
        title: "Season convention does not match this slot",
        detail: `${crop.name} is filed as a ${crop.season === "cool" ? "cool" : "warm"}-season crop, while this slot is the ${expected === "cool" ? "cool" : "warm"} season. Confirm the planting window in the FAO Crop Calendar for Egypt before committing.`,
      });
    }
    dimensions.push({
      key: "calendar",
      label: "Planting window",
      status: "partial",
      detail: `Filed season: ${crop.seasonRaw ?? "not recorded"}. The record-level FAO Crop Calendar entry for Egypt is being captured alongside this convention.`,
    });
  }

  dimensions.push({
    key: "pathogens",
    label: "Pathogen break",
    status: "unassessed",
    detail:
      "No diagnosis input exists in this build, so no break claim is made either way.",
  });


  if (next && next.family === crop.family) {
    findings.push({
      id: "family-forward",
      severity: "info",
      title: "The following season repeats this family",
      detail: `${next.name} follows in the next slot and is also ${crop.family}. If you intend a family break, move one of the two.`,
    });
  }


  dimensions.push({
    key: "water",
    label: "Crop water demand",
    status: "unassessed",
    detail:
      "Water demand is computed as ETc = Kc × ETo with live FAO-56 ETo from NASA POWER; stage-based Kc is calibrated locally per crop and season.",
  });
  dimensions.push({
    key: "nutrients",
    label: "N / P / K fit",
    status: "unassessed",
    detail:
      "Critical Olsen-P, exchangeable-K and N-credit values are calibrated locally. Compare your lab results with local critical levels alongside the plan.",
  });
  dimensions.push({
    key: "physical",
    label: "Texture / pH / lime limits",
    status: "unassessed",
    detail:
      "Max clay, optimal pH, lime and drainage limits are calibrated per field and stay visible in the crop library with their source-attachment status.",
  });

  const hasConflict = findings.some((f) => f.severity === "conflict");
  const hasCaution = findings.some((f) => f.severity === "caution");
  const verdict: Verdict = hasConflict ? "conflict" : hasCaution ? "caution" : "open";

  return {
    verdict,
    findings,
    dimensions,
    salinity,
    assessedCount: dimensions.filter((d) => d.status === "assessed").length,
    unassessedCount: dimensions.filter((d) => d.status === "unassessed").length,
  };
}

export interface Alternative {
  crop: CatalogCrop;
  salinity: SalinityResult;
  breaksFamily: boolean | null;
  seasonMatch: boolean;
  reasons: string[];
  blockedByUser: boolean;

  yieldLossPct: number | null;

  yieldSource: "model" | "floor" | null;

  fitScore: number;
}





export function alternativeCrops(
  state: WorkspaceState,
  index: number,
  limit = 8,
  fit?: SlotFitModel | null,
): Alternative[] {
  const current = cropById(state.plan.slots[index]?.cropId ?? null);
  const previous = previousCropForSlot(state, index);
  const ece = measuredEce(state);
  const slotMeta = SLOT_META[index];
  const excluded = state.priorities.excluded;

  const candidates = CROP_CATALOG.filter(
    (crop) => crop.id !== current?.id && !excluded[crop.id],
  ).map((crop) => {
    const salinity = salinityAssessment(crop, ece);
    const breaksFamily = previous ? crop.family !== previous.family : null;
    const seasonMatch = slotMeta ? crop.season === slotMeta.season : true;
    const reasons: string[] = [];
    if (breaksFamily) reasons.push(`Breaks the ${previous?.family} sequence`);
    if (salinity.state === "below") reasons.push("Below its FAO salinity threshold");
    if (salinity.state === "no_threshold")
      reasons.push("Salinity threshold in attachment — unassessed");
    if (seasonMatch) reasons.push("Filed in this season convention");
    if (crop.family === "Fabaceae")
      reasons.push("Legume rotation candidate (pooled evidence, S26)");
    if (crop.isCoverCrop) reasons.push("Cover / forage option");
    return { crop, salinity, breaksFamily, seasonMatch, reasons, blockedByUser: false };
  });

  const priority = state.priorities;
  const usedFamilies = plantedFamilies(state);

  const scored = candidates.map((alt) => {
    const yieldLossPct = fit ? (fit.lossPct[alt.crop.id] ?? null) : null;
    return {
      ...alt,
      yieldLossPct,
      yieldSource: fit ? (fit.sourceByCrop[alt.crop.id] ?? null) : null,
      fitScore: scoreAlternative(priority, usedFamilies, alt, yieldLossPct, {
        waterSystem: state.water?.system,
        caco3Pct: Number(state.soil?.lab?.caco3Pct),
        espPct: Number(state.soil?.lab?.espPct),
      }),
    };
  });

  return scored
    .sort((a, b) => {
      const delta = b.fitScore - a.fitScore;
      if (delta !== 0) return delta;
      return a.crop.name.localeCompare(b.crop.name);
    })
    .slice(0, limit);
}

function plantedFamilies(state: WorkspaceState): Set<string> {
  return new Set(
    state.plan.slots
      .map((slot) => cropById(slot.cropId))
      .filter((planted): planted is CatalogCrop => !!planted)
      .map((planted) => planted.family),
  );
}












export function scoreAlternative(
  priority: WorkspaceState["priorities"],
  usedFamilies: Set<string>,
  alt: Pick<Alternative, "crop" | "salinity" | "breaksFamily" | "seasonMatch">,
  yieldLossPct?: number | null,
  context?: {
    waterSystem?: string;
    caco3Pct?: number;
    espPct?: number;
  },
): number {
  let yieldScore =
    yieldLossPct === undefined || yieldLossPct === null
      ? 55
      : Math.max(0, Math.min(100, 100 - yieldLossPct));


  if ((context?.caco3Pct ?? 0) > 12 && ["potato", "sweet-potato", "sesame", "bulb-onion", "flax-linseed"].includes(alt.crop.id)) {
    yieldScore = Math.max(10, yieldScore - 15);
  }
  if ((context?.espPct ?? 0) > 12 && !["six-row-barley", "sugar-beet", "berseem-clover-multi-cut"].includes(alt.crop.id)) {
    yieldScore = Math.max(10, yieldScore - 15);
  }

  let waterScore = alt.seasonMatch ? 100 : 30;
  if (alt.crop.isCoverCrop) waterScore = Math.min(100, waterScore + 5);

  let soilScore = alt.breaksFamily ? 100 : alt.breaksFamily === false ? 40 : 70;
  if (alt.crop.family === "Fabaceae") soilScore = Math.min(100, soilScore + 10);
  if (usedFamilies.has(alt.crop.family)) soilScore = Math.max(0, soilScore - 20);

  let riskScore =
    alt.salinity.state === "below"
      ? 100
      : alt.salinity.state === "above"
        ? 15
        : alt.salinity.state === "no_threshold"
          ? 55
          : 70;

  if (context?.waterSystem === "sprinkler" && ["potato", "processing-tomato", "bulb-onion"].includes(alt.crop.id)) {
    riskScore = Math.max(10, riskScore - 15);
  }

  const w = priority.weights ?? { yield: 3, water: 3, soil: 3, risk: 3 };
  const sum = (w.yield ?? 3) + (w.water ?? 3) + (w.soil ?? 3) + (w.risk ?? 3) || 12;
  const blended =
    ((w.yield ?? 3) * yieldScore +
      (w.water ?? 3) * waterScore +
      (w.soil ?? 3) * soilScore +
      (w.risk ?? 3) * riskScore) /
    sum;
  return Math.max(5, Math.min(99, Math.round(blended)));
}


export function cropFitScore(
  state: WorkspaceState,
  index: number,
  fit?: SlotFitModel | null,
): number | null {
  const crop = cropById(state.plan.slots[index]?.cropId ?? null);
  if (!crop) return null;
  const previous = previousCropForSlot(state, index);
  const salinity = salinityAssessment(crop, measuredEce(state));
  const slotMeta = SLOT_META[index];
  const breaksFamily = previous ? crop.family !== previous.family : null;
  const seasonMatch = slotMeta ? crop.season === slotMeta.season : true;
  return scoreAlternative(
    state.priorities,
    plantedFamilies(state),
    {
      crop,
      salinity,
      breaksFamily,
      seasonMatch,
    },
    fit ? (fit.lossPct[crop.id] ?? null) : null,
    {
      waterSystem: state.water?.system,
      caco3Pct: Number(state.soil?.lab?.caco3Pct),
      espPct: Number(state.soil?.lab?.espPct),
    },
  );
}

export interface PlanCoverage {
  filled: number;
  salinityAssessable: number;
  familyRepeats: number;
  conflicts: number;
  cautions: number;
  verifiedCrops: number;
  observationsRecorded: number;
  labFieldsRecorded: number;
}

export function planCoverage(state: WorkspaceState): PlanCoverage {
  const filledSlots = state.plan.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.cropId);

  let salinityAssessable = 0;
  let familyRepeats = 0;
  let conflicts = 0;
  let cautions = 0;

  for (const { index } of filledSlots) {
    const evaluation = evaluateSlot(state, index);
    if (!evaluation) continue;
    if (
      evaluation.salinity.state === "below" ||
      evaluation.salinity.state === "above"
    )
      salinityAssessable += 1;
    if (evaluation.findings.some((f) => f.id === "family-repeat")) familyRepeats += 1;
    if (evaluation.verdict === "conflict") conflicts += 1;
    if (evaluation.verdict === "caution") cautions += 1;
  }

  const labFields = Object.entries(state.soil.lab).filter(
    ([, value]) => typeof value === "string" && value.trim() !== "",
  ).length;

  const chosen = filledSlots
    .map(({ slot }) => cropById(slot.cropId))
    .filter((crop): crop is CatalogCrop => Boolean(crop));

  return {
    filled: filledSlots.length,
    salinityAssessable,
    familyRepeats,
    conflicts,
    cautions,
    verifiedCrops: chosen.filter((crop) => crop.salinityLimitDsm !== null).length,
    observationsRecorded: Object.values(state.soil.observations).filter(Boolean).length,
    labFieldsRecorded: labFields,
  };
}

export function setupCompleteness(state: WorkspaceState) {


  const fieldOk = (state.field.areaHa ?? 0) > 0 && state.field.boundary.length >= 3;
  const soilOk =
    Object.values(state.soil.observations).filter(Boolean).length > 0 ||
    measuredEce(state) !== null;



  const waterOk = Boolean(
    state.water.regime === "rainfed" ||
    state.water.source === "rain" ||
    state.water.system === "none" ||
    state.water.ecwDsm.trim() ||
    state.water.quotaMm.trim() ||
    (state.water.regime !== null && state.water.source !== null)
  );
  const defaultWeights = { yield: 3, water: 3, soil: 3, risk: 3 };
  const prioritiesOk =
    Boolean(state.priorities.previousCropId) ||
    Object.keys(state.priorities.excluded).length > 0 ||
    state.priorities.preset !== null ||
    Object.entries(defaultWeights).some(
      ([key, value]) =>
        state.priorities.weights[key as keyof typeof defaultWeights] !== value,
    );
  const historyOk = Boolean(state.priorities.previousCropId);
  return {
    field: fieldOk,
    soil: soilOk,
    water: waterOk,
    priorities: prioritiesOk,
    history: historyOk,
    score: [fieldOk, soilOk, waterOk, prioritiesOk].filter(Boolean).length,
  };
}

export const OBSERVATION_COUNT = OBSERVATIONS.length;
