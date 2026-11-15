export interface BoundaryPoint {
  id: string;
  lat: number;
  lon: number;
  xPct: number;
  yPct: number;
}

export type SlopeClass = "flat" | "gentle" | "steep" | "unknown";

// ============================================================================
// THREE-TIER RESOLUTION HIERARCHY & 20-FACTOR TYPES
// ============================================================================

/**
 * Three-Tier Resolution Hierarchy:
 *  - MEAS: Direct laboratory-verified measurement (Confidence alpha = 1.00)
 *  - EST: Field sensory, tactile or historical estimation with PTF (Confidence alpha = 0.75)
 *  - EO_PRIOR: Geospatial / Earth observation prior (NASA POWER, SRTM, SoilGrids) (Confidence alpha = 0.50)
 */
export type DataProvenance = "MEAS" | "EST" | "EO_PRIOR" | "EO_FALLBACK";

export interface ConfidenceInterval {
  low: number;
  high: number;
}

export interface FeatureProvenanceMeta {
  source: DataProvenance;
  confidenceWeight: number; // 1.00 (MEAS), 0.75 (EST), 0.50 (EO_PRIOR)
  lowerBound95?: number;
  upperBound95?: number;
  uncertaintyPct?: number;
  featureName?: string;
  rawValue?: number;
  normalizedValue?: number;
  timestamp?: string;
}

export type UsdaTextureClass =
  | "SAND"
  | "LOAMY_SAND"
  | "SANDY_LOAM"
  | "LOAM"
  | "SILT_LOAM"
  | "SILT"
  | "SANDY_CLAY_LOAM"
  | "CLAY_LOAM"
  | "SILTY_CLAY_LOAM"
  | "SANDY_CLAY"
  | "SILTY_CLAY"
  | "CLAY"
  | "VERTIC_HEAVY_CLAY";

export type SimplifiedTextureGroup =
  | "COARSE_SANDY"
  | "LIGHT_LOAMY"
  | "MEDIUM_SILTY_LOAM"
  | "MEDIUM_CLAY_LOAM"
  | "HEAVY_CLAY"
  | "EXTREME_VERTIC_CLAY";

export type SimplifiedCompactionState =
  | "LOOSE_FRIABLE"
  | "MODERATE_TILTH"
  | "COMPACTED_DENSE"
  | "SEVERE_PLOWPAN";

export type SimplifiedInfiltrationState =
  | "RAPID_DRAINING"
  | "MODERATE_INFILTRATION"
  | "SLOW_INFILTRATION"
  | "VERY_SLOW_PONDING";

export type SimplifiedDrainageClass =
  | "EXCESSIVELY_DRAINED"
  | "WELL_DRAINED"
  | "MODERATELY_WELL_DRAINED"
  | "SOMEWHAT_POORLY_DRAINED"
  | "POORLY_DRAINED_WATERLOGGED";

export type SimplifiedRootDepthClass =
  | "VERY_SHALLOW"
  | "SHALLOW"
  | "MODERATELY_DEEP"
  | "DEEP"
  | "VERY_DEEP";

export type SimplifiedSoilReactionClass =
  | "STRONGLY_ACIDIC"
  | "SLIGHTLY_ACIDIC"
  | "NEUTRAL_OPTIMAL"
  | "CALCAREOUS_ALKALINE"
  | "STRONGLY_ALKALINE_SODIC";

export type SimplifiedSalinityClass =
  | "NON_SALINE"
  | "SLIGHTLY_SALINE"
  | "MODERATELY_SALINE"
  | "STRONGLY_SALINE"
  | "EXTREMELY_SALINE_SABKHA";

export type SimplifiedSodicityClass =
  | "NON_SODIC_FLOCCULATED"
  | "SLIGHTLY_SODIC"
  | "MODERATELY_SODIC"
  | "STRONGLY_SODIC_ALKALI";

export type SimplifiedCalcareousClass =
  | "NON_CALCAREOUS"
  | "SLIGHTLY_CALCAREOUS"
  | "MODERATELY_CALCAREOUS"
  | "HIGHLY_CALCAREOUS_MARL";

