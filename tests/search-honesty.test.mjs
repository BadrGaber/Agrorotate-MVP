/**
 * TASK-02 — the search must describe what it actually executed, and the
 * input gate must stop invalid numbers before they reach it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { optimizeWorkspace } from "../server/ai/optimizer.mjs";

function workspace(overrides = {}) {
  return {
    field: {
      name: "Delta Research Field",
      centroidLat: 31.1,
      centroidLon: 30.9,
      elevationM: 12,
      slopeClass: "flat",
    },
    soil: { lab: { eceDsm: "4.2", ph: "8.1", socPct: "1.1" } },
    water: { regime: "full_irrigation", quotaMm: "5800", ecwDsm: "1.4" },
    plan: { slots: [] },
    priorities: {
      previousCropId: "bread-wheat",
      weights: { yield: 3, water: 3, soil: 3, risk: 3 },
    },
    ...overrides,
  };
}

test("search telemetry reports executed simulations and unique rotations separately", () => {
  const contract = optimizeWorkspace(workspace());

  assert.equal(contract.status, "ok");
  assert.equal(contract.search.searchType, "approximate_budgeted_sample");
  assert.equal(contract.search.budgetSimulations, 900);
  assert.equal(contract.search.simulationsExecuted, 900);
  assert.equal(contract.search.candidatesGenerated, 900);
  assert.ok(contract.search.uniqueRotationsEvaluated > 0);
  assert.ok(
    contract.search.uniqueRotationsEvaluated <= contract.search.candidatesGenerated,
  );
  assert.equal(
    contract.search.duplicateRolloutsSkipped,
    contract.search.candidatesGenerated - contract.search.uniqueRotationsEvaluated,
  );
  assert.ok(contract.search.elapsedMs >= 0);

  // The theoretical space is labelled as theoretical and is not the evaluated count.
  assert.ok(contract.search.theoreticalSearchSpace > contract.search.uniqueRotationsEvaluated);
  assert.match(contract.search.theoreticalSearchSpaceLabel, /theoretical/i);

  // No "11.4 million explored" claim anywhere in the payload.
  const payload = JSON.stringify(contract);
  assert.doesNotMatch(payload, /11\.4\s*million/i);
  assert.doesNotMatch(payload, /Pareto-optimal/i);
});

test("the four pathways are described as best-found, not globally optimal", () => {
  const contract = optimizeWorkspace(workspace());

  assert.equal(contract.paretoAssessment.basis, "best_per_objective_over_evaluated_set");
  assert.match(contract.paretoAssessment.label, /best alternatives found/i);
  assert.match(contract.paretoAssessment.note, /not a proof of global Pareto optimality/i);
  assert.equal(typeof contract.paretoAssessment.nonDominatedWithinEvaluatedSet, "boolean");
  assert.equal(contract.paretoAssessment.rankingByUserWeights.length, 4);

  for (const solution of contract.paretoSolutions) {
    assert.equal(typeof solution.riskScore, "number");
  }
});

test("changing the objective weights changes the ranking as expected", () => {
  const byObjective = (weights, objective) => {
    const contract = optimizeWorkspace(
      workspace({ priorities: { previousCropId: "bread-wheat", weights } }),
    );
    const values = contract.paretoSolutions.map((solution) => solution[objective]);
    const top = contract.paretoAssessment.rankingByUserWeights[0];
    assert.equal(
      top.weightedScore,
      Math.max(...values),
      `with weights ${JSON.stringify(weights)} the top weighted score must equal the best ${objective}`,
    );
    const topSolution = contract.paretoSolutions.find((s) => s.id === top.solutionId);
    assert.equal(topSolution[objective], Math.max(...values));
    return contract;
  };

  byObjective({ yield: 5, water: 0, soil: 0, risk: 0 }, "projectedNetReturnScore");
  byObjective({ yield: 0, water: 5, soil: 0, risk: 0 }, "waterSavingScore");
  byObjective({ yield: 0, water: 0, soil: 5, risk: 0 }, "soilHealthScore");

  const yieldFirst = byObjective({ yield: 5, water: 0, soil: 0, risk: 0 }, "projectedNetReturnScore");
  const waterFirst = byObjective({ yield: 0, water: 5, soil: 0, risk: 0 }, "waterSavingScore");
  assert.notDeepEqual(
    yieldFirst.paretoAssessment.rankingByUserWeights.map((row) => row.solutionId),
    waterFirst.paretoAssessment.rankingByUserWeights.map((row) => row.solutionId),
    "yield-first and water-first weights must not produce the same ranking",
  );
});

test("invalid text blocks the search and names the field", () => {
  const contract = optimizeWorkspace(
    workspace({ soil: { lab: { eceDsm: "abc", ph: "8.1" } } }),
  );

  assert.equal(contract.status, "blocked_invalid_inputs");
  assert.equal(contract.paretoSolutions.length, 0);
  assert.equal(contract.causalAttributionLedger.length, 0);
  assert.equal(contract.search.simulationsExecuted, 0);
  assert.equal(contract.search.blocked, true);
  assert.equal(contract.inputIssues.length, 1);
  assert.equal(contract.inputIssues[0].field, "soil.eceDsm");
  assert.match(contract.inputIssues[0].message, /finite number/);
});

test("a zero quota is a real value and does not become the planning default", () => {
  const contract = optimizeWorkspace(
    workspace({ water: { regime: "full_irrigation", quotaMm: "0", ecwDsm: "1.4" } }),
  );

  assert.equal(contract.status, "ok", "0 mm is within [0, 1800] and must run");
  assert.equal(contract.inputIssues.length, 0);
  assert.equal(contract.paretoSolutions.length, 4);
});

test("no scenario result contains NaN or Infinity", () => {
  const contract = optimizeWorkspace(workspace());
  const offenders = [];
  const walk = (value, path) => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      offenders.push(path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
    }
  };
  walk(contract, "contract");
  assert.deepEqual(offenders, [], `non-finite values at ${offenders.join(", ")}`);
});
