#!/usr/bin/env node
/**
 * Differential audit: does changing one input change the decision?
 *
 * It calls the same optimizeWorkspace the /api/v1/optimize endpoint uses, with a
 * fixed baseline field, and re-runs it once per input with a realistic low/high
 * pair. If the four Pareto solutions are identical, that input does not reach the
 * decision and the UI must not say it does.
 *
 * Run: node scripts/audit-decision-sensitivity.mjs
 */
import { optimizeWorkspace } from "../server/ai/optimizer.mjs";

const base = () => ({
  field: { name: "Audit", centroidLat: 30.8, centroidLon: 31.2, slopeClass: "flat", elevationM: 10 },
  soil: {
    lab: {
      sandPct: "32", siltPct: "38", clayPct: "30", bulkDensity: "1.35", ph: "7.9",
      eceDsm: "3.5", espPct: "6", caco3Pct: "6", socPct: "1.1", cec: "24",
      no3nPpm: "18", olsenPPpm: "12", exchangeableKPpm: "150",
    },
    observations: {},
    estimates: {},
    diagnosedPathogens: [],
  },
  water: {
    regime: "full_irrigation", system: "drip", source: "groundwater",
    quotaMm: "5800", ecwDsm: "1.2", sarw: "4", no3nPpm: "6",
  },
  climate: {
    status: "ready", source: "NASA_POWER",
    summary: {
      days: 365, startDate: "2025-01-01", endDate: "2025-12-31",
      meanTmaxC: 31, meanTminC: 17, annualPrecipMm: 45, etoAnnualMm: 1900,
      latitude: 30.8, longitude: 31.2, elevationM: 10,
      summer: { tmaxC: 36, tminC: 22, rainMm: 0, etoMm: 900, days: 120 },
      winter: { tmaxC: 22, tminC: 10, rainMm: 40, etoMm: 400, days: 120 },
      monthly: [], heatDays35: 30, dryDays: 300, frostDays: 0,
    },
  },
  priorities: { preset: "balanced", weights: { yield: 0.35, water: 0.25, soil: 0.25, risk: 0.15 }, excluded: {}, previousCropId: "bread-wheat" },
  plan: { title: "Audit", cycle: 1, slots: [] },
});

function signature(ws) {
  const out = optimizeWorkspace(ws);
  return JSON.stringify(
    out.paretoSolutions.map((s) => ({
      id: s.id,
      profit: s.projectedNetReturnScore,
      water: s.waterSavingScore,
      soil: s.soilHealthScore,
      slots: s.slots.map((x) => [x.cropId, Math.round(x.yieldReductionPercent)]),
    })),
  );
}

// The search uses Math.random, so every comparison is repeated with the same
// seeds on both variants; otherwise every run would look like a change.
const SEEDS = [1, 2, 3, 4, 5];
function mulberry32(a) {
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededSignature(ws, seed) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try {
    return signature(ws);
  } finally {
    Math.random = original;
  }
}
const sigsFor = (ws) => SEEDS.map((seed) => seededSignature(ws, seed));
const sameSigs = (a, b) => a.every((sig, i) => sig === b[i]);

const baseSigs = sigsFor(base());

const CASES = [
  ["soil.lab.eceDsm", (w, v) => { w.soil.lab.eceDsm = v; }, "1", "14"],
  ["soil.lab.espPct", (w, v) => { w.soil.lab.espPct = v; }, "1", "25"],
  ["soil.lab.caco3Pct", (w, v) => { w.soil.lab.caco3Pct = v; }, "1", "30"],
  ["soil.lab.ph", (w, v) => { w.soil.lab.ph = v; }, "5.5", "9"],
  ["soil.lab.socPct", (w, v) => { w.soil.lab.socPct = v; }, "0.3", "3"],
  ["soil.lab.cec", (w, v) => { w.soil.lab.cec = v; }, "6", "50"],
  ["soil.lab.bulkDensity", (w, v) => { w.soil.lab.bulkDensity = v; }, "1.1", "1.7"],
  ["soil.lab.sandPct", (w, v) => { w.soil.lab.sandPct = v; w.soil.lab.clayPct = v === "70" ? "10" : "55"; }, "70", "15"],
  ["soil.lab.no3nPpm", (w, v) => { w.soil.lab.no3nPpm = v; }, "3", "90"],
  ["soil.lab.olsenPPpm", (w, v) => { w.soil.lab.olsenPPpm = v; }, "2", "60"],
  ["soil.lab.exchangeableKPpm", (w, v) => { w.soil.lab.exchangeableKPpm = v; }, "30", "500"],
  ["water.quotaMm", (w, v) => { w.water.quotaMm = v; }, "1500", "12000"],
  ["water.ecwDsm", (w, v) => { w.water.ecwDsm = v; }, "0.3", "5"],
  ["water.sarw", (w, v) => { w.water.sarw = v; }, "1", "25"],
  ["water.no3nPpm", (w, v) => { w.water.no3nPpm = v; }, "1", "50"],
  ["water.regime", (w, v) => { w.water.regime = v; }, "rainfed", "full_irrigation"],
  ["water.system", (w, v) => { w.water.system = v; }, "surface", "drip"],
  ["climate.etoAnnualMm", (w, v) => { w.climate.summary.etoAnnualMm = Number(v); }, "1100", "2600"],
  ["climate.heatDays35", (w, v) => { w.climate.summary.heatDays35 = Number(v); }, "2", "95"],
  ["climate.annualPrecipMm", (w, v) => { w.climate.summary.annualPrecipMm = Number(v); }, "15", "900"],
  ["field.slopeClass", (w, v) => { w.field.slopeClass = v; }, "flat", "steep"],
  ["field.elevationM", (w, v) => { w.field.elevationM = Number(v); }, "2", "900"],
  ["priorities.weights[yield=1]", (w) => { w.priorities.weights = { yield: 1, water: 0, soil: 0, risk: 0 }; }, null, null],
  ["priorities.weights[water=1]", (w) => { w.priorities.weights = { yield: 0, water: 1, soil: 0, risk: 0 }; }, null, null],
  ["priorities.weights[soil=1]", (w) => { w.priorities.weights = { yield: 0, water: 0, soil: 1, risk: 0 }; }, null, null],
  ["priorities.previousCropId", (w, v) => { w.priorities.previousCropId = v; }, "grain-maize", "berseem-clover-multi-cut"],
  ["priorities.excluded", (w) => { w.priorities.excluded = { "grain-maize": "user exclusion" }; }, null, null],
];

// Longer, independent scenarios that must also matter.
function compare(label, mutate) {
  const ws = base();
  mutate(ws);
  const changed = !sameSigs(sigsFor(ws), baseSigs);
  console.log(`${changed ? "changes   " : "NO EFFECT "} ${label}`);
  return changed;
}

let insensitive = 0;
for (const [label, set, low, high] of CASES) {
  if (low === null) {
    if (!compare(`${label} (set)`, (w) => set(w))) insensitive += 1;
    continue;
  }
  const w1 = base(); set(w1, low);
  const w2 = base(); set(w2, high);
  const s1 = sigsFor(w1);
  const s2 = sigsFor(w2);
  const changed = !sameSigs(s1, s2) || !sameSigs(s1, baseSigs);
  if (!changed) insensitive += 1;
  console.log(`${changed ? "changes   " : "NO EFFECT "} ${label}  (${low} vs ${high})`);
}

console.log(`\n${insensitive} input(s) do not change any of the four solutions.`);