export type SimplifiedSoilColorSomClass =
  | "VERY_PALE_DESERT"
  | "LIGHT_BROWN_ARID"
  | "MEDIUM_BROWN"
  | "DARK_BROWN_RICH"
  | "BLACK_HUMIC";

export type SimplifiedNitrogenHistoryClass =
  | "DEPLETED_CEREAL_EXHAUSTIVE"
  | "MODERATE_BASELINE"
  | "ENRICHED_GRAIN_LEGUME"
  | "HIGH_FORAGE_LEGUME_MANURE";

export type SimplifiedPhosphorusHistoryClass =
  | "LOW_UNFERTILIZED"
  | "MODERATE_MAINTENANCE"
  | "HIGH_INTENSIVE_VEG";

export type SimplifiedPotassiumHistoryClass =
  | "LOW_SANDY_LEACHED"
  | "ADEQUATE_LOAMY"
  | "HIGH_ILLITIC_CLAY";

export type SoilBornePathogenGroup =
  | "ROOT_KNOT_NEMATODE"
  | "VASCULAR_WILT_COMPLEX"
  | "ALLIUM_WHITE_ROT"
  | "OROBANCHE_BROOMRAPE"
  | "RHIZOCTONIA_PYTHIUM_ROT"
  | "CYST_NEMATODE";

export type WaterSupplyRegime =
  | "RAINFED"
  | "SUPPLEMENTARY"
  | "FULL_IRRIGATION"
  | "DEFICIT_ALLOCATION";

export type SimplifiedWaterSourceType =
  | "FRESH_RIVER_CANAL"
  | "MIXED_DRAINAGE_CANAL"
  | "SLIGHTLY_BRACKISH_WELL"
  | "MODERATELY_BRACKISH_WELL"
  | "HIGHLY_BRACKISH_WELL"
  | "TREATED_WASTEWATER";

export type IrrigationSystemType =
  | "FLOOD_BASIN"
  | "FURROW_CORRUGATION"
  | "SPRINKLER_SOLID_SET"
  | "CENTER_PIVOT_LEPA"
  | "SURFACE_DRIP"
  | "SUBSURFACE_DRIP_SDI";

export type BotanicalFamily =
  | "POACEAE"
  | "FABACEAE"
  | "ASTERACEAE"
  | "BRASSICACEAE"
  | "PEDALIACEAE"
  | "SOLANACEAE"
  | "CONVOLVULACEAE"
  | "MALVACEAE"
  | "LINACEAE"
  | "AMARANTHACEAE"
  | "CUCURBITACEAE"
  | "AMARYLLIDACEAE";

export type FunctionalCropGroup =
  | "WINTER_CEREALS"
  | "SUMMER_CEREALS"
  | "GRAIN_LEGUMES"
  | "FORAGE_LEGUMES_COVER"
  | "OILSEEDS"
  | "ROOT_TUBER_CROPS"
  | "FIBER_CROPS"
  | "SUGAR_CROPS"
  | "MAJOR_VEGETABLES";

// ============================================================================
// NORMALIZED AGRONOMIC VECTOR (32 DIMENSIONS) & AI CONTRACT
// ============================================================================

export interface NormalizedAgronomicVector {
  fieldId: string;
  centroid: { lat: number; lon: number } | null;

  /**
   * Continuous 32-dimensional float vector scaled strictly to [0.0, 1.0].
   * Standard order:
   * [0]  sand_fraction               [1]  silt_fraction
   * [2]  clay_fraction               [3]  coarse_fragments_fraction
   * [4]  bulk_density_norm           [5]  field_capacity_norm
   * [6]  wilting_point_norm          [7]  awc_norm
   * [8]  ksat_norm                   [9]  drainage_index_norm
   * [10] water_table_depth_norm      [11] root_depth_norm
   * [12] aeration_stress_norm        [13] ph_norm
   * [14] ece_norm                    [15] esp_norm
   * [16] caco3_norm                  [17] som_norm
   * [18] cec_norm                    [19] avail_n_norm
   * [20] avail_p_norm                [21] avail_k_norm
   * [22] nematode_risk               [23] fusarium_wilt_risk
   * [24] allium_white_rot_risk       [25] orobanche_risk
   * [26] water_quota_norm            [27] water_ecw_norm
   * [28] irrigation_efficiency       [29] annual_eto_norm
   * [30] heat_days_norm              [31] slope_norm
   */
  continuousVector32: number[];
  featureLabels32: string[];

