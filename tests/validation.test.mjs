/**
 * Unit and integration tests for Triple-Layer Agronomic Validation Guardrails.
 * Tests Layer 1 (Physical bounds), Layer 2 (Cross-parameter sanity), and Layer 3 (Provenance & confidence).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  PHYSICAL_BOUNDS,
  validateSingleField,
  validateAgronomicVector,
} from "../src/engine/validation.ts";
import { normalizeFieldInputsToScientificVector } from "../src/engine/estimate.ts";

test("Layer 1: validateSingleField enforces hard biophysical bounds", () => {
  // pH bounds [3.5, 10.5]
  assert.equal(validateSingleField("phH2o", 7.0), null);
  assert.equal(validateSingleField("phH2o", 3.5), null);
  assert.equal(validateSingleField("phH2o", 10.5), null);

  const phTooLow = validateSingleField("phH2o", 2.8);
  assert.ok(phTooLow !== null);
  assert.equal(phTooLow.severity, "error");
  assert.equal(phTooLow.id, "phH2o_out_of_bounds");

  const phTooHigh = validateSingleField("phH2o", 11.2);
  assert.ok(phTooHigh !== null);
  assert.equal(phTooHigh.severity, "error");

  // Salinity ECe bounds [0.1, 50.0]
  assert.equal(validateSingleField("eceDsm", 2.5), null);
  const ecTooHigh = validateSingleField("eceDsm", 85.0);
  assert.ok(ecTooHigh !== null);
  assert.equal(ecTooHigh.severity, "error");

  // Non-numeric string rejects gracefully
  const nanIssue = validateSingleField("sandPercent", "not_a_number");
  assert.ok(nanIssue !== null);
  assert.equal(nanIssue.severity, "error");
  assert.equal(nanIssue.id, "sandPercent_not_number");

  // Empty string or null is allowed (unfilled)
  assert.equal(validateSingleField("phH2o", null), null);
  assert.equal(validateSingleField("phH2o", ""), null);
  assert.equal(validateSingleField("phH2o", undefined), null);

  // UI state key aliases validation
  assert.equal(validateSingleField("ph", 7.2), null);
  const phUiTooHigh = validateSingleField("ph", 12.0);
  assert.ok(phUiTooHigh !== null);
  assert.equal(phUiTooHigh.severity, "error");
  assert.match(phUiTooHigh.message, /3.5 and 10.5/);

  assert.equal(validateSingleField("bulkDensity", 1.35), null);
  const bdUiTooHigh = validateSingleField("bulkDensity", 2.8);
  assert.ok(bdUiTooHigh !== null);
  assert.equal(bdUiTooHigh.severity, "error");

  assert.equal(validateSingleField("caco3Pct", 15.0), null);
  const caco3UiTooHigh = validateSingleField("caco3Pct", 90.0);
  assert.ok(caco3UiTooHigh !== null);
  assert.equal(caco3UiTooHigh.severity, "error");

  assert.equal(validateSingleField("espPct", 12.0), null);
  const espUiTooHigh = validateSingleField("espPct", 75.0);
  assert.ok(espUiTooHigh !== null);
  assert.equal(espUiTooHigh.severity, "error");

  assert.equal(validateSingleField("ecwDsm", 1.8), null);
  const ecwUiTooHigh = validateSingleField("ecwDsm", 25.0);
  assert.ok(ecwUiTooHigh !== null);
  assert.equal(ecwUiTooHigh.severity, "error");

  assert.equal(validateSingleField("quotaMm", 600), null);
  const quotaUiTooHigh = validateSingleField("quotaMm", 5000);
  assert.ok(quotaUiTooHigh !== null);
  assert.equal(quotaUiTooHigh.severity, "error");
});

test("PHYSICAL_BOUNDS registers valid biophysical range definitions", () => {
  assert.ok(PHYSICAL_BOUNDS["phH2o"].min <= 4.0 && PHYSICAL_BOUNDS["phH2o"].max >= 10.0);
  assert.ok(PHYSICAL_BOUNDS["eceDsm"].min >= 0.0 && PHYSICAL_BOUNDS["eceDsm"].max >= 30.0);
  assert.ok(PHYSICAL_BOUNDS["sandPercent"].min === 0.0 && PHYSICAL_BOUNDS["sandPercent"].max === 100.0);
  assert.ok(PHYSICAL_BOUNDS["clayPercent"].min === 0.0 && PHYSICAL_BOUNDS["clayPercent"].max === 100.0);
  assert.ok(PHYSICAL_BOUNDS["bulkDensity"].min >= 0.5 && PHYSICAL_BOUNDS["bulkDensity"].max <= 2.2);
});

test("Layer 2: validateAgronomicVector catches cross-parameter textural sum discrepancy", () => {
  const base = normalizeFieldInputsToScientificVector({
    measured: {
      sandPercent: 50,
      siltPercent: 30,
      clayPercent: 20,
    },
    estimated: {},
    eoPrior: {},
  });

  const validReport = validateAgronomicVector(base);
  assert.equal(validReport.valid, true);
  assert.equal(validReport.errors.length, 0);

  // Invalidate textural sum
  const badVector = structuredClone(base);
  badVector.soilPhysical.sandPercent = 60; // 60 + 30 + 20 = 110%
  const badReport = validateAgronomicVector(badVector);

  assert.equal(badReport.valid, false);
  const textureError = badReport.errors.find((e) => e.id === "cross_texture_sum");
  assert.ok(textureError !== null, "Must detect texture fractions summing to != 100%");
});

test("Layer 2: validateAgronomicVector detects hydraulic sequencing violation", () => {
  const base = normalizeFieldInputsToScientificVector({
    measured: {},
    estimated: {},
    eoPrior: {},
  });

  // Physically impossible: PWP >= FC
  const invertedVector = structuredClone(base);
  invertedVector.soilPhysical.wiltingPointVolPct = 25.0;
  invertedVector.soilPhysical.fieldCapacityVolPct = 20.0;

  const report = validateAgronomicVector(invertedVector);
  assert.equal(report.valid, false);
  const pwpFcError = report.errors.find((e) => e.id === "cross_hydraulic_pwp_fc");
  assert.ok(pwpFcError !== null, "Must flag wilting point >= field capacity");
});

test("Layer 2: validateAgronomicVector detects CaCO3 lime vs acidic pH contradiction", () => {
  const base = normalizeFieldInputsToScientificVector({
    measured: {},
    estimated: {},
    eoPrior: {},
  });

  // Contradiction: CaCO3 > 15% with pH < 6.5
  const contradictoryVector = structuredClone(base);
  contradictoryVector.soilChemical.caco3Percent = 22.0;
  contradictoryVector.soilChemical.phH2o = 5.2;

  const report = validateAgronomicVector(contradictoryVector);
  assert.equal(report.valid, false);
  const limeError = report.errors.find((e) => e.id === "cross_lime_ph_contradiction");
  assert.ok(limeError !== null, "Must flag high CaCO3 with acidic pH");
});

test("Layer 3: validateAgronomicVector computes confidence score and tier distribution", () => {
  // 1. High confidence: all MEAS
  const labVector = normalizeFieldInputsToScientificVector({
    measured: {
      sandPercent: 30,
      clayPercent: 40,
      phH2o: 7.9,
      eceDsm: 2.1,
      espPercent: 5.0,
      caco3Percent: 6.0,
      somPercent: 2.2,
      cecCmolKg: 28.0,
      availableNPpm: 24,
      availablePPpm: 15,
      availableKPpm: 320,
      seasonalWaterQuotaM3Ha: 8000,
      irrigationEcwDsm: 0.8,
      irrigationSarw: 2.5,
    },
    estimated: {},
    eoPrior: {},
  });

  const labReport = validateAgronomicVector(labVector);
  assert.equal(labReport.valid, true);
  assert.ok(
    labReport.confidenceSummary.overallConfidenceScore >= 0.80,
    `MEAS inputs should have high confidence: ${labReport.confidenceSummary.overallConfidenceScore}`
  );
  assert.ok(labReport.confidenceSummary.tierCounts.MEAS > 5);

  // 2. Lower confidence: only EO priors
  const eoVector = normalizeFieldInputsToScientificVector({
    measured: {},
    estimated: {},
    eoPrior: {},
  });

  const eoReport = validateAgronomicVector(eoVector);
  assert.ok(
    eoReport.confidenceSummary.overallConfidenceScore < labReport.confidenceSummary.overallConfidenceScore,
    "EO prior confidence should be strictly lower than MEAS lab confidence"
  );
  assert.ok(eoReport.confidenceSummary.uncertaintyBandPercent > labReport.confidenceSummary.uncertaintyBandPercent);
});
