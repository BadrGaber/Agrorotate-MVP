import test from "node:test";
import assert from "node:assert/strict";
import {
  AGRONOMIC_32_FEATURE_LABELS,
  GROUP_TO_USDA_CLASS,
  classifyUsdaSoilTexture,
  computeSaxtonRawlsHydraulics,
  normalizeFieldInputsToScientificVector,
  workspaceToAgronomicVector,
  buildAiInputContractFromWorkspace,
  buildAiInputContract,
} from "../src/engine/estimate.ts";
import { DEFAULT_WORKSPACE } from "../src/state/model.ts";

test("classifyUsdaSoilTexture accurately classifies all 12 USDA textural classes plus Vertic Heavy Clay", () => {

  assert.equal(classifyUsdaSoilTexture(90, 5, 5), "SAND");


  assert.equal(classifyUsdaSoilTexture(80, 15, 5), "LOAMY_SAND");


  assert.equal(classifyUsdaSoilTexture(65, 20, 15), "SANDY_LOAM");


  assert.equal(classifyUsdaSoilTexture(40, 40, 20), "LOAM");


  assert.equal(classifyUsdaSoilTexture(20, 65, 15), "SILT_LOAM");


  assert.equal(classifyUsdaSoilTexture(5, 88, 7), "SILT");


  assert.equal(classifyUsdaSoilTexture(55, 15, 30), "SANDY_CLAY_LOAM");


  assert.equal(classifyUsdaSoilTexture(35, 35, 30), "CLAY_LOAM");


  assert.equal(classifyUsdaSoilTexture(15, 50, 35), "SILTY_CLAY_LOAM");


  assert.equal(classifyUsdaSoilTexture(50, 10, 40), "SANDY_CLAY");


  assert.equal(classifyUsdaSoilTexture(10, 45, 45), "SILTY_CLAY");


  assert.equal(classifyUsdaSoilTexture(25, 25, 50), "CLAY");


  assert.equal(classifyUsdaSoilTexture(10, 25, 65), "VERTIC_HEAVY_CLAY");
});

test("GROUP_TO_USDA_CLASS maps simplified texture groups to representative USDA classes", () => {
  assert.equal(GROUP_TO_USDA_CLASS["COARSE_SANDY"], "LOAMY_SAND");
  assert.equal(GROUP_TO_USDA_CLASS["LIGHT_LOAMY"], "SANDY_LOAM");
  assert.equal(GROUP_TO_USDA_CLASS["MEDIUM_SILTY_LOAM"], "LOAM");
  assert.equal(GROUP_TO_USDA_CLASS["MEDIUM_CLAY_LOAM"], "CLAY_LOAM");
  assert.equal(GROUP_TO_USDA_CLASS["HEAVY_CLAY"], "CLAY");
  assert.equal(GROUP_TO_USDA_CLASS["EXTREME_VERTIC_CLAY"], "VERTIC_HEAVY_CLAY");
});

test("computeSaxtonRawlsHydraulics enforces thermodynamic and hydraulic sequencing", () => {

  const profiles = [
    { sand: 85, clay: 8, som: 1.0 },
    { sand: 40, clay: 20, som: 2.0 },
    { sand: 20, clay: 55, som: 2.5 },
  ];

  for (const { sand, clay, som } of profiles) {
    const hyd = computeSaxtonRawlsHydraulics(sand, clay, som);


    assert.ok(
      hyd.saturationVolPct > hyd.fieldCapacityVolPct,
      `Saturation (${hyd.saturationVolPct}%) must be > FC (${hyd.fieldCapacityVolPct}%) for sand=${sand}, clay=${clay}`
    );
    assert.ok(
      hyd.fieldCapacityVolPct > hyd.wiltingPointVolPct,
      `FC (${hyd.fieldCapacityVolPct}%) must be > PWP (${hyd.wiltingPointVolPct}%) for sand=${sand}, clay=${clay}`
    );
    assert.ok(
      hyd.wiltingPointVolPct > 0,
      `PWP (${hyd.wiltingPointVolPct}%) must be positive`
    );


    assert.ok(hyd.awcMmM > 30 && hyd.awcMmM <= 250, `AWC out of bounds: ${hyd.awcMmM}`);


    assert.ok(hyd.infiltrationRateMmHr > 0, `Ksat must be positive: ${hyd.infiltrationRateMmHr}`);


    assert.ok(hyd.bulkDensityGCm3 >= 0.9 && hyd.bulkDensityGCm3 <= 1.95, `BD plausible: ${hyd.bulkDensityGCm3}`);
  }
});