  soilPhysical: {
    usdaTextureClass: UsdaTextureClass;
    sandPercent: number;
    siltPercent: number;
    clayPercent: number;
    coarseFragmentVolFrac: number;
    bulkDensityGCm3: number;
    saturationVolPct: number;
    fieldCapacityVolPct: number;
    wiltingPointVolPct: number;
    awcMmM: number;
    infiltrationRateMmHr: number;
    drainageIndex: number;
    waterTableDepthCm: number;
    effectiveRootDepthCm: number;
    aerationStressFactor: number;
  };

  soilChemical: {
    phH2o: number;
    eceDsm: number;
    espPercent: number;
    caco3Percent: number;
    somPercent: number;
    socPercent: number;
    cecCmolKg: number;
  };

  soilNutrients: {
    availableNPpm: number;
    availableNStockKgHa: number;
    availablePPpm: number;
    availableKPpm: number;
  };

  soilBiological: {
    pathogenInoculumRisk: Record<SoilBornePathogenGroup, number>;
  };

  waterAndIrrigation: {
    waterSupplyRegime: WaterSupplyRegime;
    seasonalWaterQuotaM3Ha: number;
    irrigationEcwDsm: number;
    irrigationSarw: number;
    irrigationRscMeqL: number;
    irrigationNo3NPpm: number;
    irrigationSystemType: IrrigationSystemType;
    applicationEfficiencyFrac: number;
    wettedSoilFraction: number;
    foliarDiseaseMultiplier: number;
    dripOsmoticBufferBonusDsm: number;
    steadyStateSalinityFloorDsm: number;
    permeabilityHazardPenaltyFrac: number;
  };

  eoAgroclimate: {
    elevationM: number;
    slopePercent: number;
    aridityIndex: number;
    annualEt0Mm: number;
    heatDays35: number;
    winterChillingHours: number;
    frostProbabilityWinter: number;
    summerHeatSpikeDaysOver38C: number;
    initialRootZoneMoistureVolPct: number;
    soilMoistureAnomalyIndex: number;
  };

  farmerPriorities: {
    yieldWeight: number;
    waterSavingWeight: number;
    soilRegenerationWeight: number;
    riskAversionWeight: number;
  };

  provenance: Record<string, FeatureProvenanceMeta>;
  overallConfidenceScore: number;
}

export interface AiInputContract {
  schemaVersion: "agrorotate.ai.input/v1";
  fieldId: string;
  centroid: { lat: number; lon: number } | null;
  normalizedVector32: number[];
  featureLabels: string[];
  features: {
    edaphicPhysical: Array<{
      name: string;
      normVal: number;
      rawVal: number;
      unit: string;
      tier: DataProvenance;
      confidence: number;
    }>;
    edaphicChemical: Array<{
      name: string;
      normVal: number;
      rawVal: number;
      unit: string;
      tier: DataProvenance;
      confidence: number;
    }>;
    pathogenRisks: Array<{
      name: string;
      val: number;
      description: string;
    }>;
    hydrologyClimate: Array<{
      name: string;
      normVal: number;
      rawVal: number;
      unit: string;
      tier: DataProvenance;
      confidence: number;
    }>;
    farmerPriorities: {
      yieldWeight: number;
      waterSavingWeight: number;
      soilRegenerationWeight: number;
      riskAversionWeight: number;
    };
  };
  provenance: Record<string, FeatureProvenanceMeta>;
  overallConfidence: number;
}

export interface AiVulnerabilityHotspot {
  seasonIndex: number;
  stressType: string;
  description: string;
}

export interface AiParetoSlot {
  seasonIndex: number;
  cropId: string;
  cropName: string;
  family: string;
  biophysicalFloorMet: boolean;
  yieldReductionPercent: number;
  waterDemandMm: number;
  nitrogenBalanceKgHa: number;
  bareFieldDaysAfterHarvest: number;
  causalRationale: string;
}

