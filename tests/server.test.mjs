/**
 * Endpoint tests for the local API. The server is spawned on a scratch port so
 * the developer's running instance on 8000 is never touched.
 * Run: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const requestedPort = Number(process.env.TEST_PORT);
const PORT = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 8127;
const isWin = process.platform === "win32";
const PIPE_NAME = isWin ? `\\\\.\\pipe\\agrorotate-test-${process.pid}-${Date.now()}` : "";
const BASE = `http://127.0.0.1:${PORT}/api/v1`;

function testFetch(urlOrPath, options = {}) {
  if (!PIPE_NAME) {
    return fetch(urlOrPath, options);
  }
  let path = urlOrPath;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const u = new URL(path);
    path = u.pathname + u.search;
  }
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };
  let bodyData = options.body;
  if (bodyData && typeof bodyData === "string" && !headers["Content-Length"]) {
    headers["Content-Length"] = Buffer.byteLength(bodyData);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: PIPE_NAME,
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: async () => JSON.parse(raw),
            text: async () => raw,
            headers: res.headers,
          });
        });
      }
    );
    req.on("error", reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

let server;
let serverStdout = "";
let serverStderr = "";

async function startServer() {
  server = spawn(process.execPath, [join(root, "server", "index.mjs")], {
    env: { ...process.env, PORT: String(PORT), PIPE_NAME },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => {
    serverStdout += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    serverStderr += chunk.toString();
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await testFetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(
    `the local API did not come up on test port ${PORT}.\nServer STDOUT:\n${serverStdout}\nServer STDERR:\n${serverStderr}`
  );
}

test.before(startServer);
test.after(() => {
  server?.kill();
});

const askContext = {
  schemaVersion: "agrorotate.aicontext/1",
  route: "plan",
  field: {
    name: "Test field",
    placeLabel: "Drawn Parcel, Nile Valley",
    areaHa: 4.2,
    areaSource: "drawn",
    boundary: [
      { lat: 30.9412, lon: 30.4856 },
      { lat: 30.943, lon: 30.488 },
      { lat: 30.9395, lon: 30.4895 },
    ],
    centroidLat: 30.9412,
    centroidLon: 30.4856,
    elevationM: 8,
    slopeClass: "flat",
    notes: "",
  },
  soil: {
    observations: { surfaceSalt: "crust" },
    lab: {
      eceDsm: "8.7",
      ph: "7.9",
      clayPct: "31",
    },
  },
  water: {
    ecwDsm: "1.9",
    quotaMm: "620",
    sarw: "4.2",
    regime: "deficit_allocation",
    system: "surface",
    source: "river_canal",
  },
  climate: {
    status: "loaded",
    source: "NASA POWER",
    summary: {
      meanTmaxC: 27.4,
      meanTminC: 15.1,
      annualPrecipMm: 90,
      etoAnnualMm: 1650,
      days: 1825,
      startDate: "2021-11-11",
      endDate: "2026-11-10",
      heatDays35: 21,
      dryDays: 300,
      frostDays: 0,
    },
    fetchedAtIso: "2026-11-11T00:00:00Z",
    error: null,
  },
  priorities: {
    preset: "balanced",
    weights: { yield: 3, water: 3, soil: 3, risk: 3 },
    previousCropId: "grain-maize",
    excluded: { "processing-tomato": "no reliable market this season" },
  },
  plan: {
    title: "Example",
    cycle: 1,
    slots: [
      { cropId: "bread-wheat", note: "" },
      { cropId: null, note: "" },
      { cropId: null, note: "" },
      { cropId: null, note: "" },
      { cropId: null, note: "" },
      { cropId: null, note: "" },
    ],
  },
  coverage: {
    filled: 1,
    salinityAssessable: 1,
    familyRepeats: 0,
    conflicts: 0,
    cautions: 0,
    verifiedCrops: 1,
    observationsRecorded: 1,
    labFieldsRecorded: 3,
  },
  selected: {
    index: 0,
    cropId: "bread-wheat",
    cropName: "Bread Wheat",
    family: "Poaceae",
    evaluation: {
      verdict: "caution",
      salinity: {
        state: "above",
        relativeYieldPct: 80.7,
        thresholdDsm: 6.0,
        slopePctPerDsm: 7.1,
        endpoint: "Seed yield",
        detail: "ECe 8.7 exceeds the FAO threshold 6.0 dS/m.",
      },
      findings: [
        {
          id: "salinity",
          severity: "caution",
          title: "Above FAO salinity threshold",
          detail: "8.7 dS/m above 6.0",
        },
      ],
      dimensions: [
        {
          key: "family",
          label: "Family",
          status: "assessed",
          detail: "changes family",
        },
      ],
    },
    salinityClears: false,
    seasonMatch: true,
    familyBreak: true,
    isLegume: false,
    isCover: false,
    alternatives: [
      {
        id: "six-row-barley",
        name: "Six-Row Barley",
        family: "Poaceae",
        reasons: ["Below its FAO salinity threshold"],
        salinity: "below",
        salinityClears: true,
        familyBreak: null,
        seasonMatch: true,
        isLegume: false,
        isCover: false,
        blockedByUser: false,
      },
      {
        id: "sugar-beet",
        name: "Sugar Beet",
        family: "Amaranthaceae",
        reasons: [
          "Below its FAO salinity threshold",
          "Breaks the Poaceae sequence",
        ],
        salinity: "below",
        salinityClears: true,
        familyBreak: true,
        seasonMatch: true,
        isLegume: false,
        isCover: false,
        blockedByUser: false,
      },
      {
        id: "egyptian-cotton",
        name: "Egyptian Cotton",
        family: "Malvaceae",
        reasons: [
          "Below its FAO salinity threshold",
          "Breaks the Poaceae sequence",
        ],
        salinity: "below",
        salinityClears: true,
        familyBreak: true,
        seasonMatch: false,
        isLegume: false,
        isCover: false,
        blockedByUser: false,
      },
      {
        id: "faba-bean",
        name: "Faba Bean",
        family: "Fabaceae",
        reasons: ["Salinity threshold in attachment — unassessed"],
        salinity: "no_threshold",
        salinityClears: null,
        familyBreak: true,
        seasonMatch: true,
        isLegume: true,
        isCover: false,
        blockedByUser: false,
      },
    ],
  },
  numerics: {},
  dataset: {
    rowCount: 1,
    labelledOutcomes: 0,
    source: "browser_workspace",
    note: "",
  },
};

test("GET /health reports the grounded-rules mode", async () => {
  const response = await testFetch(`${BASE}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.ai.mode, "grounded_rules");
  assert.equal(body.ai.trainedRanker, false);
});

test("POST /ai/choose annotates the browser alternatives instead of dropping them", async () => {
  const response = await testFetch(`${BASE}/ai/choose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(askContext),
  });
  assert.equal(response.status, 200);
  const body = await response.json();

  // The choice comes from the selected crop with the engine evaluation attached.
  assert.equal(body.choice.cropName, "Bread Wheat");
  assert.equal(body.choice.verdict, "caution");
  assert.equal(body.choice.salinityClears, false);
  assert.equal(body.choice.salinity.relativeYieldPct, 80.7);

  // Alternatives are echoed back with their per-check reasons — never emptied.
  assert.equal(body.alternatives.length, 4);
  assert.equal(body.alternatives[0].cropName, "Six-Row Barley");
  assert.equal(body.alternatives[0].salinityClears, true);

  // No trained ranker file exists in this repo: the probability must stay null,
  // never a fake 0.
  assert.ok(body.alternatives.every((alt) => alt.rankerProbability === null));

  // Coverage totals come from the payload the engine computed.
  assert.equal(body.counts.seasonsFilled, 1);
  assert.equal(body.counts.seasonsInPlan, 6);
  assert.equal(body.counts.conflicts, 0);
  assert.equal(body.counts.cropsCatalogued, 30);
});

test("POST /ai/choose without a selected crop still answers with state and gaps", async () => {
  const empty = {
    ...askContext,
    selected: null,
    plan: {
      ...askContext.plan,
      slots: askContext.plan.slots.map((slot) => ({ ...slot, cropId: null })),
    },
    coverage: {
      ...askContext.coverage,
      filled: 0,
      salinityAssessable: 0,
      verifiedCrops: 0,
    },
  };
  const response = await testFetch(`${BASE}/ai/choose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(empty),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.choice.status, "none");
  assert.ok(body.stateNow.length > 20);
  assert.ok(body.missing.some((item) => item.key === "plan"));
});

test("GET /parcels validates coordinates instead of guessing a field", async () => {
  const missing = await testFetch(`${BASE}/parcels`);
  assert.equal(missing.status, 400);

  const outOfRange = await testFetch(`${BASE}/parcels?lat=999&lon=30.6`);
  assert.equal(outOfRange.status, 400);
  const body = await outOfRange.json();
  assert.match(body.error, /WGS84/);
});

test("the exported AI registry matches the evidence ledger", () => {
  const crops = JSON.parse(
    readFileSync(join(root, "server", "ai", "crops.json"), "utf-8"),
  );
  const evidence = JSON.parse(
    readFileSync(join(root, "server", "ai", "evidence.json"), "utf-8"),
  );

  assert.equal(crops.crops.length, 30);
  const withThreshold = crops.crops.filter(
    (crop) => crop.salinityLimitDsm != null,
  );
  assert.ok(
    withThreshold.length >= 13,
    `salinity-backed crops: ${withThreshold.length}`,
  );

  // Only the four parameters a decision reads survive the ledger trim.
  assert.equal(evidence.claims.length, 120);
  const keptParameters = new Set(evidence.claims.map((claim) => claim.parameter));
  assert.deepEqual(
    [...keptParameters].sort(),
    ["Family", "Salinity Limit", "Season", "Yield Loss Slope"],
  );
  assert.ok(Array.isArray(evidence.sources) && evidence.sources.length >= 30);

  // Every crop in the registry must exist in the claim ledger.
  const cropNames = new Set(evidence.claims.map((claim) => claim.crop));
  for (const crop of crops.crops) {
    assert.ok(cropNames.has(crop.name), `missing claims for ${crop.name}`);
  }
});

test("POST /api/v1/optimize returns 4 Pareto solutions conforming to AiOutputContract", async () => {
  const sampleWorkspace = {
    field: { name: "Test Optimization Field", centroidLat: 30.8, centroidLon: 31.2 },
    soil: { lab: { eceDsm: "3.5", ph: "7.8" } },
    water: { regime: "full_irrigation", quotaMm: "5200", ecwDsm: "1.2" },
    plan: { slots: [] },
    priorities: { previousCropId: "bread-wheat" },
  };

  const response = await testFetch(`${BASE}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace: sampleWorkspace }),
  });

  assert.equal(response.status, 200);
  const contract = await response.json();
  assert.equal(contract.schemaVersion, "agrorotate.ai.output/v1");
  assert.equal(contract.paretoSolutions.length, 4);

  const solutionIds = contract.paretoSolutions.map((s) => s.id);
  assert.deepEqual(solutionIds, [
    "existing_baseline",
    "max_profit",
    "water_conservation",
    "soil_regeneration",
  ]);

  for (const sol of contract.paretoSolutions) {
    assert.ok(typeof sol.bareFieldDaysTotal === "number" && sol.bareFieldDaysTotal > 0);
    assert.ok(Array.isArray(sol.vulnerabilityHotspots));
    assert.ok(Array.isArray(sol.informationGaps) && sol.informationGaps.length > 0);
    assert.ok(Array.isArray(sol.localReviewRisks) && sol.localReviewRisks.length > 0);
    assert.equal(sol.slots.length, 6);
    for (const slot of sol.slots) {
      assert.ok(typeof slot.cropId === "string");
      assert.ok(typeof slot.bareFieldDaysAfterHarvest === "number");
      assert.ok(typeof slot.causalRationale === "string" && slot.causalRationale.length > 0);
    }
  }

  assert.equal(contract.causalAttributionLedger.length, 6);
});
