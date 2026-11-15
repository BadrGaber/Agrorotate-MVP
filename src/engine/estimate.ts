/**
 * Pedotransfer functions and the agronomic vector engine.
 *
 * Field observations are EST proxies defined in src/data/observationProxy.ts;
 * a typed lab number is MEAS. The old estimate-option catalogue that could
 * write a midpoint into a lab field was removed on purpose.
 */

// ============================================================================
// PEDOTRANSFER FUNCTIONS (PTF) & 32-DIM NORMALIZED AGRONOMIC VECTOR ENGINE
// ============================================================================

import type {
  AiInputContract,
  DataProvenance,
  FeatureProvenanceMeta,
  IrrigationSystemType,
  NormalizedAgronomicVector,
  SimplifiedCalcareousClass,
  SimplifiedCompactionState,
  SimplifiedDrainageClass,
  SimplifiedInfiltrationState,
  SimplifiedNitrogenHistoryClass,
  SimplifiedPhosphorusHistoryClass,
  SimplifiedPotassiumHistoryClass,
  SimplifiedRootDepthClass,
  SimplifiedSalinityClass,
  SimplifiedSodicityClass,
  SimplifiedSoilColorSomClass,
  SimplifiedSoilReactionClass,
  SimplifiedTextureGroup,
  SimplifiedWaterSourceType,
  SoilBornePathogenGroup,
  UsdaTextureClass,
  WaterSupplyRegime,
  WorkspaceState,
} from "../state/model";

export interface TextureCentroidRow {
  usdaClass: UsdaTextureClass;
  sand: number;
  silt: number;
  clay: number;
  baseBulkDensity: number;
  baseKsatMmHr: number;
  baseSaturationVolPct: number;
  baseFcVolPct: number;
  basePwpVolPct: number;
  baseAwcMmM: number;
}

export const TEXTURE_LOOKUP: Record<UsdaTextureClass, TextureCentroidRow> = {
  SAND: {
    usdaClass: "SAND",
    sand: 90,
    silt: 6,
    clay: 4,
    baseBulkDensity: 1.62,
    baseKsatMmHr: 115.0,
    baseSaturationVolPct: 41.0,
    baseFcVolPct: 9.0,
    basePwpVolPct: 4.0,
    baseAwcMmM: 50,
  },
  LOAMY_SAND: {
    usdaClass: "LOAMY_SAND",
    sand: 82,
    silt: 11,
    clay: 7,
    baseBulkDensity: 1.56,
    baseKsatMmHr: 65.0,
    baseSaturationVolPct: 42.5,
    baseFcVolPct: 12.5,
    basePwpVolPct: 5.5,
    baseAwcMmM: 70,
  },
  SANDY_LOAM: {
    usdaClass: "SANDY_LOAM",
    sand: 65,
    silt: 23,
    clay: 12,
    baseBulkDensity: 1.48,
    baseKsatMmHr: 28.0,
    baseSaturationVolPct: 44.0,
    baseFcVolPct: 19.5,
    basePwpVolPct: 8.5,
    baseAwcMmM: 110,
  },
  LOAM: {
    usdaClass: "LOAM",
    sand: 41,
    silt: 41,
    clay: 18,
    baseBulkDensity: 1.41,
    baseKsatMmHr: 14.0,
    baseSaturationVolPct: 46.0,
    baseFcVolPct: 27.0,
    basePwpVolPct: 12.0,
    baseAwcMmM: 150,
  },
  SILT_LOAM: {
    usdaClass: "SILT_LOAM",
    sand: 21,
    silt: 63,
    clay: 16,
    baseBulkDensity: 1.36,
    baseKsatMmHr: 10.5,
    baseSaturationVolPct: 47.5,
    baseFcVolPct: 31.0,
    basePwpVolPct: 12.5,
    baseAwcMmM: 185,
  },
  SILT: {
    usdaClass: "SILT",
    sand: 7,
    silt: 86,
    clay: 7,
    baseBulkDensity: 1.34,
    baseKsatMmHr: 8.0,
    baseSaturationVolPct: 48.0,
    baseFcVolPct: 32.0,
    basePwpVolPct: 11.0,
    baseAwcMmM: 210,
  },
  SANDY_CLAY_LOAM: {
    usdaClass: "SANDY_CLAY_LOAM",
    sand: 58,
    silt: 15,
    clay: 27,
    baseBulkDensity: 1.46,
    baseKsatMmHr: 8.5,
    baseSaturationVolPct: 43.5,
    baseFcVolPct: 26.5,
    basePwpVolPct: 16.5,
    baseAwcMmM: 100,
  },
  CLAY_LOAM: {
    usdaClass: "CLAY_LOAM",
    sand: 32,
    silt: 34,
    clay: 34,
    baseBulkDensity: 1.37,
    baseKsatMmHr: 4.8,
    baseSaturationVolPct: 47.0,
    baseFcVolPct: 35.5,
    basePwpVolPct: 19.5,
    baseAwcMmM: 160,
  },
  SILTY_CLAY_LOAM: {
    usdaClass: "SILTY_CLAY_LOAM",
    sand: 10,
    silt: 56,
    clay: 34,
    baseBulkDensity: 1.32,
    baseKsatMmHr: 3.5,
    baseSaturationVolPct: 49.0,
    baseFcVolPct: 38.0,
    basePwpVolPct: 20.5,
    baseAwcMmM: 175,
  },
  SANDY_CLAY: {
    usdaClass: "SANDY_CLAY",
    sand: 51,
    silt: 7,
    clay: 42,
    baseBulkDensity: 1.42,
    baseKsatMmHr: 2.2,
    baseSaturationVolPct: 44.5,
    baseFcVolPct: 34.0,
    basePwpVolPct: 23.5,
    baseAwcMmM: 105,
  },
  SILTY_CLAY: {
    usdaClass: "SILTY_CLAY",
    sand: 7,
    silt: 46,
    clay: 47,
    baseBulkDensity: 1.28,
    baseKsatMmHr: 1.5,
    baseSaturationVolPct: 51.0,
    baseFcVolPct: 41.5,
    basePwpVolPct: 27.0,
    baseAwcMmM: 145,
  },
  CLAY: {
    usdaClass: "CLAY",
    sand: 20,
    silt: 30,
    clay: 50,
    baseBulkDensity: 1.25,
    baseKsatMmHr: 2.0,
    baseSaturationVolPct: 52.0,
    baseFcVolPct: 42.0,
    basePwpVolPct: 28.0,
    baseAwcMmM: 140,
  },
  VERTIC_HEAVY_CLAY: {
    usdaClass: "VERTIC_HEAVY_CLAY",
    sand: 12,
    silt: 23,
    clay: 65,
    baseBulkDensity: 1.18,
    baseKsatMmHr: 0.6,
    baseSaturationVolPct: 55.0,
    baseFcVolPct: 47.5,
    basePwpVolPct: 34.0,
    baseAwcMmM: 135,
  },
};

export const GROUP_TO_USDA_CLASS: Record<SimplifiedTextureGroup, UsdaTextureClass> = {
  COARSE_SANDY: "LOAMY_SAND",
  LIGHT_LOAMY: "SANDY_LOAM",
  MEDIUM_SILTY_LOAM: "LOAM",
  MEDIUM_CLAY_LOAM: "CLAY_LOAM",
  HEAVY_CLAY: "CLAY",
  EXTREME_VERTIC_CLAY: "VERTIC_HEAVY_CLAY",
};

/**
 * Observation key -> engine class. The Soil page imports these maps so the
 * number shown beside an answer is the exact value the engine substitutes,
 * not a second, hand-written explanation that can drift from the code.
 */
export const TEXTURE_GROUP_BY_OBSERVATION: Record<string, SimplifiedTextureGroup> = {
  sandy: "COARSE_SANDY",
  loamy: "LIGHT_LOAMY",
  silty: "MEDIUM_SILTY_LOAM",
  clay: "HEAVY_CLAY",
};

export const COMPACTION_BY_OBSERVATION: Record<string, SimplifiedCompactionState> = {
  loose: "LOOSE_FRIABLE",
  friable: "MODERATE_TILTH",
  firm: "COMPACTED_DENSE",
  hardpan: "SEVERE_PLOWPAN",
};