export interface AiParetoSolution {
  id: "existing_baseline" | "max_profit" | "water_conservation" | "soil_regeneration" | string;
  label: string;
  isBaseline?: boolean;
  bareFieldDaysTotal: number;
  vulnerabilityHotspots: AiVulnerabilityHotspot[];
  informationGaps: string[];
  localReviewRisks: string[];
  slots: AiParetoSlot[];
  projectedNetReturnScore: number;
  waterSavingScore: number;
  soilHealthScore: number;
  confidenceBandPercent: number;
}

export interface AiOutputContract {
  schemaVersion: "agrorotate.ai.output/v1";
  fieldId: string;
  paretoSolutions: AiParetoSolution[];
  causalAttributionLedger: Array<{
    season: number;
    selectedCropId: string;
    primaryReason: string;
    soilStateTransition: {
      deltaEceDsm: number;
      deltaNitrogenKgHa: number;
      pathogenSuppression: string[];
    };
  }>;
  confidenceIntervals: {
    overallUncertaintyPct: number;
    basisTier: "MEAS" | "EST" | "EO_PRIOR" | "HYBRID";
  };
}


export interface FieldState {
  name: string;
  placeLabel: string;
  areaHa: number | null;
  /** Null until the user chooses; the UI infers it when only one area exists. */
  areaSource: "drawn" | "declared" | null;
  boundary: BoundaryPoint[];
  centroidLat: number | null;
  centroidLon: number | null;
  slopeClass: SlopeClass;
  /** Where the slope class came from: DEM samples or the user's own observation. */
  slopeSource: "dem" | "observation" | null;
  elevationM: number | null;
  /** Where elevation came from: the DEM lookup or a value the user typed. */
  elevationSource: "dem" | "user" | null;
}

export interface EstimateRecord {
  value: number;
  low: number;
  high: number;
  unit: string;
  basis: string;
  atIso: string;
}

export interface LabSoil {
  sandPct: string;
  siltPct: string;
  clayPct: string;
  bulkDensity: string;
  ph: string;
  eceDsm: string;
  espPct: string;
  caco3Pct: string;
  socPct: string;
  cec: string;
  no3nPpm: string;
  olsenPPpm: string;
  exchangeableKPpm: string;
}

export interface SoilState {
  observations: Record<string, string | null>;
  lab: LabSoil;
  /** Fields filled from a plain-language answer; never a lab measurement. */
  estimates: Record<string, EstimateRecord>;
}

export type WaterRegime =
  | "full_irrigation"
  | "deficit_allocation"
  | "supplementary"
  | "rainfed";

export type IrrigationSystem =
  | "drip"
  | "sprinkler"
  | "surface"
  | "pivot"
  | "none";

export type WaterSource =
  | "river_canal"
  | "groundwater"
  | "reclaimed"
  | "rain"
  | "mixed";

export interface WaterState {
  regime: WaterRegime | null;
  system: IrrigationSystem | null;
  source: WaterSource | null;
  quotaMm: string;
  ecwDsm: string;
  sarw: string;
  no3nPpm?: string;
  /** Fields filled from a plain-language answer; never a lab measurement. */
  estimates: Record<string, EstimateRecord>;
}

export interface ClimateDay {
  date: string;
  t2mMax: number | null;
  t2mMin: number | null;
  t2m: number | null;
  precipMm: number | null;
  rh2m: number | null;
  ws2m: number | null;
  srad: number | null;
}

export interface SeasonSummary {
  tmaxC: number;
  tminC: number;
  rainMm: number;
  etoMm: number | null;
  days: number;
}

export interface MonthSummary {
  month: number;
  tmaxC: number;
  tminC: number;
  rainMm: number;
  etoMm: number | null;
}

export interface ClimateSummary {
  days: number;
  startDate: string;
  endDate: string;
  meanTmaxC: number;
  meanTminC: number;
  annualPrecipMm: number;
  etoAnnualMm: number | null;
  etoMethod: "fao56_pm";
  latitude: number;
  longitude: number;
  elevationM: number;
  parameters: string[];
  timeStandard: string;
  /** Long-term seasonal context for the field, computed from the same daily series. */
  summer: SeasonSummary;
  winter: SeasonSummary;
  monthly: MonthSummary[];
  heatDays35: number;
  dryDays: number;
  frostDays: number;
}

