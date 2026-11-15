export interface BoundaryPoint {
  id: string;
  lat: number;
  lon: number;
  xPct: number;
  yPct: number;
}

export type SlopeClass = "flat" | "gentle" | "steep" | "unknown";











export type DataProvenance = "MEAS" | "EST" | "EO_PRIOR" | "EO_FALLBACK";

export interface ConfidenceInterval {
  low: number;
  high: number;
}

export interface FeatureProvenanceMeta {
  source: DataProvenance;
  confidenceWeight: number;
  lowerBound95?: number;
  upperBound95?: number;
  uncertaintyPct?: number;
  featureName?: string;
  rawValue?: number;
  normalizedValue?: number;
  timestamp?: string;
  isDerived?: boolean;
  derivationEquation?: string;
  rawInputParameter?: string;
  rawInputValue?: number;
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





export interface NormalizedAgronomicVector {
  fieldId: string;
  centroid: { lat: number; lon: number } | null;





















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
  riskScore: number;
  confidenceBandPercent: number;
}


export interface AiSearchTelemetry {
  method: "mcts_ucb1";
  searchType: "approximate_budgeted_sample";
  simulationBudgetUnit: "rollout";
  budgetSimulations: number;
  simulationsExecuted: number;
  candidatesGenerated: number;
  uniqueRotationsEvaluated: number;
  duplicateRolloutsSkipped: number;

  theoreticalSearchSpace: number;
  theoreticalSearchSpaceLabel: string;
  elapsedMs: number;
  blocked: boolean;
}

export interface AiParetoAssessment {
  basis: "best_per_objective_over_evaluated_set";
  label: string;
  objectives: Array<"netReturn" | "waterSaving" | "soilHealth" | "risk">;
  nonDominatedWithinEvaluatedSet: boolean;

  rankingByUserWeights: Array<{ solutionId: string; weightedScore: number }>;
  note: string;
}

export interface AiInputIssue {
  field: string;
  message: string;
  severity: "error";
}

export interface AiOutputContract {
  schemaVersion: "agrorotate.ai.output/v1";
  fieldId: string;
  status: "ok" | "blocked_invalid_inputs";
  inputIssues: AiInputIssue[];
  search: AiSearchTelemetry;
  paretoAssessment: AiParetoAssessment;
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

  areaSource: "drawn" | "declared" | null;
  boundary: BoundaryPoint[];
  centroidLat: number | null;
  centroidLon: number | null;
  slopeClass: SlopeClass;

  slopeSource: "dem" | "observation" | null;
  elevationM: number | null;

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

  etoDaysComputed: number;
  etoDaysTotal: number;
  etoStatus: "complete" | "partial" | "unavailable";
  etoRequiredInputs: string[];
  latitude: number;
  longitude: number;
  elevationM: number;
  parameters: string[];
  timeStandard: string;

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
  { year: 1, season: "warm" as const, label: "Season 1", months: "Apr – Sep (Default)" },
  { year: 1, season: "cool" as const, label: "Season 2", months: "Oct – Mar (Default)" },
  { year: 2, season: "warm" as const, label: "Season 3", months: "Apr – Sep (Default)" },
  { year: 2, season: "cool" as const, label: "Season 4", months: "Oct – Mar (Default)" },
  { year: 3, season: "warm" as const, label: "Season 5", months: "Apr – Sep (Default)" },
  { year: 3, season: "cool" as const, label: "Season 6", months: "Oct – Mar (Default)" },
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
