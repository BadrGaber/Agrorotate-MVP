import test from "node:test";
import assert from "node:assert/strict";
import { optimizeWorkspace, inferRegionalBaseline } from "../server/ai/optimizer.mjs";

test("server/ai/optimizer: inferRegionalBaseline infers baseline for Egypt and Corn Belt", () => {
  const egyptState = {
    field: { centroidLat: 30.8, centroidLon: 31.2 },
    priorities: { previousCropId: "bread-wheat" },
    plan: { slots: [] },
  };
  const egyptBaseline = inferRegionalBaseline(egyptState);
  assert.equal(egyptBaseline.length, 6);
  assert.equal(egyptBaseline[0].cropId, "grain-maize");
  assert.equal(egyptBaseline[1].cropId, "berseem-clover-multi-cut");

  const usState = {
    field: { centroidLat: 41.5, centroidLon: -93.6 },
    priorities: { previousCropId: "grain-maize" },
    plan: { slots: [] },
  };
  const usBaseline = inferRegionalBaseline(usState);
  assert.equal(usBaseline.length, 6);
  assert.equal(usBaseline[0].cropId, "grain-maize");
  assert.equal(usBaseline[2].cropId, "soybean");
});

test("server/ai/optimizer: optimizeWorkspace generates 4 Pareto solutions with bareFieldDays and hot spots", () => {
  const workspace = {
    field: { name: "Delta Research Field", centroidLat: 31.1, centroidLon: 30.9 },
    soil: { lab: { eceDsm: "4.2", ph: "8.1" } },
    water: { regime: "full_irrigation", quotaMm: "5800", ecwDsm: "1.4" },
    plan: { slots: [] },
    priorities: { previousCropId: "bread-wheat" },
  };

  const contract = optimizeWorkspace(workspace);
  assert.equal(contract.schemaVersion, "agrorotate.ai.output/v1");
  assert.equal(contract.paretoSolutions.length, 4);

  const ids = contract.paretoSolutions.map((s) => s.id);
  assert.deepEqual(ids, [
    "existing_baseline",
    "max_profit",
    "water_conservation",
    "soil_regeneration",
  ]);

  for (const sol of contract.paretoSolutions) {
    assert.ok(typeof sol.bareFieldDaysTotal === "number" && sol.bareFieldDaysTotal > 0);
    assert.ok(Array.isArray(sol.vulnerabilityHotspots));
    assert.ok(Array.isArray(sol.informationGaps) && sol.informationGaps.length >= 1);
    assert.ok(Array.isArray(sol.localReviewRisks) && sol.localReviewRisks.length >= 1);
    assert.equal(sol.slots.length, 6);

    for (const slot of sol.slots) {
      assert.ok(typeof slot.cropId === "string");
      assert.ok(typeof slot.bareFieldDaysAfterHarvest === "number");
      assert.ok(typeof slot.causalRationale === "string");
    }
  }

  assert.equal(contract.causalAttributionLedger.length, 6);
  // Verify all 6 pathogens are present in the causal ledger
  const firstTransition = contract.causalAttributionLedger[0].soilStateTransition;
  assert.equal(firstTransition.pathogenSuppression.length, 6);
  const pathogenText = firstTransition.pathogenSuppression.join(" ");
  assert.match(pathogenText, /Meloidogyne/i);
  assert.match(pathogenText, /Fusarium/i);
  assert.match(pathogenText, /Stromatinia/i);
  assert.match(pathogenText, /Orobanche/i);
  assert.match(pathogenText, /Heterodera/i);
  assert.match(pathogenText, /Rhizoctonia/i);

  // Dynamic Uncertainty checks
  assert.equal(contract.confidenceIntervals.basisTier, "MEAS");
  assert.ok(contract.confidenceIntervals.overallUncertaintyPct >= 3.0 && contract.confidenceIntervals.overallUncertaintyPct <= 6.0);
});

test("server/ai/optimizer: dynamic uncertainty degrades gracefully to EST / EO_PRIOR without lab data", () => {
  const eoWorkspace = {
    field: { name: "Satellite Prior Only Field", centroidLat: 31.1, centroidLon: 30.9 },
    water: { regime: "rainfed", quotaMm: "1400" },
    plan: { slots: [] },
  };

  const contract = optimizeWorkspace(eoWorkspace);
  assert.equal(contract.confidenceIntervals.basisTier, "EO_PRIOR");
  assert.ok(contract.confidenceIntervals.overallUncertaintyPct >= 7.0, `Expected higher uncertainty for EO_PRIOR, got ${contract.confidenceIntervals.overallUncertaintyPct}`);
});

test("server/ai/optimizer: extreme salinity edge case (ECe = 14 dS/m) prunes salt-sensitive crops", () => {
  const hypersalineWorkspace = {
    field: { name: "Kafr El-Sheikh Extreme Sabkha", centroidLat: 31.1, centroidLon: 30.9 },
    soil: { lab: { eceDsm: "14.0", ph: "8.3" } },
    water: { regime: "full_irrigation", quotaMm: "5500", ecwDsm: "2.8" },
    plan: { slots: [] },
  };

  const contract = optimizeWorkspace(hypersalineWorkspace);
  assert.equal(contract.paretoSolutions.length, 4);

  // In hypersaline conditions, salt-tolerant crops like barley, cotton, sorghum or sugar-beet should be favoured
  const waterSol = contract.paretoSolutions.find((s) => s.id === "water_conservation");
  assert.ok(waterSol);
  const saltTolerantCrops = new Set(["six-row-barley", "grain-sorghum", "pearl-millet", "egyptian-cotton", "sugar-beet", "bread-wheat", "summer-cowpea-cover"]);
  const matched = waterSol.slots.some((s) => saltTolerantCrops.has(s.cropId));
  assert.ok(matched, "Hypersaline rotation must contain proven salt-tolerant crops");
});