export interface ClimateState {
  status: "idle" | "loading" | "ready" | "error";
  fetchedAtIso: string | null;
  source: "NASA_POWER" | null;
  summary: ClimateSummary | null;
  daySample: ClimateDay[];
  error: string | null;
  cache: "server_cache" | "live" | null;
}

export type PriorityKey = "yield" | "water" | "soil" | "risk";

export interface PrioritiesState {
  /** Null until the user picks a lens; equal weights are neutral, not a choice. */
  preset: "balanced" | "water" | "soil" | "risk" | "custom" | null;
  weights: Record<PriorityKey, number>;
  excluded: Record<string, string>;
  previousCropId: string | null;
}

export interface SlotState {
  cropId: string | null;
}

export interface PlanState {
  title: string;
  cycle: number;
  slots: SlotState[];
  updatedAtIso: string | null;
  serverRevisionId: string | null;
}

export interface WorkspaceState {
  version: 6;
  field: FieldState;
  soil: SoilState;
  water: WaterState;
  climate: ClimateState;
  priorities: PrioritiesState;
  plan: PlanState;
  updatedAtIso: string;
}

export const EMPTY_LAB: LabSoil = {
  sandPct: "",
  siltPct: "",
  clayPct: "",
  bulkDensity: "",
  ph: "",
  eceDsm: "",
  espPct: "",
  caco3Pct: "",
  socPct: "",
  cec: "",
  no3nPpm: "",
  olsenPPpm: "",
  exchangeableKPpm: "",
};

export const SLOT_META = [
  { year: 1, season: "warm" as const, label: "Season 1", months: "Apr – Sep" },
  { year: 1, season: "cool" as const, label: "Season 2", months: "Oct – Mar" },
  { year: 2, season: "warm" as const, label: "Season 3", months: "Apr – Sep" },
  { year: 2, season: "cool" as const, label: "Season 4", months: "Oct – Mar" },
  { year: 3, season: "warm" as const, label: "Season 5", months: "Apr – Sep" },
  { year: 3, season: "cool" as const, label: "Season 6", months: "Oct – Mar" },
];

export const DEFAULT_WORKSPACE: WorkspaceState = {
  version: 6,
  field: {
    name: "",
    placeLabel: "",
    areaHa: null,
    areaSource: null,
    boundary: [],
    centroidLat: null,
    centroidLon: null,
    slopeClass: "unknown",
    slopeSource: null,
    elevationM: null,
    elevationSource: null,
  },
  soil: {
    observations: {},
    lab: { ...EMPTY_LAB },
    estimates: {},
  },
  water: {
    // No pre-selected answers: a choice counts only when the user makes it.
    regime: null,
    system: null,
    source: null,
    quotaMm: "",
    ecwDsm: "",
    sarw: "",
    no3nPpm: "",
    estimates: {},
  },
  climate: {
    status: "idle",
    fetchedAtIso: null,
    source: null,
    summary: null,
    daySample: [],
    error: null,
    cache: null,
  },
  priorities: {
    preset: null,
    weights: { yield: 3, water: 3, soil: 3, risk: 3 },
    excluded: {},
    previousCropId: null,
  },
  plan: {
    title: "Three-year rotation",
    cycle: 1,
    slots: Array.from({ length: 6 }, () => ({ cropId: null })),
    updatedAtIso: null,
    serverRevisionId: null,
  },
  updatedAtIso: new Date().toISOString(),
};

export const CROP_DISPLAY_NAMES: Record<string, string> = {
  "bread-wheat": "Bread Wheat",
  "six-row-barley": "Six-Row Barley",
  "grain-maize": "Grain Maize",
  "grain-sorghum": "Grain Sorghum",
  "pearl-millet": "Pearl Millet",
  "paddy-rice": "Paddy Rice",
  "faba-bean": "Faba Bean",
  "chickpea": "Chickpea",
  "lentil": "Lentil",
  "soybean": "Soybean",
  "cowpea": "Cowpea",
  "berseem-clover-multi-cut": "Berseem Clover",
  "alfalfa-lucerne": "Alfalfa",
  "hairy-vetch-cover": "Hairy Vetch (Cover)",
  "sunflower": "Sunflower",
  "winter-canola-rapeseed": "Winter Canola / Rapeseed",
  "sesame": "Sesame",
  "peanut-groundnut": "Peanut / Groundnut",
  "potato": "Potato",
  "sweet-potato": "Sweet Potato",
  "egyptian-cotton": "Egyptian Cotton",
  "flax-linseed": "Flax / Linseed",
  "sugar-beet": "Sugar Beet",
  "sugarcane": "Sugarcane",
  "processing-tomato": "Processing Tomato",
  "watermelon": "Watermelon",
  "bulb-onion": "Bulb Onion",
  "forage-oat-cover": "Forage Oat (Cover)",
  "summer-cowpea-cover": "Summer Cowpea (Cover)",
  "bio-fumigant-mustard-cover": "Biofumigant Mustard (Cover)",
};

