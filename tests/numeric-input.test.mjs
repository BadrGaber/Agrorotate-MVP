import test from "node:test";
import assert from "node:assert/strict";
import {
  INPUT_SPECS,
  parseNumericInput,
  resolveNumericInput,
} from "../src/engine/numericInput.ts";
import { validateSingleField } from "../src/engine/validation.ts";

test("a valid zero is kept as zero, never replaced by an absent default", () => {
  for (const spec of [
    INPUT_SPECS.waterQuotaMm,
    INPUT_SPECS.espPct,
    INPUT_SPECS.caco3Pct,
    INPUT_SPECS.no3nPpm,
    INPUT_SPECS.olsenPPpm,
    INPUT_SPECS.exchangeableKPpm,
    INPUT_SPECS.waterSarw,
  ]) {
    const parsed = parseNumericInput("0", spec);
    assert.equal(parsed.ok, true, `${spec.key} must accept 0`);
    assert.equal(parsed.value, 0);

    const resolved = resolveNumericInput("0", spec, 999);
    assert.equal(resolved.value, 0, `${spec.key} zero must survive the fallback path`);
    assert.equal(resolved.issue, null);
    assert.equal(resolved.usedFallback, false);

    const numericZero = parseNumericInput(0, spec);
    assert.equal(numericZero.ok, true);
    assert.equal(numericZero.value, 0);
  }
});

test("an empty optional field stays absent and does not become zero", () => {
  for (const raw of [null, undefined, "", "   "]) {
    const parsed = parseNumericInput(raw, INPUT_SPECS.eceDsm);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.present, false);
    assert.equal(parsed.value, null);
  }


  const quota = resolveNumericInput("", INPUT_SPECS.waterEcwDsm, 1.1);
  assert.equal(quota.value, 1.1);
  assert.equal(quota.usedFallback, true);
  assert.equal(quota.issue, null);
});

test("an empty required field is an error, not a silent default", () => {
  const parsed = parseNumericInput("", {
    key: "demo.required",
    label: "Required demo",
    unit: "mm",
    min: 0,
    max: 10,
    required: true,
  });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.issue.code, "required_missing");
  assert.equal(parsed.issue.field, "demo.required");
});

test("non-numeric text and non-finite numbers are rejected", () => {
  const abc = parseNumericInput("abc", INPUT_SPECS.eceDsm);
  assert.equal(abc.ok, false);
  assert.equal(abc.issue.code, "not_a_number");
  assert.match(abc.issue.message, /finite number/);

  const trailing = parseNumericInput("12abc", INPUT_SPECS.eceDsm);
  assert.equal(trailing.ok, false, "parseFloat-style truncation must not be used");

  for (const raw of [NaN, Infinity, -Infinity]) {
    const parsed = parseNumericInput(raw, INPUT_SPECS.eceDsm);
    assert.equal(parsed.ok, false);
    assert.equal(parsed.issue.code, "not_finite");
  }

  const boolean = parseNumericInput(true, INPUT_SPECS.eceDsm);
  assert.equal(boolean.ok, false);
  assert.equal(boolean.issue.code, "not_a_number");
});

test("negative and out-of-range values are rejected per field and unit", () => {
  const negativeQuota = parseNumericInput("-10", INPUT_SPECS.waterQuotaMm);
  assert.equal(negativeQuota.ok, false);
  assert.equal(negativeQuota.issue.code, "below_min");

  const tooSaline = parseNumericInput("60", INPUT_SPECS.eceDsm);
  assert.equal(tooSaline.ok, false);
  assert.equal(tooSaline.issue.code, "above_max");

  const tooAcidic = parseNumericInput("3.0", INPUT_SPECS.ph);
  assert.equal(tooAcidic.ok, false);
  assert.equal(tooAcidic.issue.code, "below_min");



  assert.equal(parseNumericInput("50", INPUT_SPECS.exchangeableKPpm).ok, true);
  assert.equal(parseNumericInput("55", INPUT_SPECS.eceDsm).ok, false);
});

test("valid in-range values and decimal commas parse", () => {
  const quota = parseNumericInput("550", INPUT_SPECS.waterQuotaMm);
  assert.equal(quota.ok, true);
  assert.equal(quota.value, 550);

  const decimal = parseNumericInput("0,8", INPUT_SPECS.waterEcwDsm);
  assert.equal(decimal.ok, true);
  assert.equal(decimal.value, 0.8);
});

test("validateSingleField uses the same contract and keeps zero valid", () => {
  assert.equal(validateSingleField("quotaMm", "0"), null);
  assert.equal(validateSingleField("no3nPpm", "0"), null);
  assert.equal(validateSingleField("espPct", "0"), null);
  assert.equal(validateSingleField("caco3Pct", "0"), null);

  const text = validateSingleField("ph", "abc");
  assert.equal(text.severity, "error");
  assert.equal(text.id, "ph_not_number");

  const high = validateSingleField("ph", "12");
  assert.equal(high.severity, "error");
  assert.equal(high.id, "ph_out_of_bounds");

  assert.equal(validateSingleField("ph", ""), null);
  assert.equal(validateSingleField("ph", null), null);
});