export const DRAINAGE_BY_OBSERVATION: Record<string, SimplifiedDrainageClass> = {
  none: "WELL_DRAINED",
  few: "MODERATELY_WELL_DRAINED",
  common: "SOMEWHAT_POORLY_DRAINED",
};

export const SALINITY_BY_OBSERVATION: Record<string, SimplifiedSalinityClass> = {
  none: "NON_SALINE",
  patches: "MODERATELY_SALINE",
  crust: "STRONGLY_SALINE",
};

export const REACTION_BY_OBSERVATION: Record<string, SimplifiedSoilReactionClass> = {
  acid: "SLIGHTLY_ACIDIC",
  neutral: "NEUTRAL_OPTIMAL",
  alkaline: "CALCAREOUS_ALKALINE",
};

export const COLOR_BY_OBSERVATION: Record<string, SimplifiedSoilColorSomClass> = {
  dark: "DARK_BROWN_RICH",
  medium: "MEDIUM_BROWN",
  pale: "VERY_PALE_DESERT",
};

export const COMPACTION_BULK_DENSITY_DELTA: Record<SimplifiedCompactionState, number> = {
  LOOSE_FRIABLE: -0.08,
  MODERATE_TILTH: 0.0,
  COMPACTED_DENSE: 0.12,
  SEVERE_PLOWPAN: 0.22,
};

export const DRAINAGE_LOOKUP: Record<
  SimplifiedDrainageClass,
  { index: number; wtCm: number; aerationStress: number }
> = {
  EXCESSIVELY_DRAINED: { index: 5.0, wtCm: 300, aerationStress: 0.0 },
  WELL_DRAINED: { index: 4.0, wtCm: 180, aerationStress: 0.0 },
  MODERATELY_WELL_DRAINED: { index: 3.0, wtCm: 110, aerationStress: 0.08 },
  SOMEWHAT_POORLY_DRAINED: { index: 2.0, wtCm: 60, aerationStress: 0.25 },
  POORLY_DRAINED_WATERLOGGED: { index: 1.0, wtCm: 30, aerationStress: 0.6 },
};

export const SALINITY_ECE: Record<SimplifiedSalinityClass, number> = {
  NON_SALINE: 1.1,
  SLIGHTLY_SALINE: 3.0,
  MODERATELY_SALINE: 6.0,
  STRONGLY_SALINE: 11.5,
  EXTREMELY_SALINE_SABKHA: 20.0,
};

export const REACTION_PH: Record<SimplifiedSoilReactionClass, number> = {
  STRONGLY_ACIDIC: 5.0,
  SLIGHTLY_ACIDIC: 6.1,
  NEUTRAL_OPTIMAL: 7.1,
  CALCAREOUS_ALKALINE: 8.0,
  STRONGLY_ALKALINE_SODIC: 8.9,
};

export const COLOR_SOM: Record<SimplifiedSoilColorSomClass, number> = {
  VERY_PALE_DESERT: 0.45,
  LIGHT_BROWN_ARID: 1.05,
  MEDIUM_BROWN: 1.85,
  DARK_BROWN_RICH: 3.1,
  BLACK_HUMIC: 5.2,
};

export const WATER_SOURCE_DEFAULTS: Record<
  SimplifiedWaterSourceType,
  { ecw: number; sarw: number; rsc: number; no3N: number }
> = {
  FRESH_RIVER_CANAL: { ecw: 0.45, sarw: 1.8, rsc: 0.2, no3N: 1.0 },
  MIXED_DRAINAGE_CANAL: { ecw: 1.65, sarw: 6.2, rsc: 1.1, no3N: 4.5 },
  SLIGHTLY_BRACKISH_WELL: { ecw: 2.8, sarw: 9.5, rsc: 1.8, no3N: 6.0 },
  MODERATELY_BRACKISH_WELL: { ecw: 4.5, sarw: 14.0, rsc: 2.4, no3N: 3.0 },
  HIGHLY_BRACKISH_WELL: { ecw: 7.2, sarw: 20.0, rsc: 3.2, no3N: 2.0 },
  TREATED_WASTEWATER: { ecw: 1.9, sarw: 7.0, rsc: 1.5, no3N: 18.0 },
};

export const WATER_SOURCE_BY_UI: Record<string, SimplifiedWaterSourceType> = {
  river_canal: "FRESH_RIVER_CANAL",
  groundwater: "MODERATELY_BRACKISH_WELL",
  reclaimed: "TREATED_WASTEWATER",
  mixed: "MIXED_DRAINAGE_CANAL",
};

/**
 * Classifies exact (%Sand, %Silt, %Clay) into the USDA 12-class textural triangle.
 */
export function classifyUsdaSoilTexture(sand: number, silt: number, clay: number): UsdaTextureClass {
  if (clay >= 60) return "VERTIC_HEAVY_CLAY";
  if (silt + 1.5 * clay < 15) return "SAND";
  if (silt + 1.5 * clay >= 15 && silt + 2.0 * clay < 30) return "LOAMY_SAND";
  if (
    (clay >= 7 && clay < 20 && sand > 52 && silt + 2.0 * clay >= 30) ||
    (clay < 7 && silt < 50 && silt + 2.0 * clay >= 30)
  ) {
    return "SANDY_LOAM";
  }
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return "LOAM";
  if ((silt >= 50 && clay >= 12 && clay < 27) || (silt >= 50 && silt < 80 && clay < 12)) {
    return "SILT_LOAM";
  }
  if (silt >= 80 && clay < 12) return "SILT";
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return "SANDY_CLAY_LOAM";
  if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) return "CLAY_LOAM";
  if (clay >= 27 && clay < 40 && sand <= 20) return "SILTY_CLAY_LOAM";
  if (clay >= 35 && sand > 45) return "SANDY_CLAY";
  if (clay >= 40 && silt >= 40) return "SILTY_CLAY";
  return "CLAY";
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function buildMeta(value: number, source: DataProvenance, relUncertainty: number): FeatureProvenanceMeta {
  const weight = source === "MEAS" ? 1.0 : source === "EST" ? 0.75 : 0.5;
  return {
    source,
    confidenceWeight: weight,
    lowerBound95: Number((value * (1 - relUncertainty)).toFixed(3)),
    upperBound95: Number((value * (1 + relUncertainty)).toFixed(3)),
    uncertaintyPct: Number((relUncertainty * 100).toFixed(1)),
  };
}

/**
 * Saxton & Rawls (2006) Continuous Hydraulic Pedotransfer Equations.
 * Computes PWP, Field Capacity, Saturation, Bulk Density, AWC, and Ksat.
 */