/**
 * Infers a realistic 6-season baseline rotation based on farmer inputs or geographic coordinates
 * for NASA Space Apps challenge Field Shift: Adapting Farms with NASA Data.
 */
export function inferRegionalBaselineRotation(state: WorkspaceState): Array<{
  seasonIndex: number;
  cropId: string;
  cropName: string;
}> {
  const existing = state.plan?.slots ?? [];
  const isFilled =
    existing.length === 6 &&
    existing.every((s) => typeof s?.cropId === "string" && s.cropId.length > 0);
  if (isFilled) {
    return existing.map((s, index) => {
      const cid = s.cropId as string;
      return {
        seasonIndex: index,
        cropId: cid,
        cropName: CROP_DISPLAY_NAMES[cid] ?? cid,
      };
    });
  }

  const lat = state.field.centroidLat ?? 30.5;
  const lon = state.field.centroidLon ?? 31.0;
  const prev = state.priorities.previousCropId;

  let crops: string[];

  // 1. Egypt / Nile Valley & Delta
  if (lat >= 21 && lat <= 32 && lon >= 24 && lon <= 36) {
    if (prev === "bread-wheat") {
      crops = [
        "grain-maize",
        "berseem-clover-multi-cut",
        "grain-maize",
        "bread-wheat",
        "grain-sorghum",
        "berseem-clover-multi-cut",
      ];
    } else if (prev === "berseem-clover-multi-cut") {
      crops = [
        "egyptian-cotton",
        "bread-wheat",
        "grain-maize",
        "faba-bean",
        "grain-maize",
        "bread-wheat",
      ];
    } else {
      crops = [
        "grain-maize",
        "bread-wheat",
        "grain-maize",
        "berseem-clover-multi-cut",
        "grain-sorghum",
        "bread-wheat",
      ];
    }
  }
  // 2. US Corn Belt / Midwest
  else if (lat >= 36 && lat <= 49 && lon >= -105 && lon <= -80) {
    crops = [
      "grain-maize",
      "forage-oat-cover",
      "soybean",
      "hairy-vetch-cover",
      "grain-maize",
      "forage-oat-cover",
    ];
  }
  // 3. Temperate Europe
  else if (lat >= 42 && lat <= 60 && lon >= -10 && lon <= 32) {
    crops = [
      "grain-maize",
      "winter-canola-rapeseed",
      "summer-cowpea-cover",
      "bread-wheat",
      "sunflower",
      "six-row-barley",
    ];
  }
  // 4. Australia (Dry plains)
  else if (lat >= -40 && lat <= -15 && lon >= 112 && lon <= 155) {
    crops = [
      "grain-sorghum",
      "bread-wheat",
      "summer-cowpea-cover",
      "chickpea",
      "pearl-millet",
      "winter-canola-rapeseed",
    ];
  }
  // 5. South America (Cerrado/Pampas)
  else if (lat >= -35 && lat <= 5 && lon >= -75 && lon <= -34) {
    crops = [
      "soybean",
      "grain-maize",
      "soybean",
      "grain-maize",
      "cowpea",
      "bread-wheat",
    ];
  }
  // 6. Global Arid / Mediterranean / Default
  else {
    crops = [
      "grain-maize",
      "bread-wheat",
      "cowpea",
      "faba-bean",
      "grain-sorghum",
      "berseem-clover-multi-cut",
    ];
  }

  return crops.map((cid, idx) => ({
    seasonIndex: idx,
    cropId: cid,
    cropName: CROP_DISPLAY_NAMES[cid] ?? cid,
  }));
}

