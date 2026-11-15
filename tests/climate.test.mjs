/**
 * Regression and unit tests for src/engine/climate.ts.
 * Validates FAO-56 Penman-Monteith, solar radiation, and spanDays / 365.25 scaling.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  dayOfYear,
  extraterrestrialRadiation,
  fao56PenmanMonteith,
  finiteOrNull,
  summarisePower,
} from "../src/engine/climate.ts";

test("dayOfYear calculates accurate Julian day", () => {
  assert.equal(dayOfYear("2026-01-01"), 1);
  assert.equal(dayOfYear("2026-01-31"), 31);
  assert.equal(dayOfYear("2026-02-01"), 32);
  // 2024 is a leap year (Feb has 29 days)
  assert.equal(dayOfYear("2024-03-01"), 61);
  // 2026 is non-leap
  assert.equal(dayOfYear("2026-03-01"), 60);
  assert.equal(dayOfYear("2026-12-31"), 365);
});

test("extraterrestrialRadiation produces positive physical Ra values", () => {
  // Lat 30 (Egypt/Mediterranean), day 172 (summer solstice: dayOfYear=172, lat=30.0)
  const raSummer = extraterrestrialRadiation(172, 30.0);
  assert.ok(raSummer > 35 && raSummer < 45, `Expected Ra ~40 MJ/m2/day, got ${raSummer}`);

  // Lat 30, day 355 (winter solstice: dayOfYear=355, lat=30.0)
  const raWinter = extraterrestrialRadiation(355, 30.0);
  assert.ok(raWinter > 15 && raWinter < 25, `Expected Ra ~20 MJ/m2/day, got ${raWinter}`);
});

test("fao56PenmanMonteith reference evapotranspiration returns physically sound ETo", () => {
  // Standard sunny summer day in arid zone
  const etoSummer = fao56PenmanMonteith({
    tmax: 35,
    tmin: 20,
    rhMean: 40,
    wind2m: 2.5,
    solarRadiation: 25,
    isoDate: "2026-06-21",
    latitude: 30.5,
    elevationM: 50,
  });
  assert.ok(etoSummer !== null, "Summer ETo should compute successfully");
  assert.ok(etoSummer > 5.0 && etoSummer < 9.0, `Summer ETo should be ~6-8 mm/day, got ${etoSummer}`);

  // Cold winter day
  const etoWinter = fao56PenmanMonteith({
    tmax: 16,
    tmin: 6,
    rhMean: 70,
    wind2m: 1.5,
    solarRadiation: 10,
    isoDate: "2026-01-15",
    latitude: 30.5,
    elevationM: 50,
  });
  assert.ok(etoWinter !== null, "Winter ETo should compute successfully");
  assert.ok(etoWinter > 1.0 && etoWinter < 3.5, `Winter ETo should be ~1.5-3.0 mm/day, got ${etoWinter}`);

  // Missing required solar radiation should return null rather than guess
  const etoMissing = fao56PenmanMonteith({
    tmax: 30,
    tmin: 20,
    rhMean: 50,
    wind2m: 2.0,
    solarRadiation: NaN,
    isoDate: "2026-05-15",
    latitude: 30,
    elevationM: 0,
  });
  assert.equal(etoMissing, null, "Should return null on missing required input");
});

test("FAO-56 Example 18 (Uccle, 6 July) reproduces the published 3.88 mm/day within ±0.05", () => {
  // Allen et al. (1998), FAO-56 Chapter 4, Example 18. Published values:
  // Tmax 21.5 °C, Tmin 12.3 °C, RHmax 84 %, RHmin 63 %, wind 10 km/h at 10 m
  // (u2 = 2.078 m/s), Rs = 22.07 MJ/m²/day, lat 50.8°N, elevation 100 m, ETo = 3.88.
  // This implementation takes RHmean; Example 18's ea = 1.409 kPa and es = 1.997 kPa
  // correspond to RHmean = 70.556 %, not the arithmetic mean of RHmax/RHmin.
  const eto = fao56PenmanMonteith({
    tmax: 21.5,
    tmin: 12.3,
    rhMean: (1.409 / 1.997) * 100,
    wind2m: 2.078,
    solarRadiation: 22.07,
    isoDate: "2026-07-06",
    latitude: 50.8,
    elevationM: 100,
  });
  assert.ok(eto !== null);
  assert.ok(
    Math.abs(eto - 3.88) <= 0.05,
    `Example 18 ETo must match 3.88 ± 0.05 mm/day, got ${eto}`,
  );
});

test("summarisePower scales annual rainfall and ETo by spanDays / 365.25", () => {
  // Construct NASA POWER mock payload for 730 days (2 non-leap years)
  // Daily rain = 1.0 mm, constant weather producing stable ETo
  const tmaxMap = {};
  const tminMap = {};
  const tavgMap = {};
  const precipMap = {};
  const rhMap = {};
  const wsMap = {};
  const sradMap = {};

  const startDate = new Date(Date.UTC(2024, 0, 1));
  const countDays = 730;

  for (let i = 0; i < countDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const key = `${y}${m}${day}`;

    tmaxMap[key] = 30.0;
    tminMap[key] = 18.0;
    tavgMap[key] = 24.0;
    precipMap[key] = 1.0; // 1 mm every day
    rhMap[key] = 50.0;
    wsMap[key] = 2.0;
    sradMap[key] = 22.0;
  }

  const payload = {
    properties: {
      parameter: {
        T2M_MAX: tmaxMap,
        T2M_MIN: tminMap,
        T2M: tavgMap,
        PRECTOTCORR: precipMap,
        RH2M: rhMap,
        WS2M: wsMap,
        ALLSKY_SFC_SW_DWN: sradMap,
      },
    },
  };

  const result = summarisePower(payload, 30.5, 31.0, 50);
  assert.ok(result !== null, "Result should not be null");
  const { summary } = result;

  // Total rain = 730 mm over 730 days.
  // Formula: ((precipitation / spanDays) * 365.25)
  // (730 / 730) * 365.25 = 365.25 -> rounded to 365 mm
  assert.equal(summary.annualPrecipMm, 365);

  // ETo is positive and annual scale is consistent
  assert.ok(summary.etoAnnualMm !== null && summary.etoAnnualMm > 1000);
  assert.equal(summary.etoStatus, "complete");
  assert.equal(summary.etoDaysComputed, countDays);
  assert.equal(summary.etoDaysTotal, countDays);

  // Verify monthly scaling
  assert.equal(summary.monthly.length, 12);
  const spanYears = countDays / 365.25;
  for (const m of summary.monthly) {
    assert.ok(m.month >= 1 && m.month <= 12);
    // Since each month occurs twice in 730 days (~2 years):
    // bucket.rain / spanYears should be roughly monthDays * 1.0
    assert.ok(m.rainMm >= 28 && m.rainMm <= 32);
    assert.ok(m.etoMm !== null && m.etoMm > 50);
  }
});

test("summarisePower handles edge cases: empty list and missing parameter maps", () => {
  assert.equal(summarisePower(null, 30, 30), null);
  assert.equal(summarisePower({}, 30, 30), null);
  assert.equal(summarisePower({ properties: {} }, 30, 30), null);
  assert.equal(summarisePower({ properties: { parameter: {} } }, 30, 30), null);
});

test("summarisePower labels a partial ETo series instead of presenting it as complete", () => {
  const payload = {
    properties: {
      parameter: {
        T2M_MAX: { "20260101": 30, "20260102": 31 },
        T2M_MIN: { "20260101": 18, "20260102": 19 },
        PRECTOTCORR: { "20260101": 0, "20260102": 0 },
        RH2M: { "20260101": 50 }, // day 2 missing
        WS2M: { "20260101": 2, "20260102": 2 },
        ALLSKY_SFC_SW_DWN: { "20260101": 22, "20260102": 22 },
      },
    },
  };
  const result = summarisePower(payload, 30.5, 31.0, 50);
  assert.ok(result !== null);
  assert.equal(result.summary.etoStatus, "partial");
  assert.equal(result.summary.etoDaysComputed, 1);
  assert.equal(result.summary.etoDaysTotal, 2);
  assert.match(result.summary.etoRequiredInputs.join(","), /RH2M/);
});

test("finiteOrNull filters non-finite numbers and preserves valid values", () => {
  assert.equal(finiteOrNull(42.5), 42.5);
  assert.equal(finiteOrNull(0), 0);
  assert.equal(finiteOrNull(-0), -0);
  assert.equal(finiteOrNull(NaN), null);
  assert.equal(finiteOrNull(Infinity), null);
  assert.equal(finiteOrNull(-Infinity), null);
  assert.equal(finiteOrNull("invalid"), null);
  assert.equal(finiteOrNull(null), null);
  assert.equal(finiteOrNull(undefined), null);
});
