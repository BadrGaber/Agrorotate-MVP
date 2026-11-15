#!/usr/bin/env node
/**
 * Answers one question for every input the UI collects:
 * "does this number reach the decision code at all?"
 *
 * Decision code = the engine, the worker, the browser AI context and the two
 * server AI modules. UI pages and the state store are excluded on purpose: an
 * input that only appears there is read back into a form, not used.
 *
 * Run: node scripts/audit-input-usage.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const DECISION_FILES = [
  "src/engine/agronomy.ts",
  "src/engine/climate.ts",
  "src/engine/estimate.ts",
  "src/engine/optimizer.ts",
  "src/engine/planner.ts",
  "src/engine/validation.ts",
  "src/workers/aiOptimizer.worker.ts",
  "server/ai/optimizer.mjs",
  "server/ai/choose.mjs",
];

const sources = DECISION_FILES.map((file) => ({
  file,
  text: fs.existsSync(path.join(root, file)) ? read(file) : "",
}));

const GROUPS = {
  "Lab (SoilPage)": [
    "sandPct", "siltPct", "clayPct", "bulkDensity", "ph", "eceDsm", "socPct", "cec",
  ],
  "Water (WaterPage)": ["regime", "system", "source", "quotaMm", "ecwDsm"],
  "Field (FieldPage)": [
    "name", "placeLabel", "areaHa", "areaSource", "boundary", "centroidLat",
    "centroidLon", "slopeClass", "slopeSource", "elevationM", "elevationSource",
  ],
  "Climate (NASA POWER)": [
    "meanTmaxC", "meanTminC", "annualPrecipMm", "etoAnnualMm", "heatDays35",
    "dryDays", "frostDays", "summer", "winter", "monthly",
  ],
  "Priorities (PrioritiesPage)": ["preset", "weights", "excluded", "previousCropId"],
};

const OBSERVATION_KEYS = [
  ...read("src/data/observations.ts").matchAll(/key:\s*"([a-zA-Z0-9_]+)"/g),
].map((m) => m[1]);

function hits(key) {
  const re = new RegExp(`\\.${key}\\b|\\b${key}\\s*:`, "g");
  const found = [];
  for (const { file, text } of sources) {
    const count = (text.match(re) ?? []).length;
    if (count > 0) found.push(`${path.basename(file)}×${count}`);
  }
  return found;
}

let unused = 0;
for (const [group, keys] of Object.entries(GROUPS)) {
  console.log(`\n## ${group}`);
  for (const key of keys) {
    const found = hits(key);
    if (found.length === 0) unused += 1;
    console.log(`${found.length ? "  used  " : "  UNUSED"}  ${key.padEnd(20)} ${found.join(", ")}`);
  }
}

console.log("\n## Field observations");
for (const key of OBSERVATION_KEYS) {
  const found = hits(key);
  if (found.length === 0) unused += 1;
  console.log(`${found.length ? "  used  " : "  UNUSED"}  ${key.padEnd(20)} ${found.join(", ")}`);
}

console.log(`\n${unused} input(s) never reach the decision code.`);