export function computeSaxtonRawlsHydraulics(
  sandPercent: number,
  clayPercent: number,
  somPercent: number,
  compactionState?: SimplifiedCompactionState,
  bulkDensityOverride?: number,
  coarseFragmentFrac = 0.02,
  espPercent = 4.0
) {
  const S = sandPercent / 100.0;
  const C = clayPercent / 100.0;
  const OM = clamp(somPercent, 0.2, 8.0);

  // 1. Permanent Wilting Point (theta_1500, fraction v/v)
  const theta1500t =
    -0.024 * S +
    0.487 * C +
    0.006 * OM +
    0.005 * (S * OM) -
    0.013 * (C * OM) +
    0.068 * (S * C) +
    0.031;
  const ptfPwpFrac = clamp(theta1500t + (0.14 * theta1500t - 0.02), 0.02, 0.38);

  // 2. Field Capacity (theta_33, fraction v/v)
  const theta33t =
    -0.251 * S +
    0.195 * C +
    0.011 * OM +
    0.006 * (S * OM) -
    0.027 * (C * OM) +
    0.452 * (S * C) +
    0.299;
  const thetaFcNormalFrac = clamp(
    theta33t + (1.283 * theta33t * theta33t - 0.374 * theta33t - 0.015),
    ptfPwpFrac + 0.04,
    0.55
  );

  // 3. Normal Saturation and Bulk Density
  const thetaS33t =
    0.278 * S +
    0.034 * C +
    0.022 * OM -
    0.018 * (S * OM) -
    0.027 * (C * OM) -
    0.584 * (S * C) +
    0.078;
  const thetaS33 = thetaS33t + (0.636 * thetaS33t - 0.107);
  const thetaSatNormalFrac = clamp(thetaFcNormalFrac + thetaS33 - 0.097 * S + 0.043, 0.35, 0.62);
  const rhoNormal = (1.0 - thetaSatNormalFrac) * 2.65;

  // 4. Compaction Adjustment
  const compDelta = compactionState ? COMPACTION_BULK_DENSITY_DELTA[compactionState] : 0.0;
  const bulkDensityGCm3 = bulkDensityOverride !== undefined
    ? clamp(bulkDensityOverride, 0.85, 1.95)
    : clamp(rhoNormal + compDelta, 0.95, 1.88);

  const thetaSatAdjFrac = clamp(1.0 - bulkDensityGCm3 / 2.65, 0.32, 0.62);
  // Strict thermodynamic ordering: 0.02 <= theta_wp < theta_fc < theta_sat
  const maxFc = Math.max(0.05, thetaSatAdjFrac - 0.02);
  const ptfFcAdjRaw = thetaFcNormalFrac - 0.2 * (thetaSatNormalFrac - thetaSatAdjFrac);
  const ptfFcAdjFrac = clamp(ptfFcAdjRaw, 0.04, maxFc);
  const effectivePwpFrac = clamp(ptfPwpFrac, 0.02, Math.max(0.02, ptfFcAdjFrac - 0.02));

  const fieldCapacityVolPct = Number((ptfFcAdjFrac * 100).toFixed(1));
  const wiltingPointVolPct = Number((effectivePwpFrac * 100).toFixed(1));
  const saturationVolPct = Number((thetaSatAdjFrac * 100).toFixed(1));

  // 5. Available Water Capacity (AWC in mm/m)
  const rawAwc = 10.0 * (fieldCapacityVolPct - wiltingPointVolPct) * (1.0 - coarseFragmentFrac);
  const awcMmM = Number(clamp(rawAwc, 0.0, 240.0).toFixed(1));

  // 6. Saturated Hydraulic Conductivity (Ksat) with Sodicity Penalty
  const bSlope =
    (Math.log(1500) - Math.log(33)) /
    (Math.log(fieldCapacityVolPct) - Math.log(wiltingPointVolPct));
  const lambda = 1.0 / Math.max(0.01, bSlope);
  const ksatBase =
    1930.0 * Math.pow(Math.max(0.02, (saturationVolPct - fieldCapacityVolPct) / 100.0), 3.0 - lambda);
  const sodicityKsatFactor = Math.max(0.15, 1.0 - 0.035 * Math.max(0.0, espPercent - 8.0));
  const infiltrationRateMmHr = Number(clamp(ksatBase * sodicityKsatFactor, 0.2, 250.0).toFixed(1));

  return {
    bulkDensityGCm3: Number(bulkDensityGCm3.toFixed(2)),
    fieldCapacityVolPct,
    wiltingPointVolPct,
    saturationVolPct,
    awcMmM,
    infiltrationRateMmHr,
  };
}

export interface NormalizeInputOptions {
  fieldId?: string;
  centroid?: { lat: number; lon: number } | null;
  measured?: {
    sandPercent?: number;
    siltPercent?: number;
    clayPercent?: number;
    coarseFragmentVolFrac?: number;
    bulkDensityGCm3?: number;
    fieldCapacityVolPct?: number;
    wiltingPointVolPct?: number;
    awcMmM?: number;
    infiltrationRateMmHr?: number;
    drainageIndex?: number;
    waterTableDepthCm?: number;
    effectiveRootDepthCm?: number;
    phH2o?: number;
    eceDsm?: number;
    ec1to5Dsm?: number;
    espPercent?: number;
    sareRatio?: number;
    caco3Percent?: number;
    somPercent?: number;
    socPercent?: number;
    cecCmolKg?: number;
    availableNPpm?: number;
    availablePPpm?: number;
    availableKPpm?: number;
    seasonalWaterQuotaM3Ha?: number;
    irrigationEcwDsm?: number;
    irrigationSarw?: number;
    irrigationNo3NPpm?: number;
    irrigationEfficiencyFrac?: number;
    irrigationSystemType?: IrrigationSystemType;
    waterSupplyRegime?: WaterSupplyRegime;
  };
  estimated?: {
    textureGroup?: SimplifiedTextureGroup;
    usdaTextureClass?: UsdaTextureClass;
    compactionState?: SimplifiedCompactionState;
    infiltrationState?: SimplifiedInfiltrationState;
    drainageClass?: SimplifiedDrainageClass;
    rootDepthClass?: SimplifiedRootDepthClass;
    soilReactionClass?: SimplifiedSoilReactionClass;
    salinityClass?: SimplifiedSalinityClass;
    sodicityClass?: SimplifiedSodicityClass;
    calcareousClass?: SimplifiedCalcareousClass;
    soilColorSomClass?: SimplifiedSoilColorSomClass;
    nitrogenHistoryClass?: SimplifiedNitrogenHistoryClass;
    phosphorusHistoryClass?: SimplifiedPhosphorusHistoryClass;
    potassiumHistoryClass?: SimplifiedPotassiumHistoryClass;
    observedPathogens?: SoilBornePathogenGroup[];
    yearsSinceLastHostByPathogen?: Partial<Record<SoilBornePathogenGroup, number>>;
    waterSupplyRegime?: WaterSupplyRegime;
    waterSourceType?: SimplifiedWaterSourceType;
    irrigationSystemType?: IrrigationSystemType;
  };
  eoPrior?: {
    sandPercent?: number;
    siltPercent?: number;
    clayPercent?: number;
    bulkDensityGCm3?: number;
    phH2o?: number;
    socPercent?: number;
    cecCmolKg?: number;
    coarseFragmentVolFrac?: number;
    elevationM?: number;
    slopePercent?: number;
    annualPrecipitationMm?: number;
    annualEt0Mm?: number;
    heatDays35?: number;
    soilMoistureAnomalyIndex?: number;
    rootZoneMoistureVolPct?: number;
  };
  priorities?: {
    yield?: number;
    water?: number;
    soil?: number;
    risk?: number;
  };
  provenanceSources?: {
    areaSource?: "drawn" | "declared" | null;
    slopeSource?: "dem" | "observation" | null;
    elevationSource?: "dem" | "user" | null;
    areaHa?: number | null;
  };
}

/**
 * Standard 32-Dimension Feature Names in exact canonical order:
 */
export const AGRONOMIC_32_FEATURE_LABELS: string[] = [
  "sand_fraction",
  "silt_fraction",
  "clay_fraction",
  "coarse_fragments_fraction",
  "bulk_density_norm",
  "field_capacity_norm",
  "wilting_point_norm",
  "awc_norm",
  "ksat_norm",
  "drainage_index_norm",
  "water_table_depth_norm",
  "root_depth_norm",
  "aeration_stress_norm",
  "ph_norm",
  "ece_norm",
  "esp_norm",
  "caco3_norm",
  "som_norm",
  "cec_norm",
  "avail_n_norm",
  "avail_p_norm",
  "avail_k_norm",
  "nematode_risk",
  "fusarium_wilt_risk",
  "allium_white_rot_risk",
  "orobanche_risk",
  "water_quota_norm",
  "water_ecw_norm",
  "irrigation_efficiency",
  "annual_eto_norm",
  "heat_days_norm",
  "slope_norm",
];

/**
 * Primary Dual-Mode & Three-Tier Normalization Engine.
 * Converts MEAS, EST, and EO_PRIOR inputs into a rigorous NormalizedAgronomicVector (32 continuous dims).
 */
