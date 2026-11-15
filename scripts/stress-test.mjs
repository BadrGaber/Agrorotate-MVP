#!/usr/bin/env node
import { optimizeWorkspace } from "../server/ai/optimizer.mjs";

console.log("=================================================");
console.log("   AGROROTATE BIOPHYSICAL STRESS-TEST ENGINE    ");
console.log("=================================================\n");

const baseWorkspace = () => ({
  field: { name: "StressTest", centroidLat: 30.8, centroidLon: 31.2, slopeClass: "flat", elevationM: 10, areaHa: 5.0 },
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
  priorities: { preset: "balanced", weights: { yield: 3, water: 3, soil: 3, risk: 3 }, excluded: {}, previousCropId: "bread-wheat" },
  plan: { title: "StressTest", cycle: 1, slots: [] },
});

const scenarios = [
  {
    name: "Scenario 1: Dead Sea Depression (Depression, extreme heat, hypersaline water, high ESP/CaCO3)",
    mutate: (ws) => {
      ws.field.elevationM = -350;
      ws.field.slopeClass = "steep";
      ws.climate.summary.heatDays35 = 110;
      ws.climate.summary.annualPrecipMm = 10;
      ws.soil.lab.espPct = "28";
      ws.soil.lab.caco3Pct = "38";
      ws.soil.lab.eceDsm = "18.5";
      ws.water.ecwDsm = "8.0";
      ws.water.sarw = "22";
      ws.water.system = "sprinkler";
    },
  },
  {
    name: "Scenario 2: High Alpine / Andean (3,800m elevation, acid peat, zero heat, high rain)",
    mutate: (ws) => {
      ws.field.elevationM = 3800;
      ws.field.slopeClass = "steep";
      ws.climate.summary.heatDays35 = 0;
      ws.climate.summary.annualPrecipMm = 1800;
      ws.climate.summary.frostDays = 160;
      ws.soil.lab.ph = "4.2";
      ws.soil.lab.socPct = "7.5";
      ws.soil.lab.eceDsm = "0.4";
      ws.soil.lab.espPct = "0.5";
      ws.soil.lab.caco3Pct = "0.2";
      ws.water.regime = "rainfed";
      ws.water.system = "none";
    },
  },
  {
    name: "Scenario 3: Hyper-Sodic Calcareous Dune Sand (Sand 94%, Clay 2%, Bulk Density 1.85)",
    mutate: (ws) => {
      ws.soil.lab.sandPct = "94";
      ws.soil.lab.clayPct = "2";
      ws.soil.lab.siltPct = "4";
      ws.soil.lab.bulkDensity = "1.85";
      ws.soil.lab.espPct = "32";
      ws.soil.lab.caco3Pct = "42";
      ws.soil.lab.no3nPpm = "1.5";
      ws.soil.lab.olsenPPpm = "1.0";
      ws.soil.lab.exchangeableKPpm = "25";
      ws.water.quotaMm = "1500";
      ws.water.system = "surface";
    },
  },
  {
    name: "Scenario 4: Super-Fertile Alluvial Delta with High Water Nitrate Credit",
    mutate: (ws) => {
      ws.soil.lab.no3nPpm = "95";
      ws.soil.lab.olsenPPpm = "65";
      ws.soil.lab.exchangeableKPpm = "550";
      ws.water.no3nPpm = "45";
      ws.soil.lab.socPct = "3.2";
      ws.priorities.weights = { yield: 5, water: 1, soil: 1, risk: 1 };
    },
  },
  {
    name: "Scenario 5: Degenerate Zero / Missing Inputs (Blank strings, undefined, zeroes)",
    mutate: (ws) => {
      ws.soil.lab.sandPct = "";
      ws.soil.lab.clayPct = "";
      ws.soil.lab.siltPct = "";
      ws.soil.lab.bulkDensity = "";
      ws.soil.lab.ph = "";
      ws.soil.lab.eceDsm = "";
      ws.soil.lab.espPct = "";
      ws.soil.lab.caco3Pct = "";
      ws.soil.lab.socPct = "";
      ws.soil.lab.cec = "";
      ws.soil.lab.no3nPpm = "";
      ws.soil.lab.olsenPPpm = "";
      ws.soil.lab.exchangeableKPpm = "";
      ws.water.quotaMm = "0";
      ws.water.ecwDsm = "0";
      ws.water.sarw = "0";
      ws.water.no3nPpm = "0";
      ws.climate.summary.heatDays35 = 0;
      ws.climate.summary.annualPrecipMm = 0;
      ws.field.elevationM = 0;
    },
  },
  {
    name: "Scenario 6: Extreme Boundary Outliers (Out of physical bounds)",
    mutate: (ws) => {
      ws.soil.lab.ph = "13.5";
      ws.soil.lab.eceDsm = "45.0";
      ws.soil.lab.espPct = "75.0";
      ws.soil.lab.caco3Pct = "80.0";
      ws.water.ecwDsm = "25.0";
      ws.water.sarw = "50.0";
      ws.water.quotaMm = "25000";
    },
  },
];

let allPassed = true;

for (const sc of scenarios) {
  process.stdout.write(`Testing: ${sc.name} ... `);
  const ws = baseWorkspace();
  sc.mutate(ws);

  try {
    const start = performance.now();
    const result = optimizeWorkspace(ws);
    const elapsed = (performance.now() - start).toFixed(1);


    if (!result || !result.paretoSolutions || result.paretoSolutions.length !== 4) {
      throw new Error(`Expected 4 Pareto solutions, got ${result?.paretoSolutions?.length}`);
    }

    for (const sol of result.paretoSolutions) {

      const scores = [
        ["projectedNetReturnScore", sol.projectedNetReturnScore],
        ["waterSavingScore", sol.waterSavingScore],
        ["soilHealthScore", sol.soilHealthScore],
        ["confidenceBandPercent", sol.confidenceBandPercent],
      ];

      for (const [key, val] of scores) {
        if (typeof val !== "number" || !Number.isFinite(val)) {
          throw new Error(`Solution ${sol.id} has invalid score ${key}: ${val}`);
        }
        if (val < 0 || val > 100) {
          throw new Error(`Solution ${sol.id} score ${key} out of range [0, 100]: ${val}`);
        }
      }

      if (!sol.slots || sol.slots.length !== 6) {
        throw new Error(`Solution ${sol.id} has ${sol.slots?.length} slots instead of 6`);
      }

      for (const slot of sol.slots) {
        if (!Number.isFinite(slot.yieldReductionPercent) || slot.yieldReductionPercent < 0 || slot.yieldReductionPercent > 100) {
          throw new Error(`Slot ${slot.seasonIndex} crop ${slot.cropId} has invalid yieldReductionPercent: ${slot.yieldReductionPercent}`);
        }
        if (!Number.isFinite(slot.waterDemandMm) || slot.waterDemandMm < 0) {
          throw new Error(`Slot ${slot.seasonIndex} crop ${slot.cropId} has invalid waterDemandMm: ${slot.waterDemandMm}`);
        }
      }
    }

    console.log(`PASSED in ${elapsed}ms (Vulnerabilities found: ${result.vulnerabilities?.length ?? 0})`);
  } catch (err) {
    console.log(`FAILED!`);
    console.error(`  Error: ${err.message}`);
    allPassed = false;
  }
}

console.log("\n=================================================");
if (allPassed) {
  console.log("   ALL STRESS TESTS PASSED SUCCESSFULLY! (6/6)   ");
} else {
  console.log("   SOME STRESS TESTS FAILED. CHECK LOGS ABOVE.   ");
  process.exit(1);
}
console.log("=================================================");