test("computeSaxtonRawlsHydraulics compaction shifts alter porosity and conductivity", () => {
  const loose = computeSaxtonRawlsHydraulics(40, 25, 2.0, "LOOSE_FRIABLE");
  const dense = computeSaxtonRawlsHydraulics(40, 25, 2.0, "COMPACTED_DENSE");
  const severe = computeSaxtonRawlsHydraulics(40, 25, 2.0, "SEVERE_PLOWPAN");


  assert.ok(loose.bulkDensityGCm3 < dense.bulkDensityGCm3, "Loose soil has lower bulk density than compacted");
  assert.ok(dense.bulkDensityGCm3 < severe.bulkDensityGCm3, "Compacted soil has lower bulk density than plowpan");


  assert.ok(loose.saturationVolPct > dense.saturationVolPct, "Loose soil has higher porosity than compacted");
  assert.ok(dense.saturationVolPct > severe.saturationVolPct, "Compacted soil has higher porosity than plowpan");
});

test("computeSaxtonRawlsHydraulics coarse fragments reduce available water capacity", () => {
  const rockFree = computeSaxtonRawlsHydraulics(45, 25, 2.0, undefined, undefined, 0.0);
  const rocky = computeSaxtonRawlsHydraulics(45, 25, 2.0, undefined, undefined, 0.30);

  assert.ok(rocky.awcMmM < rockFree.awcMmM, "Gravel/coarse fragments must reduce volumetric AWC");
});

test("normalizeFieldInputsToScientificVector creates exact 32 continuous dimensions bounded in [0, 1]", () => {
  const normalized = normalizeFieldInputsToScientificVector({
    measured: {
      phH2o: 7.8,
      eceDsm: 3.2,
      sandPercent: 25,
      clayPercent: 45,
      somPercent: 1.8,
      seasonalWaterQuotaM3Ha: 6500,
    },
    estimated: {
      compactionState: "MODERATE_TILTH",
      irrigationSystemType: "SURFACE_DRIP",
    },
    eoPrior: {
      elevationM: 35,
      slopePercent: 1.5,
      annualPrecipitationMm: 120,
      annualEt0Mm: 1650,
      heatDays35: 22,
    },
    options: { fieldId: "field_alpha_01" },
  });


  assert.equal(normalized.continuousVector32.length, 32, "Vector length must be exactly 32 dimensions");
  assert.equal(normalized.featureLabels32.length, 32, "Labels length must be exactly 32");
  assert.equal(AGRONOMIC_32_FEATURE_LABELS.length, 32);


  for (let i = 0; i < 32; i++) {
    const val = normalized.continuousVector32[i];
    const label = normalized.featureLabels32[i];
    assert.ok(Number.isFinite(val), `Dimension ${i} (${label}) is not finite: ${val}`);
    assert.ok(
      val >= 0.0 && val <= 1.0,
      `Dimension ${i} (${label}) must be bounded in [0, 1], got ${val}`
    );
  }


  assert.ok(normalized.provenance.phH2o.source === "MEAS");
  assert.equal(normalized.provenance.phH2o.confidenceWeight, 1.0);
  assert.ok(normalized.overallConfidenceScore > 0.5 && normalized.overallConfidenceScore <= 1.0);
});

test("normalizeFieldInputsToScientificVector enforces dynamic salinity floor from irrigation water", () => {

  const normalized = normalizeFieldInputsToScientificVector({
    measured: {
      eceDsm: 1.5,
      irrigationEcwDsm: 4.0,
    },
    estimated: {},
    eoPrior: {},
  });


  assert.ok(
    normalized.soilChemical.eceDsm >= 4.0,
    `Root zone ECe (${normalized.soilChemical.eceDsm}) should respect the irrigation salinity floor of 4.0 dS/m`
  );
});

test("buildAiInputContract outputs well-formed AI inference payload", () => {
  const contract = buildAiInputContract({
    fieldId: "test_parcel_42",
    centroid: { lat: 31.05, lon: 30.55 },
    measured: { phH2o: 8.1, eceDsm: 2.5 },
  });

  assert.equal(contract.schemaVersion, "agrorotate.ai.input/v1");
  assert.equal(contract.fieldId, "test_parcel_42");
  assert.equal(contract.normalizedVector32.length, 32);
  assert.equal(contract.featureLabels.length, 32);
  assert.ok(contract.features.edaphicPhysical.length > 0);
  assert.ok(contract.features.edaphicChemical.length > 0);
  assert.ok(contract.features.pathogenRisks.length > 0);
  assert.ok(contract.features.hydrologyClimate.length > 0);
});