export function normalizeFieldInputsToScientificVector(
  options: NormalizeInputOptions
): NormalizedAgronomicVector {
  const meas = options.measured ?? {};
  const est = options.estimated ?? {};
  const eo = options.eoPrior ?? {};
  const provenance: Record<string, FeatureProvenanceMeta> = {};

  // 1. TEXTURE & PARTICLE SIZE FRACTIONS
  let sandPercent: number;
  let siltPercent: number;
  let clayPercent: number;
  let usdaTextureClass: UsdaTextureClass;
  let textureSource: DataProvenance;

  if (
    meas.sandPercent !== undefined &&
    meas.siltPercent !== undefined &&
    meas.clayPercent !== undefined
  ) {
    const total = meas.sandPercent + meas.siltPercent + meas.clayPercent || 100;
    sandPercent = Number(((meas.sandPercent / total) * 100).toFixed(1));
    siltPercent = Number(((meas.siltPercent / total) * 100).toFixed(1));
    clayPercent = Number(((meas.clayPercent / total) * 100).toFixed(1));
    usdaTextureClass = classifyUsdaSoilTexture(sandPercent, siltPercent, clayPercent);
    textureSource = "MEAS";
  } else if (est.usdaTextureClass) {
    usdaTextureClass = est.usdaTextureClass;
    const row = TEXTURE_LOOKUP[usdaTextureClass];
    sandPercent = row.sand;
    siltPercent = row.silt;
    clayPercent = row.clay;
    textureSource = "EST";
  } else if (est.textureGroup) {
    usdaTextureClass = GROUP_TO_USDA_CLASS[est.textureGroup];
    const row = TEXTURE_LOOKUP[usdaTextureClass];
    sandPercent = row.sand;
    siltPercent = row.silt;
    clayPercent = row.clay;
    textureSource = "EST";
  } else {
    sandPercent = eo.sandPercent ?? 32.0;
    siltPercent = eo.siltPercent ?? 34.0;
    clayPercent = eo.clayPercent ?? 34.0;
    const total = sandPercent + siltPercent + clayPercent || 100;
    sandPercent = Number(((sandPercent / total) * 100).toFixed(1));
    siltPercent = Number(((siltPercent / total) * 100).toFixed(1));
    clayPercent = Number(((clayPercent / total) * 100).toFixed(1));
    usdaTextureClass = classifyUsdaSoilTexture(sandPercent, siltPercent, clayPercent);
    textureSource = "EO_PRIOR";
  }
  provenance.soilTexture = buildMeta(
    clayPercent,
    textureSource,
    textureSource === "MEAS" ? 0.04 : textureSource === "EST" ? 0.16 : 0.28
  );

  const coarseFragmentVolFrac = clamp(
    meas.coarseFragmentVolFrac ?? eo.coarseFragmentVolFrac ?? 0.02,
    0.0,
    0.60
  );

  // 2. SOIL ORGANIC MATTER (SOM% & SOC%)
  let somPercent: number;
  let somSource: DataProvenance;
  if (meas.somPercent !== undefined) {
    somPercent = clamp(meas.somPercent, 0.15, 12.0);
    somSource = "MEAS";
  } else if (meas.socPercent !== undefined) {
    somPercent = clamp(meas.socPercent * 1.724, 0.15, 12.0);
    somSource = "MEAS";
  } else if (est.soilColorSomClass) {
    const baseSom = COLOR_SOM[est.soilColorSomClass];
    const clayStabilization = 0.75 + 0.008 * clayPercent;
    somPercent = Number(clamp(baseSom * clayStabilization, 0.2, 10.0).toFixed(2));
    somSource = "EST";
  } else {
    somPercent = Number(clamp((eo.socPercent ?? 0.8) * 1.724, 0.2, 10.0).toFixed(2));
    somSource = "EO_PRIOR";
  }
  const socPercent = Number((somPercent / 1.724).toFixed(2));
  provenance.somPercent = buildMeta(
    somPercent,
    somSource,
    somSource === "MEAS" ? 0.05 : somSource === "EST" ? 0.20 : 0.35
  );

  // 3. CHEMICAL FACTORS (pH, ECe, ESP, CaCO3, CEC)
  let phH2o: number;
  let phSource: DataProvenance;
  if (meas.phH2o !== undefined) {
    phH2o = clamp(meas.phH2o, 3.5, 10.5);
    phSource = "MEAS";
  } else if (est.soilReactionClass) {
    phH2o = REACTION_PH[est.soilReactionClass];
    phSource = "EST";
  } else {
    phH2o = clamp(eo.phH2o ?? 7.8, 4.0, 9.5);
    phSource = "EO_PRIOR";
  }
  provenance.phH2o = buildMeta(phH2o, phSource, phSource === "MEAS" ? 0.02 : 0.08);

  // Water source defaults
  const wDef = WATER_SOURCE_DEFAULTS[est.waterSourceType ?? "FRESH_RIVER_CANAL"];
  const irrigationEcwDsm = clamp(meas.irrigationEcwDsm ?? wDef.ecw, 0.1, 15.0);
  const irrigationSarw = clamp(meas.irrigationSarw ?? wDef.sarw, 0.1, 35.0);
  const steadyStateSalinityFloorDsm = Number((irrigationEcwDsm * 1.5).toFixed(2));

  let eceDsm: number;
  let eceSource: DataProvenance;
  if (meas.eceDsm !== undefined) {
    eceDsm = clamp(Math.max(meas.eceDsm, irrigationEcwDsm), 0.1, 50.0);
    eceSource = "MEAS";
  } else if (meas.ec1to5Dsm !== undefined) {
    const kTex = clayPercent > 35 ? 6.5 : sandPercent > 65 ? 12.5 : 9.0;
    eceDsm = clamp(Math.max(meas.ec1to5Dsm * kTex, irrigationEcwDsm), 0.1, 50.0);
    eceSource = "MEAS";
  } else if (est.salinityClass) {
    eceDsm = Math.max(SALINITY_ECE[est.salinityClass], steadyStateSalinityFloorDsm * 0.85);
    eceSource = "EST";
  } else {
    eceDsm = Math.max(1.2, steadyStateSalinityFloorDsm);
    eceSource = "EO_PRIOR";
  }
  provenance.eceDsm = buildMeta(eceDsm, eceSource, eceSource === "MEAS" ? 0.05 : 0.25);

  let espPercent: number;
  let espSource: DataProvenance;
  if (meas.espPercent !== undefined) {
    espPercent = clamp(meas.espPercent, 0.5, 65.0);
    espSource = "MEAS";
  } else if (meas.sareRatio !== undefined) {
    const x = -0.0126 + 0.01475 * meas.sareRatio;
    espPercent = clamp((100 * x) / (1 + x), 0.5, 65.0);
    espSource = "MEAS";
  } else if (est.sodicityClass) {
    const sodMap: Record<SimplifiedSodicityClass, number> = {
      NON_SODIC_FLOCCULATED: 3.5,
      SLIGHTLY_SODIC: 9.5,
      MODERATELY_SODIC: 17.5,
      STRONGLY_SODIC_ALKALI: 30.0,
    };
    espPercent = sodMap[est.sodicityClass];
    espSource = "EST";
  } else {
    espPercent = phH2o > 8.5 ? 16.0 : irrigationSarw > 10 ? 12.0 : 4.0;
    espSource = "EO_PRIOR";
  }
  provenance.espPercent = buildMeta(espPercent, espSource, espSource === "MEAS" ? 0.06 : 0.25);

  let caco3Percent: number;
  let caco3Source: DataProvenance;
  if (meas.caco3Percent !== undefined) {
    caco3Percent = clamp(meas.caco3Percent, 0.0, 65.0);
    caco3Source = "MEAS";
  } else if (est.calcareousClass) {
    const calcMap: Record<SimplifiedCalcareousClass, number> = {
      NON_CALCAREOUS: 0.8,
      SLIGHTLY_CALCAREOUS: 3.5,
      MODERATELY_CALCAREOUS: 11.0,
      HIGHLY_CALCAREOUS_MARL: 26.0,
    };
    caco3Percent = calcMap[est.calcareousClass];
    caco3Source = "EST";
  } else {
    caco3Percent = phH2o >= 7.8 ? 8.5 : phH2o >= 7.3 ? 2.5 : 0.5;
    caco3Source = "EO_PRIOR";
  }
  provenance.caco3Percent = buildMeta(caco3Percent, caco3Source, caco3Source === "MEAS" ? 0.05 : 0.30);

  let cecCmolKg: number;
  let cecSource: DataProvenance;
  if (meas.cecCmolKg !== undefined) {
    cecCmolKg = clamp(meas.cecCmolKg, 1.5, 65.0);
    cecSource = "MEAS";
  } else {
    const mineralFactor = usdaTextureClass === "VERTIC_HEAVY_CLAY" ? 0.75 : 0.55;
    const ptfCec = mineralFactor * clayPercent + 2.0 * somPercent;
    cecCmolKg = Number(clamp(ptfCec, 2.0, 60.0).toFixed(1));
    // CEC is derived by a pedotransfer function here, never measured. A MEAS
    // label is reserved for a CEC typed from the lab report, even when the
    // texture fractions that feed the PTF are themselves measured.
    cecSource = "EST";
  }
  provenance.cecCmolKg = buildMeta(cecCmolKg, cecSource, cecSource === "MEAS" ? 0.05 : 0.20);

  // 4. HYDRAULIC PTFs VIA SAXTON & RAWLS (2006)
  const hydraulics = computeSaxtonRawlsHydraulics(
    sandPercent,
    clayPercent,
    somPercent,
    est.compactionState,
    meas.bulkDensityGCm3 ?? eo.bulkDensityGCm3,
    coarseFragmentVolFrac,
    espPercent
  );

  const bulkDensityGCm3 = hydraulics.bulkDensityGCm3;
  const fieldCapacityVolPct = meas.fieldCapacityVolPct ?? hydraulics.fieldCapacityVolPct;
  const wiltingPointVolPct = meas.wiltingPointVolPct ?? hydraulics.wiltingPointVolPct;
  const saturationVolPct = hydraulics.saturationVolPct;
  const awcMmM = meas.awcMmM ?? hydraulics.awcMmM;
  const infiltrationRateMmHr = meas.infiltrationRateMmHr ?? hydraulics.infiltrationRateMmHr;

  provenance.bulkDensityGCm3 = buildMeta(bulkDensityGCm3, meas.bulkDensityGCm3 ? "MEAS" : "EST", 0.08);
  provenance.awcMmM = buildMeta(awcMmM, meas.awcMmM ? "MEAS" : "EST", 0.15);

  // Drainage & Root Depth
  let drainageIndex: number;
  let waterTableDepthCm: number;
  let aerationStressFactor: number;
  if (meas.drainageIndex !== undefined) {
    drainageIndex = clamp(meas.drainageIndex, 1.0, 5.0);
    waterTableDepthCm = clamp(meas.waterTableDepthCm ?? drainageIndex * 45, 15, 500);
    aerationStressFactor = clamp((4.0 - drainageIndex) * 0.18, 0.0, 0.65);
  } else if (est.drainageClass) {
    const dRow = DRAINAGE_LOOKUP[est.drainageClass];
    drainageIndex = dRow.index;
    waterTableDepthCm = meas.waterTableDepthCm ?? dRow.wtCm;
    aerationStressFactor = dRow.aerationStress;
  } else {
    drainageIndex = clayPercent > 45 ? 2.5 : sandPercent > 70 ? 4.5 : 3.8;
    waterTableDepthCm = Math.round(drainageIndex * 42);
    aerationStressFactor = clamp((4.0 - drainageIndex) * 0.18, 0.0, 0.60);
  }

  const rootDepthMap: Record<SimplifiedRootDepthClass, number> = {
    VERY_SHALLOW: 22,
    SHALLOW: 45,
    MODERATELY_DEEP: 80,
    DEEP: 125,
    VERY_DEEP: 170,
  };
  const rawRootDepth =
    meas.effectiveRootDepthCm ??
    (est.rootDepthClass ? rootDepthMap[est.rootDepthClass] : 115);
  const plowpanCap = est.compactionState === "SEVERE_PLOWPAN" && !meas.effectiveRootDepthCm ? 40 : 250;
  const effectiveRootDepthCm = clamp(
    Math.min(rawRootDepth, waterTableDepthCm - 15, plowpanCap),
    15,
    250
  );

  // 5. NUTRIENTS (N, P, K)
  const nHistoryMap: Record<SimplifiedNitrogenHistoryClass, number> = {
    DEPLETED_CEREAL_EXHAUSTIVE: 8.0,
    MODERATE_BASELINE: 18.0,
    ENRICHED_GRAIN_LEGUME: 32.0,
    HIGH_FORAGE_LEGUME_MANURE: 48.0,
  };
  const availableNPpm = meas.availableNPpm !== undefined
    ? clamp(meas.availableNPpm, 2.0, 150.0)
    : Number(
        clamp(
          (est.nitrogenHistoryClass ? nHistoryMap[est.nitrogenHistoryClass] : 16.0) + 6.5 * somPercent,
          4.0,
          120.0
        ).toFixed(1)
      );
  const availableNStockKgHa = Number((availableNPpm * bulkDensityGCm3 * 3.0).toFixed(1));

  const pHistoryMap: Record<SimplifiedPhosphorusHistoryClass, number> = {
    LOW_UNFERTILIZED: 5.5,
    MODERATE_MAINTENANCE: 14.0,
    HIGH_INTENSIVE_VEG: 28.0,
  };
  const calcPFixation = caco3Percent > 10.0 ? 0.75 : 1.0;
  const availablePPpm = meas.availablePPpm !== undefined
    ? clamp(meas.availablePPpm, 1.0, 100.0)
    : Number(((est.phosphorusHistoryClass ? pHistoryMap[est.phosphorusHistoryClass] : 12.0) * calcPFixation).toFixed(1));

  const kHistoryMap: Record<SimplifiedPotassiumHistoryClass, number> = {
    LOW_SANDY_LEACHED: 45.0,
    ADEQUATE_LOAMY: 120.0,
    HIGH_ILLITIC_CLAY: 220.0,
  };
  const availableKPpm = meas.availableKPpm !== undefined
    ? clamp(meas.availableKPpm, 15.0, 900.0)
    : Number(
        clamp(
          (est.potassiumHistoryClass ? kHistoryMap[est.potassiumHistoryClass] : 110.0) + 4.2 * clayPercent,
          25.0,
          750.0
        ).toFixed(0)
      );

  // 6. PATHOGENS
  const allPathogens: SoilBornePathogenGroup[] = [
    "ROOT_KNOT_NEMATODE",
    "VASCULAR_WILT_COMPLEX",
    "ALLIUM_WHITE_ROT",
    "OROBANCHE_BROOMRAPE",
    "RHIZOCTONIA_PYTHIUM_ROT",
    "CYST_NEMATODE",
  ];
  const decayConstantsYr: Record<SoilBornePathogenGroup, number> = {
    ROOT_KNOT_NEMATODE: 0.55,
    VASCULAR_WILT_COMPLEX: 0.22,
    ALLIUM_WHITE_ROT: 0.08,
    OROBANCHE_BROOMRAPE: 0.12,
    RHIZOCTONIA_PYTHIUM_ROT: 0.45,
    CYST_NEMATODE: 0.30,
  };
  const pathogenInoculumRisk = {} as Record<SoilBornePathogenGroup, number>;
  for (const pGroup of allPathogens) {
    if (est.observedPathogens?.includes(pGroup)) {
      const yrs = est.yearsSinceLastHostByPathogen?.[pGroup] ?? 0;
      const decayed = 0.85 * Math.exp(-decayConstantsYr[pGroup] * yrs);
      pathogenInoculumRisk[pGroup] = Number(clamp(decayed, 0.05, 0.95).toFixed(2));
    } else {
      pathogenInoculumRisk[pGroup] = 0.02;
    }
  }

  // 7. WATER & IRRIGATION
  const waterSupplyRegime: WaterSupplyRegime =
    meas.waterSupplyRegime ?? est.waterSupplyRegime ?? "FULL_IRRIGATION";

  const defaultSeasonalQuotaMap: Record<WaterSupplyRegime, number> = {
    RAINFED: 0,
    SUPPLEMENTARY: 1800,
    DEFICIT_ALLOCATION: 4200,
    FULL_IRRIGATION: 9500,
  };
  const seasonalWaterQuotaM3Ha =
    meas.seasonalWaterQuotaM3Ha ?? defaultSeasonalQuotaMap[waterSupplyRegime];

  const irrigationSystemType: IrrigationSystemType =
    meas.irrigationSystemType ?? est.irrigationSystemType ?? "SURFACE_DRIP";

  const systemSpecs: Record<
    IrrigationSystemType,
    { eff: number; wettedFrac: number; foliarMult: number }
  > = {
    FLOOD_BASIN:         { eff: 0.55, wettedFrac: 1.00, foliarMult: 1.10 },
    FURROW_CORRUGATION:  { eff: 0.65, wettedFrac: 0.65, foliarMult: 1.05 },
    SPRINKLER_SOLID_SET: { eff: 0.75, wettedFrac: 1.00, foliarMult: 1.55 },
    CENTER_PIVOT_LEPA:   { eff: 0.82, wettedFrac: 0.90, foliarMult: 1.35 },
    SURFACE_DRIP:        { eff: 0.90, wettedFrac: 0.35, foliarMult: 0.80 },
    SUBSURFACE_DRIP_SDI: { eff: 0.94, wettedFrac: 0.30, foliarMult: 0.70 },
  };
  const sysSpec = systemSpecs[irrigationSystemType];
  const applicationEfficiencyFrac = meas.irrigationEfficiencyFrac ?? sysSpec.eff;
  const isDrip = irrigationSystemType === "SURFACE_DRIP" || irrigationSystemType === "SUBSURFACE_DRIP_SDI";
  const dripOsmoticBufferBonusDsm = isDrip ? Number((0.20 * eceDsm).toFixed(2)) : 0.0;
  const permeabilityHazardPenaltyFrac = irrigationEcwDsm < 0.15 * irrigationSarw + 0.1 ? 0.35 : 0.0;

  // 8. EO & CLIMATE
  const elevationM = eo.elevationM ?? 18;
  const slopePercent = eo.slopePercent ?? 1.2;
  const annualPrecipitationMm = eo.annualPrecipitationMm ?? 48;
  const annualEt0Mm = eo.annualEt0Mm ?? 1680;
  const aridityIndex = Number((annualPrecipitationMm / Math.max(1, annualEt0Mm)).toFixed(3));
  const heatDays35 = eo.heatDays35 ?? 34;

  // 9. CONSTRUCT EXACT 32 CONTINUOUS NORMALIZED DIMENSIONS [0.0, 1.0]
  const continuousVector32: number[] = [
    Number((sandPercent / 100.0).toFixed(4)),                                        // [0] sand_fraction
    Number((siltPercent / 100.0).toFixed(4)),                                        // [1] silt_fraction
    Number((clayPercent / 100.0).toFixed(4)),                                        // [2] clay_fraction
    Number((coarseFragmentVolFrac / 0.60).toFixed(4)),                               // [3] coarse_fragments_fraction
    Number(clamp((bulkDensityGCm3 - 0.85) / (1.95 - 0.85), 0, 1).toFixed(4)),       // [4] bulk_density_norm
    Number(clamp(fieldCapacityVolPct / 60.0, 0, 1).toFixed(4)),                      // [5] field_capacity_norm
    Number(clamp(wiltingPointVolPct / 40.0, 0, 1).toFixed(4)),                       // [6] wilting_point_norm
    Number(clamp(awcMmM / 250.0, 0, 1).toFixed(4)),                                  // [7] awc_norm
    Number(clamp(infiltrationRateMmHr / 250.0, 0, 1).toFixed(4)),                    // [8] ksat_norm
    Number(clamp((drainageIndex - 1.0) / 4.0, 0, 1).toFixed(4)),                     // [9] drainage_index_norm
    Number(clamp(waterTableDepthCm / 500.0, 0, 1).toFixed(4)),                       // [10] water_table_depth_norm
    Number(clamp(effectiveRootDepthCm / 250.0, 0, 1).toFixed(4)),                    // [11] root_depth_norm
    Number(clamp(aerationStressFactor, 0, 1).toFixed(4)),                            // [12] aeration_stress_norm
    Number(clamp((phH2o - 3.5) / (10.5 - 3.5), 0, 1).toFixed(4)),                   // [13] ph_norm
    Number(clamp(eceDsm / 50.0, 0, 1).toFixed(4)),                                   // [14] ece_norm
    Number(clamp(espPercent / 65.0, 0, 1).toFixed(4)),                               // [15] esp_norm
    Number(clamp(caco3Percent / 65.0, 0, 1).toFixed(4)),                             // [16] caco3_norm
    Number(clamp(somPercent / 12.0, 0, 1).toFixed(4)),                               // [17] som_norm
    Number(clamp(cecCmolKg / 65.0, 0, 1).toFixed(4)),                                // [18] cec_norm
    Number(clamp(availableNPpm / 150.0, 0, 1).toFixed(4)),                           // [19] avail_n_norm
    Number(clamp(availablePPpm / 100.0, 0, 1).toFixed(4)),                           // [20] avail_p_norm
    Number(clamp(availableKPpm / 900.0, 0, 1).toFixed(4)),                           // [21] avail_k_norm
    Number(clamp(pathogenInoculumRisk.ROOT_KNOT_NEMATODE, 0, 1).toFixed(4)),         // [22] nematode_risk
    Number(clamp(pathogenInoculumRisk.VASCULAR_WILT_COMPLEX, 0, 1).toFixed(4)),      // [23] fusarium_wilt_risk
    Number(clamp(pathogenInoculumRisk.ALLIUM_WHITE_ROT, 0, 1).toFixed(4)),           // [24] allium_white_rot_risk
    Number(clamp(pathogenInoculumRisk.OROBANCHE_BROOMRAPE, 0, 1).toFixed(4)),        // [25] orobanche_risk
    Number(clamp(seasonalWaterQuotaM3Ha / 18000.0, 0, 1).toFixed(4)),                // [26] water_quota_norm
    Number(clamp(irrigationEcwDsm / 15.0, 0, 1).toFixed(4)),                         // [27] water_ecw_norm
    Number(clamp(applicationEfficiencyFrac, 0, 1).toFixed(4)),                       // [28] irrigation_efficiency
    Number(clamp(annualEt0Mm / 2500.0, 0, 1).toFixed(4)),                            // [29] annual_eto_norm
    Number(clamp(heatDays35 / 120.0, 0, 1).toFixed(4)),                              // [30] heat_days_norm
    Number(clamp(slopePercent / 45.0, 0, 1).toFixed(4)),                             // [31] slope_norm
  ];

  // 10. FIELD PROVENANCE & UNCERTAINTY CALIBRATION
  if (options.provenanceSources) {
    const ps = options.provenanceSources;
    const nowIso = new Date().toISOString();

    // Spatial location & terrain priors get 0.50 (EO_PRIOR),
    // field observations get 0.75 (EST),
    // direct lab measurements get 1.00 (MEAS).
    const areaTier: DataProvenance = "EO_PRIOR";
    const areaConf = 0.50;
    provenance["fieldArea"] = {
      featureName: "fieldArea",
      source: areaTier,
      confidenceWeight: areaConf,
      rawValue: ps.areaHa ?? 0,
      normalizedValue: 1.0,
      timestamp: nowIso,
    };

    const slopeTier: DataProvenance = ps.slopeSource === "observation" ? "EST" : "EO_PRIOR";
    const slopeConf = ps.slopeSource === "observation" ? 0.75 : 0.50;
    provenance["slope"] = {
      featureName: "slope",
      source: slopeTier,
      confidenceWeight: slopeConf,
      rawValue: slopePercent,
      normalizedValue: Number((slopePercent / 45.0).toFixed(4)),
      timestamp: nowIso,
    };

    const elevTier: DataProvenance = ps.elevationSource === "user" ? "EST" : "EO_PRIOR";
    const elevConf = ps.elevationSource === "user" ? 0.75 : 0.50;
    provenance["elevation"] = {
      featureName: "elevation",
      source: elevTier,
      confidenceWeight: elevConf,
      rawValue: elevationM,
      normalizedValue: Number((elevationM / 2000.0).toFixed(4)),
      timestamp: nowIso,
    };
  }

  // Calculate overall confidence score
  let totalConfidence = 0;
  let provCount = 0;
  for (const meta of Object.values(provenance)) {
    totalConfidence += meta.confidenceWeight;
    provCount += 1;
  }
  const overallConfidenceScore = provCount > 0 ? Number((totalConfidence / provCount).toFixed(3)) : 0.75;

  return {
    fieldId: options.fieldId ?? "unnamed_field",
    centroid: options.centroid ?? null,
    continuousVector32,
    featureLabels32: AGRONOMIC_32_FEATURE_LABELS,
    soilPhysical: {
      usdaTextureClass,
      sandPercent,
      siltPercent,
      clayPercent,
      coarseFragmentVolFrac,
      bulkDensityGCm3,
      saturationVolPct,
      fieldCapacityVolPct,
      wiltingPointVolPct,
      awcMmM,
      infiltrationRateMmHr,
      drainageIndex,
      waterTableDepthCm,
      effectiveRootDepthCm,
      aerationStressFactor,
    },
    soilChemical: {
      phH2o,
      eceDsm,
      espPercent,
      caco3Percent,
      somPercent,
      socPercent,
      cecCmolKg,
    },
    soilNutrients: {
      availableNPpm,
      availableNStockKgHa,
      availablePPpm,
      availableKPpm,
    },
    soilBiological: {
      pathogenInoculumRisk,
    },
    waterAndIrrigation: {
      waterSupplyRegime,
      seasonalWaterQuotaM3Ha,
      irrigationEcwDsm,
      irrigationSarw,
      irrigationRscMeqL: wDef.rsc,
      irrigationNo3NPpm: wDef.no3N,
      irrigationSystemType,
      applicationEfficiencyFrac,
      wettedSoilFraction: sysSpec.wettedFrac,
      foliarDiseaseMultiplier: sysSpec.foliarMult,
      dripOsmoticBufferBonusDsm,
      steadyStateSalinityFloorDsm,
      permeabilityHazardPenaltyFrac,
    },
    eoAgroclimate: {
      elevationM,
      slopePercent,
      aridityIndex,
      annualEt0Mm,
      heatDays35,
      winterChillingHours: 240,
      frostProbabilityWinter: 0.02,
      summerHeatSpikeDaysOver38C: 12,
      initialRootZoneMoistureVolPct: eo.rootZoneMoistureVolPct ?? 28,
      soilMoistureAnomalyIndex: eo.soilMoistureAnomalyIndex ?? 0.1,
    },
    farmerPriorities: {
      yieldWeight: options.priorities?.yield ?? 0.35,
      waterSavingWeight: options.priorities?.water ?? 0.25,
      soilRegenerationWeight: options.priorities?.soil ?? 0.25,
      riskAversionWeight: options.priorities?.risk ?? 0.15,
    },
    provenance,
    overallConfidenceScore,
  };
}

