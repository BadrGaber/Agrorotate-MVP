import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {
  analyseDemGrid,
  compassLabel,
  depthWeightedMean,
  detectEarthdataCredentials,
  normaliseSoilGrids,
  fetchSoilGrids,
} from "../server/eo.mjs";

function soilLayer(name, dFactor, values, uncertainty = 1) {
  const labels = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm"];
  const ranges = [
    [0, 5],
    [5, 15],
    [15, 30],
    [30, 60],
    [60, 100],
  ];
  return {
    name,
    unit_measure: {
      d_factor: dFactor,
      mapped_units: "raw",
      target_units: "target",
      uncertainty_unit: "",
    },
    depths: labels.map((label, index) => ({
      range: {
        top_depth: ranges[index][0],
        bottom_depth: ranges[index][1],
        unit_depth: "cm",
      },
      label,
      values: {
        mean: values[index],
        uncertainty:
          typeof uncertainty === "number" ? uncertainty : uncertainty[index],
      },
    })),
  };
}

const SAMPLE = {
  properties: {
    layers: [
      soilLayer("clay", 10, [300, 250, 200, 180, 160], [30, 25, 20, 18, 16]),
      soilLayer("sand", 10, [500, 450, 400, 380, 360], 20),
      soilLayer("silt", 10, [200, 300, 400, 440, 480], 20),
      soilLayer("phh2o", 10, [80, 78, 75, 72, 70], 2),
      soilLayer("soc", 10, [20, 15, 10, 8, 6], 2),
      soilLayer("cec", 10, [200, 180, 160, 150, 140], 20),
      soilLayer("bdod", 100, [130, 135, 140, 145, 150], 5),
      soilLayer("nitrogen", 100, [15, 12, 10, 8, 6], 2),
      soilLayer("cfvo", 10, [50, 60, 70, 80, 90], 5),
      soilLayer("wv0010", 10, [350, 340, 330, 320, 310], 10),
      soilLayer("wv0033", 10, [320, 310, 300, 290, 280], 10),
      soilLayer("wv1500", 10, [140, 130, 120, 110, 100], 10),
    ],
  },
};

test("depthWeightedMean uses horizon thickness, not a plain layer average", () => {
  const depths = [
    { topDepth: 0, bottomDepth: 5, mean: 300 },
    { topDepth: 5, bottomDepth: 15, mean: 250 },
    { topDepth: 15, bottomDepth: 30, mean: 200 },
  ];
  assert.equal(depthWeightedMean(depths, 0, 30), 233.33333333333334);
  assert.equal(depthWeightedMean(depths, 0, 10), 275);
  assert.equal(depthWeightedMean([], 0, 30), null);
});

test("normaliseSoilGrids converts mapped units and derives water and texture", () => {
  const result = normaliseSoilGrids(SAMPLE, {
    lat: 30.28,
    lon: 30.6,
    fetchedAtIso: "2026-11-12T00:00:00.000Z",
  });
  const layer = Object.fromEntries(
    result.layers.map((entry) => [entry.key, entry]),
  );

  assert.equal(layer.clay.topsoil030, 23.33);
  assert.equal(layer.clay.topsoilUncertainty, 2.33);
  assert.equal(layer.clay.rootZone0100, 18.8);
  assert.equal(layer.phh2o.topsoil030, 7.68);
  assert.equal(layer.soc.topsoil030, 0.13);
  assert.equal(layer.cec.topsoil030, 17.33);
  assert.equal(layer.bdod.topsoil030, 1.37);
  assert.equal(layer.wv0033.topsoil030, 30.67);
  assert.equal(layer.wv1500.topsoil030, 12.67);

  assert.equal(result.derived.fieldCapacityPct, 30.67);
  assert.equal(result.derived.wiltingPointPct, 12.67);
  assert.equal(result.derived.availableWaterPct, 18);
  assert.equal(result.derived.textureClass, "Loam");
  assert.equal(result.derived.bulkDensityGCm3, 1.37);
  assert.match(result.caveat, /Not a laboratory test/);
});

test("normaliseSoilGrids keeps missing values null instead of turning them into zero", () => {
  const payload = {
    properties: {
      layers: [
        {
          name: "phh2o",
          unit_measure: { d_factor: 10, mapped_units: "pH*10", target_units: "-" },
          depths: [
            {
              range: { top_depth: 0, bottom_depth: 5, unit_depth: "cm" },
              label: "0-5cm",
              values: { mean: null, uncertainty: null },
            },
          ],
        },
      ],
    },
  };
  const result = normaliseSoilGrids(payload, { lat: 30.55, lon: 31.02 });
  const ph = result.layers.find((layer) => layer.key === "phh2o");
  assert.equal(ph.topsoil030, null);
  assert.equal(ph.rootZone0100, null);
  assert.equal(ph.topsoilUncertainty, null);
  assert.equal(result.derived.ph, null);
  assert.equal(result.derived.textureClass, null);
  assert.equal(result.derived.availableWaterPct, null);
});

test("analyseDemGrid fits a plane, finds the downslope aspect and routes D8 west", () => {
  const elevations = [
    0, 1, 2,
    0, 1, 2,
    0, 1, 2,
  ];
  const result = analyseDemGrid(elevations, {
    rows: 3,
    cols: 3,
    cellSizeXm: 30,
    cellSizeYm: 30,
  });
  assert.equal(result.complete, true);
  assert.equal(result.meanElevationM, 1);
  assert.equal(result.reliefM, 2);
  assert.equal(result.slopePercent, 3.33);
  assert.equal(result.slopeDegrees, 1.91);
  assert.equal(result.aspectDeg, 270);
  assert.equal(result.aspectLabel, "W");
  assert.equal(result.flowDirection, 5);
  assert.equal(result.flowDirectionLabel, "W");
  assert.ok(Number.isFinite(result.twi));
  assert.equal(result.gridPointCount, 9);
});