test("computeSaxtonRawlsHydraulics enforces strict ordering even under extreme bulk density and heavy clay", () => {

  const extreme = computeSaxtonRawlsHydraulics(10, 65, 1.0, "SEVERE_PLOWPAN", 1.95);
  assert.ok(
    extreme.saturationVolPct > extreme.fieldCapacityVolPct,
    `Saturation (${extreme.saturationVolPct}%) must exceed FC (${extreme.fieldCapacityVolPct}%) under extreme compaction`
  );
  assert.ok(
    extreme.fieldCapacityVolPct > extreme.wiltingPointVolPct,
    `FC (${extreme.fieldCapacityVolPct}%) must exceed PWP (${extreme.wiltingPointVolPct}%) under extreme compaction`
  );
  assert.ok(extreme.wiltingPointVolPct > 0, "PWP must be positive");


  const pureGravel = computeSaxtonRawlsHydraulics(50, 20, 1.0, undefined, undefined, 1.0);
  assert.equal(pureGravel.awcMmM, 0, "100% coarse fragments must result in 0 AWC");
});

test("workspaceToAgronomicVector & buildAiInputContract bridge full WorkspaceState to 32D AI contract", () => {
  const mockWorkspace = {
    version: 6,
    field: {
      name: "Beheira Plot 4",
      placeLabel: "Damanhour, Beheira",
      areaHa: 5.5,
      areaSource: "drawn",
      boundary: [],
      centroidLat: 31.04,
      centroidLon: 30.47,
      slopeClass: "slight",
      slopeSource: null,
      elevationM: 12,
      elevationSource: null,
      notes: "",
    },
    soil: {
      observations: {
        textureRibbon: "clay",
        compaction: "firm",
        mottling: "few",
        rooting: "moderate",
        surfaceSalt: "patches",
        reactionClue: "alkaline",
        fizz: "strong",
        dispersion: "slight",
        colour: "dark",
      },
      lab: {
        sandPct: "22",
        siltPct: "33",
        clayPct: "45",
        bulkDensity: "1.35",
        ph: "7.9",
        eceDsm: "4.2",
        espPct: "9.5",
        caco3Pct: "12.0",
        socPct: "1.1",
        cec: "28.0",
        no3nPpm: "25",
        olsenPPpm: "16",
        exchangeableKPpm: "240",
      },
      estimates: {},
    },
    water: {
      regime: "deficit_allocation",
      system: "drip",
      source: "river_canal",
      quotaMm: "550",
      ecwDsm: "1.2",
      sarw: "2.5",
      estimates: {},
    },
    climate: {
      status: "ready",
      fetchedAtIso: "2026-11-01T00:00:00Z",
      source: "NASA_POWER",
      summary: {
        annualPrecipMm: 85,
        etoAnnualMm: 1620,
        heatDays35: 28,
      },
      daySample: [],
      error: null,
      cache: "live",
    },
    priorities: {
      preset: "balanced",
      weights: { yield: 4, water: 4, soil: 2, risk: 2 },
      excluded: {},
      previousCropId: "berseem-clover-multi-cut",
    },
    plan: {
      title: "Test Rotation",
      cycle: 1,
      slots: [],
      updatedAtIso: null,
      serverRevisionId: null,
    },
    updatedAtIso: "2026-11-12T00:00:00Z",
  };

  const vector = workspaceToAgronomicVector(mockWorkspace);
  assert.equal(vector.continuousVector32.length, 32);
  assert.equal(vector.featureLabels32.length, 32);
  assert.equal(vector.soilPhysical.usdaTextureClass, "CLAY");
  assert.equal(vector.soilChemical.eceDsm, 4.2);


  assert.equal(vector.soilBiological.pathogenInoculumRisk.ROOT_KNOT_NEMATODE, 0.02);
  assert.equal(vector.soilBiological.pathogenInoculumRisk.VASCULAR_WILT_COMPLEX, 0.02);
  assert.equal(vector.soilBiological.pathogenInoculumRisk.ALLIUM_WHITE_ROT, 0.02);


  const contract = buildAiInputContract(mockWorkspace);
  assert.equal(contract.schemaVersion, "agrorotate.ai.input/v1");
  assert.equal(contract.fieldId, "Beheira Plot 4");
  assert.equal(contract.centroid.lat, 31.04);
  assert.equal(contract.normalizedVector32.length, 32);
  assert.ok(contract.overallConfidence > 0.75);
});

test("clean start workspace produces null centroid and zero invented Kom Hamada mock coordinates", () => {
  const cleanContract = buildAiInputContractFromWorkspace(DEFAULT_WORKSPACE);
  assert.equal(cleanContract.centroid, null, "Default clean workspace must have null centroid");
  assert.equal(cleanContract.normalizedVector32.length, 32);
  assert.notEqual(cleanContract.fieldId, "Kom Hamada");
});