/**
 * Bridges WorkspaceState from the interactive React application to the
 * canonical 32-dimensional NormalizedAgronomicVector.
 */
export function workspaceToAgronomicVector(
  state: WorkspaceState,
  eoPriorOverride?: Partial<NormalizeInputOptions["eoPrior"]>
): NormalizedAgronomicVector {
  const parseNumHelper = (val: string | number | null | undefined): number | undefined => {
    if (val === null || val === undefined) return undefined;
    // A whitespace-only field is empty, not 0 (Number(" ") is 0).
    if (typeof val === "string" && val.trim() === "") return undefined;
    const n = typeof val === "number" ? val : Number(String(val).trim().replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  };

  const lab = state.soil.lab;
  const obs = state.soil.observations;
  const water = state.water;
  const field = state.field;
  const climate = state.climate.summary;

  // Observations -> the exact engine classes. The Soil page imports the same
  // maps, so the proxy it displays is the value the engine actually substitutes.
  const textureGroup = obs.textureRibbon
    ? TEXTURE_GROUP_BY_OBSERVATION[obs.textureRibbon]
    : undefined;
  const compactionState = obs.compaction
    ? COMPACTION_BY_OBSERVATION[obs.compaction]
    : undefined;
  const drainageClass = obs.mottling
    ? DRAINAGE_BY_OBSERVATION[obs.mottling]
    : undefined;
  const salinityClass = obs.surfaceSalt
    ? SALINITY_BY_OBSERVATION[obs.surfaceSalt]
    : undefined;
  const soilReactionClass = obs.reactionClue
    ? REACTION_BY_OBSERVATION[obs.reactionClue]
    : undefined;
  const soilColorSomClass = obs.colour
    ? COLOR_BY_OBSERVATION[obs.colour]
    : undefined;

  // No diagnosis input exists in this build (the model never learned pathogen
  // pressure either), so every group keeps its baseline inoculum risk.
  const observedPathogens: SoilBornePathogenGroup[] = [];

  // Water mappings
  const regimeMap: Record<string, WaterSupplyRegime> = {
    full_irrigation: "FULL_IRRIGATION",
    deficit_allocation: "DEFICIT_ALLOCATION",
    supplementary: "SUPPLEMENTARY",
    rainfed: "RAINFED",
  };
  const waterSupplyRegime = water.regime ? regimeMap[water.regime] : undefined;

  const systemMap: Record<string, IrrigationSystemType> = {
    surface: "FLOOD_BASIN",
    drip: "SURFACE_DRIP",
    sprinkler: "SPRINKLER_SOLID_SET",
    pivot: "CENTER_PIVOT_LEPA",
  };
  const irrigationSystemType = water.system ? systemMap[water.system] : undefined;

  const waterSourceType = water.source ? WATER_SOURCE_BY_UI[water.source] : undefined;

  // Slope mapping
  const slopeMap: Record<string, number> = {
    unknown: 1.5,
    flat: 1.0,
    slight: 3.5,
    moderate: 7.0,
    steep: 15.0,
  };
  const slopePercent = field.slopeClass ? slopeMap[field.slopeClass] ?? 1.5 : 1.5;

  // Normalized weights. NaN never enters the total, and an all-zero choice is a
  // deliberate "no preference" (equal weights), not a missing field.
  const w = state.priorities?.weights ?? { yield: 3, water: 3, soil: 3, risk: 3 };
  const weightOr = (value: number | undefined): number =>
    Number.isFinite(value) ? (value as number) : 3;
  const rawWeights = [
    weightOr(w.yield),
    weightOr(w.water),
    weightOr(w.soil),
    weightOr(w.risk),
  ];
  const weightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const allWeightsZero = weightSum === 0;
  const wTotal = allWeightsZero ? 12 : weightSum;
  const normalizedWeight = (index: number): number =>
    (allWeightsZero ? 3 : rawWeights[index]) / wTotal;

  const centroid =
    field.centroidLat !== null && field.centroidLon !== null
      ? { lat: field.centroidLat, lon: field.centroidLon }
      : null;

  const quotaMm = parseNumHelper(water.quotaMm);

  const climateYears = climate?.days ? Math.max(1, climate.days / 365.25) : 1;
  const annualHeatDays = climate?.heatDays35 !== undefined
    ? Math.round(climate.heatDays35 / climateYears)
    : 34;

  const options: NormalizeInputOptions = {
    fieldId: field.name || "unnamed_field",
    centroid,
    measured: {
      sandPercent: parseNumHelper(lab.sandPct),
      siltPercent: parseNumHelper(lab.siltPct),
      clayPercent: parseNumHelper(lab.clayPct),
      bulkDensityGCm3: parseNumHelper(lab.bulkDensity),
      phH2o: parseNumHelper(lab.ph),
      eceDsm: parseNumHelper(lab.eceDsm),
      socPercent: parseNumHelper(lab.socPct),
      cecCmolKg: parseNumHelper(lab.cec),
      espPercent: parseNumHelper(lab.espPct),
      caco3Percent: parseNumHelper(lab.caco3Pct),
      availableNPpm: parseNumHelper(lab.no3nPpm),
      availablePPpm: parseNumHelper(lab.olsenPPpm),
      availableKPpm: parseNumHelper(lab.exchangeableKPpm),
      seasonalWaterQuotaM3Ha: quotaMm === undefined ? undefined : quotaMm * 10,
      irrigationEcwDsm: parseNumHelper(water.ecwDsm),
      irrigationSarw: parseNumHelper(water.sarw),
      irrigationNo3NPpm: parseNumHelper(water.no3nPpm),
      waterSupplyRegime,
      irrigationSystemType,
    },
    estimated: {
      textureGroup,
      compactionState,
      drainageClass,
      salinityClass,
      soilReactionClass,
      soilColorSomClass,
      waterSourceType,
      waterSupplyRegime,
      irrigationSystemType,
      observedPathogens,
    },
    eoPrior: {
      elevationM: field.elevationM ?? 18,
      slopePercent,
      annualPrecipitationMm: climate?.annualPrecipMm ?? 48,
      annualEt0Mm: climate?.etoAnnualMm ?? 1680,
      heatDays35: annualHeatDays,
      ...(eoPriorOverride ?? {}),
    },
    priorities: {
      yield: Number(normalizedWeight(0).toFixed(3)),
      water: Number(normalizedWeight(1).toFixed(3)),
      soil: Number(normalizedWeight(2).toFixed(3)),
      risk: Number(normalizedWeight(3).toFixed(3)),
    },
    provenanceSources: {
      areaSource: field.areaSource,
      slopeSource: field.slopeSource,
      elevationSource: field.elevationSource,
      areaHa: field.areaHa ?? undefined,
    },
  };

  return normalizeFieldInputsToScientificVector(options);
}

export function buildAiInputContractFromWorkspace(
  state: WorkspaceState,
  eoPriorOverride?: Partial<NormalizeInputOptions["eoPrior"]>
): AiInputContract {
  const vector = workspaceToAgronomicVector(state, eoPriorOverride);
  return buildAiInputContract(vector);
}

/**
 * Builds the complete AI Input Contract package ready for immediate export or inference.
 */
export function buildAiInputContract(
  input:
    | NormalizedAgronomicVector
    | Parameters<typeof normalizeFieldInputsToScientificVector>[0]
    | WorkspaceState
): AiInputContract {
  const vector: NormalizedAgronomicVector =
    "continuousVector32" in input
      ? input
      : "soil" in input && "water" in input
      ? workspaceToAgronomicVector(input)
      : normalizeFieldInputsToScientificVector(input);
  const getTier = (key: string): DataProvenance => vector.provenance[key]?.source ?? "EST";
  const getConf = (key: string): number => vector.provenance[key]?.confidenceWeight ?? 0.75;

  return {
    schemaVersion: "agrorotate.ai.input/v1",
    fieldId: vector.fieldId,
    centroid: vector.centroid,
    normalizedVector32: vector.continuousVector32,
    featureLabels: vector.featureLabels32,
    features: {
      edaphicPhysical: [
        { name: "sand_fraction", normVal: vector.continuousVector32[0], rawVal: vector.soilPhysical.sandPercent, unit: "%", tier: getTier("soilTexture"), confidence: getConf("soilTexture") },
        { name: "silt_fraction", normVal: vector.continuousVector32[1], rawVal: vector.soilPhysical.siltPercent, unit: "%", tier: getTier("soilTexture"), confidence: getConf("soilTexture") },
        { name: "clay_fraction", normVal: vector.continuousVector32[2], rawVal: vector.soilPhysical.clayPercent, unit: "%", tier: getTier("soilTexture"), confidence: getConf("soilTexture") },
        { name: "coarse_fragments", normVal: vector.continuousVector32[3], rawVal: vector.soilPhysical.coarseFragmentVolFrac, unit: "frac", tier: "MEAS", confidence: 1.0 },
        { name: "bulk_density", normVal: vector.continuousVector32[4], rawVal: vector.soilPhysical.bulkDensityGCm3, unit: "g/cm³", tier: getTier("bulkDensityGCm3"), confidence: getConf("bulkDensityGCm3") },
        { name: "field_capacity", normVal: vector.continuousVector32[5], rawVal: vector.soilPhysical.fieldCapacityVolPct, unit: "% vol", tier: "EST", confidence: 0.75 },
        { name: "wilting_point", normVal: vector.continuousVector32[6], rawVal: vector.soilPhysical.wiltingPointVolPct, unit: "% vol", tier: "EST", confidence: 0.75 },
        { name: "awc", normVal: vector.continuousVector32[7], rawVal: vector.soilPhysical.awcMmM, unit: "mm/m", tier: getTier("awcMmM"), confidence: getConf("awcMmM") },
        { name: "ksat", normVal: vector.continuousVector32[8], rawVal: vector.soilPhysical.infiltrationRateMmHr, unit: "mm/hr", tier: "EST", confidence: 0.75 },
        { name: "drainage_index", normVal: vector.continuousVector32[9], rawVal: vector.soilPhysical.drainageIndex, unit: "index", tier: "EST", confidence: 0.75 },
        { name: "root_depth", normVal: vector.continuousVector32[11], rawVal: vector.soilPhysical.effectiveRootDepthCm, unit: "cm", tier: "EST", confidence: 0.75 },
      ],
      edaphicChemical: [
        { name: "ph", normVal: vector.continuousVector32[13], rawVal: vector.soilChemical.phH2o, unit: "pH", tier: getTier("phH2o"), confidence: getConf("phH2o") },
        { name: "ece", normVal: vector.continuousVector32[14], rawVal: vector.soilChemical.eceDsm, unit: "dS/m", tier: getTier("eceDsm"), confidence: getConf("eceDsm") },
        { name: "esp", normVal: vector.continuousVector32[15], rawVal: vector.soilChemical.espPercent, unit: "%", tier: getTier("espPercent"), confidence: getConf("espPercent") },
        { name: "caco3", normVal: vector.continuousVector32[16], rawVal: vector.soilChemical.caco3Percent, unit: "%", tier: getTier("caco3Percent"), confidence: getConf("caco3Percent") },
        { name: "som", normVal: vector.continuousVector32[17], rawVal: vector.soilChemical.somPercent, unit: "%", tier: getTier("somPercent"), confidence: getConf("somPercent") },
        { name: "cec", normVal: vector.continuousVector32[18], rawVal: vector.soilChemical.cecCmolKg, unit: "cmol/kg", tier: getTier("cecCmolKg"), confidence: getConf("cecCmolKg") },
        { name: "avail_n", normVal: vector.continuousVector32[19], rawVal: vector.soilNutrients.availableNPpm, unit: "ppm", tier: "EST", confidence: 0.75 },
        { name: "avail_p", normVal: vector.continuousVector32[20], rawVal: vector.soilNutrients.availablePPpm, unit: "ppm", tier: "EST", confidence: 0.75 },
        { name: "avail_k", normVal: vector.continuousVector32[21], rawVal: vector.soilNutrients.availableKPpm, unit: "ppm", tier: "EST", confidence: 0.75 },
      ],
      pathogenRisks: [
        { name: "root_knot_nematode", val: vector.continuousVector32[22], description: "Meloidogyne nematode inoculum pressure" },
        { name: "fusarium_wilt", val: vector.continuousVector32[23], description: "Fusarium / Verticillium wilt vascular pressure" },
        { name: "allium_white_rot", val: vector.continuousVector32[24], description: "Sclerotium cepivorum sclerotia persistence" },
        { name: "orobanche_broomrape", val: vector.continuousVector32[25], description: "Orobanche parasitic weed seedbank pressure" },
      ],
      hydrologyClimate: [
        { name: "water_quota", normVal: vector.continuousVector32[26], rawVal: vector.waterAndIrrigation.seasonalWaterQuotaM3Ha, unit: "m³/ha", tier: "MEAS", confidence: 1.0 },
        { name: "water_ecw", normVal: vector.continuousVector32[27], rawVal: vector.waterAndIrrigation.irrigationEcwDsm, unit: "dS/m", tier: "MEAS", confidence: 1.0 },
        { name: "irrigation_efficiency", normVal: vector.continuousVector32[28], rawVal: vector.waterAndIrrigation.applicationEfficiencyFrac, unit: "frac", tier: "EST", confidence: 0.75 },
        { name: "annual_eto", normVal: vector.continuousVector32[29], rawVal: vector.eoAgroclimate.annualEt0Mm, unit: "mm/yr", tier: "EO_PRIOR", confidence: 0.50 },
        { name: "heat_days_35", normVal: vector.continuousVector32[30], rawVal: vector.eoAgroclimate.heatDays35, unit: "days", tier: "EO_PRIOR", confidence: 0.50 },
      ],
      farmerPriorities: vector.farmerPriorities,
    },
    provenance: vector.provenance,
    overallConfidence: vector.overallConfidenceScore,
  };
}