test("analyseDemGrid keeps a flat grid honest instead of inventing an aspect", () => {
  const result = analyseDemGrid([10, 10, 10, 10, 10, 10, 10, 10, 10], {
    rows: 3,
    cols: 3,
    cellSizeXm: 30,
    cellSizeYm: 30,
  });
  assert.equal(result.slopePercent, 0);
  assert.equal(result.aspectDeg, null);
  assert.equal(result.aspectLabel, null);
  assert.equal(result.flowDirection, null);
  assert.ok(Number.isFinite(result.twi));
});

test("analyseDemGrid marks incomplete grids and refuses invalid dimensions", () => {
  const incomplete = analyseDemGrid([1, 2, 3, 4, 5, null, 7, 8, 9], {
    rows: 3,
    cols: 3,
    cellSizeXm: 30,
    cellSizeYm: 30,
  });
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.twi, null);
  assert.equal(incomplete.flowDirection, null);
  assert.ok(Number.isFinite(incomplete.meanElevationM));

  const invalid = analyseDemGrid([1, 2, 3, 4], {
    rows: 2,
    cols: 2,
    cellSizeXm: 30,
    cellSizeYm: 30,
  });
  assert.match(invalid.error, /3×3-or-larger/);

  const badCell = analyseDemGrid([1, 2, 3, 4, 5, 6, 7, 8, 9], {
    rows: 3,
    cols: 3,
    cellSizeXm: 0,
    cellSizeYm: 30,
  });
  assert.match(badCell.error, /Positive cell sizes/);
});

test("compassLabel maps degrees clockwise from north", () => {
  assert.equal(compassLabel(0), "N");
  assert.equal(compassLabel(45), "NE");
  assert.equal(compassLabel(90), "E");
  assert.equal(compassLabel(180), "S");
  assert.equal(compassLabel(270), "W");
  assert.equal(compassLabel(359), "N");
  assert.equal(compassLabel(null), null);
});

test("detectEarthdataCredentials reports status without exposing the token", async () => {
  const tokenResult = await detectEarthdataCredentials({
    EARTHDATA_TOKEN: "super-secret-token",
  });
  assert.equal(tokenResult.configured, true);
  assert.equal(tokenResult.mode, "bearer_token");
  assert.match(tokenResult.source, /EARTHDATA_TOKEN/);
  assert.doesNotMatch(JSON.stringify(tokenResult), /super-secret-token/);

  const basicResult = await detectEarthdataCredentials({
    EARTHDATA_USERNAME: "user",
    EARTHDATA_PASSWORD: "pass",
  });
  assert.equal(basicResult.configured, true);
  assert.equal(basicResult.mode, "basic_auth");
  assert.doesNotMatch(JSON.stringify(basicResult), /"pass"/);
});

test("fetchSoilGrids validates coordinates and rejects non-finite or out-of-range inputs", async () => {
  const resultNull = await fetchSoilGrids({ lat: null, lon: 30.5 });
  assert.equal(resultNull.status, "error");
  assert.equal(resultNull.derived, null);
  assert.equal(resultNull.layers.length, 0);

  const resultOut = await fetchSoilGrids({ lat: 95.0, lon: 30.5 });
  assert.equal(resultOut.status, "error");
  assert.equal(resultOut.derived, null);
});

test("fetchSoilGrids in cacheOnly mode returns pending marker without inventing mock data", async () => {
  const result = await fetchSoilGrids({
    lat: 12.34567,
    lon: 45.67891,
    cacheOnly: true,
  });
  assert.equal(result.status, "pending");
  assert.equal(result.derived, null);
  assert.equal(result.layers.length, 0);
  assert.equal(result.cache, "none");
});

test("fetchSoilGrids dual-tier caching reads disk cache and memory cache without network requests", async () => {
  const scratchDir = path.join(os.tmpdir(), `agrorotate-test-cache-${Date.now()}`);
  const testLat = 29.87654;
  const testLon = 31.23456;

  const mockRecord = {
    ...normaliseSoilGrids(SAMPLE, { lat: testLat, lon: testLon }),
    status: "ready",
    source: "ISRIC SoilGrids 250 m v2.0 · REST API",
    fetchedAtIso: new Date().toISOString(),
  };

  await fs.mkdir(scratchDir, { recursive: true });
  const key = crypto.createHash("sha1").update(`${testLat.toFixed(5)},${testLon.toFixed(5)}`).digest("hex").slice(0, 24);
  const cacheFilePath = path.join(scratchDir, `${key}.json`);
  await fs.writeFile(cacheFilePath, JSON.stringify(mockRecord), "utf8");

  const diskResult = await fetchSoilGrids({
    lat: testLat,
    lon: testLon,
    cacheDir: scratchDir,
  });
  assert.equal(diskResult.status, "ready");
  assert.equal(diskResult.cache, "server_cache");
  assert.equal(diskResult.derived.textureClass, "Loam");

  const memResult = await fetchSoilGrids({
    lat: testLat,
    lon: testLon,
    cacheDir: scratchDir,
  });
  assert.equal(memResult.status, "ready");
  assert.equal(memResult.cache, "memory_cache");

  await fs.rm(scratchDir, { recursive: true, force: true });
});