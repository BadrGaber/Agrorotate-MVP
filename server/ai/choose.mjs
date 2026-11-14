/**
 * The AI choose endpoint is a deterministic reasoning layer. It receives the
 * same structured state the UI uses and returns one JSON shape for the plan:
 * a choice, the alternatives with reasons, the current state and what is
 * missing. The ranking probability activates when a trained ranker file is
 * present; no number is invented here.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { inputRulesForRoute, loadEvidence, retrieveEvidence } from "./retrieval.mjs";

const ROUTE_LABEL = {
  field: "Field & terrain",
  soil: "Soil",
  water: "Water & climate",
  priorities: "Priorities",
  plan: "Rotation plan",
  crops: "Crop library",
  evidence: "Evidence",
  method: "Method",
};

const text = (value) => (typeof value === "string" ? value.trim() : "");
const num = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Crop registry for the AI service. `server/ai/crops.json` is exported from
 * `src/data/evidence/crops.generated.ts` (30 crops, 13 FAO salinity pairs) by
 * `scripts/export-crops-json.py`, so the server answers from the same registry
 * the browser engine uses. The fallback below keeps the service up if the
 * export file is missing.
 */
const CROPS_FILE = join(dirname(fileURLToPath(import.meta.url)), "crops.json");

const CROP_TABLE = (() => {
  try {
    const parsed = JSON.parse(readFileSync(CROPS_FILE, "utf-8"));
    const table = {};
    for (const crop of parsed.crops ?? []) {
      table[crop.id] = crop;
    }
    if (Object.keys(table).length) return table;
  } catch {
    // fall through to the built-in subset
  }
  return Object.fromEntries([
    [
      "bread-wheat",
      {
        id: "bread-wheat",
        name: "Bread Wheat",
        family: "Poaceae",
        season: "cool",
      },
    ],
    [
      "six-row-barley",
      {
        id: "six-row-barley",
        name: "Six-Row Barley",
        family: "Poaceae",
        season: "cool",
      },
    ],
    [
      "grain-maize",
      {
        id: "grain-maize",
        name: "Grain Maize",
        family: "Poaceae",
        season: "warm",
      },
    ],
    [
      "grain-sorghum",
      {
        id: "grain-sorghum",
        name: "Grain Sorghum",
        family: "Poaceae",
        season: "warm",
      },
    ],
    [
      "cowpea",
      { id: "cowpea", name: "Cowpea", family: "Fabaceae", season: "warm" },
    ],
    [
      "faba-bean",
      {
        id: "faba-bean",
        name: "Faba Bean",
        family: "Fabaceae",
        season: "cool",
      },
    ],
    [
      "pearl-millet",
      {
        id: "pearl-millet",
        name: "Pearl Millet",
        family: "Poaceae",
        season: "warm",
      },
    ],
    [
      "berseem-clover-multi-cut",
      {
        id: "berseem-clover-multi-cut",
        name: "Berseem Clover Multi-Cut",
        family: "Fabaceae",
        season: "cool",
      },
    ],
    [
      "processing-tomato",
      {
        id: "processing-tomato",
        name: "Processing Tomato",
        family: "Solanaceae",
        season: "warm",
      },
    ],
    [
      "egyptian-cotton",
      {
        id: "egyptian-cotton",
        name: "Egyptian Cotton",
        family: "Malvaceae",
        season: "warm",
      },
    ],
    [
      "potato",
      { id: "potato", name: "Potato", family: "Solanaceae", season: "cool" },
    ],
  ]);
})();
const CROP_CATALOG = Object.values(CROP_TABLE);
const SALINITY_VERIFIED_COUNT = CROP_CATALOG.filter(
  (c) => c.salinityLimitDsm != null,
).length;

function cropLookup(id) {
  return CROP_TABLE[id] ?? null;
}

function missingForRoute(context) {
  const { route, field, soil, water, priorities, climate, plan, coverage } =
    context;
  const items = [];
  const add = (key, label, why, routeKey, priority = "important") => {
    items.push({ key, label, why, route: routeKey, priority });
  };

  if (!field?.boundary || field.boundary.length < 3) {
    add(
      "boundary",
      "Draw the parcel",
      "The plan needs a boundary: area, centroid and dimensions come from at least three WGS84 corners.",
      "field",
      "blocking",
    );
  }
  if (!climate?.summary) {
    add(
      "climate",
      "Load NASA POWER",
      "The climate averages are missing for this location.",
      "field",
      route === "field" ? "blocking" : "important",
    );
  }
  if (!text(soil?.lab?.eceDsm)) {
    add(
      "ece",
      "Add a saturated-paste ECe",
      "Without it the salinity check must stay unassessed.",
      "soil",
      "important",
    );
  }
  if (!text(water?.ecwDsm) && !text(water?.quotaMm)) {
    add(
      "water-sample",
      "Record ECw or the water quota",
      "Climate cannot tell us what comes out of the pump.",
      "water",
      "important",
    );
  }
  if (!priorities?.previousCropId) {
    add(
      "previous-crop",
      "Set the previous crop",
      "The first family break cannot be checked without it.",
      "priorities",
      "important",
    );
  }
  if (Object.keys(priorities?.excluded ?? {}).length === 0) {
    add(
      "exclusion",
      "Record one hard exclusion",
      "An exclusion is the strongest signal the planner cannot override.",
      "priorities",
      "nice",
    );
  }
  if (!plan?.slots?.some((slot) => slot?.cropId)) {
    add(
      "plan",
      "Choose a crop for a season",
      "There is nothing to evaluate yet.",
      "plan",
      "blocking",
    );
  }
  return uniqueBy(items, "key");
}

function suggestionsFor(context, missing) {
  const suggestions = [];
  const add = (label, reason, route) =>
    suggestions.push({ label, reason, route });
  if (missing.some((item) => item.key === "boundary")) {
    add(
      "Draw the real parcel",
      "Area and dimensions become reproducible when the polygon is WGS84.",
      "field",
    );
  }
  if (missing.some((item) => item.key === "climate")) {
    add(
      "Load NASA POWER for this field",
      "Five years of daily AG data are cached by the local API.",
      "field",
    );
  }
  if (missing.some((item) => item.key === "ece")) {
    add(
      "Add a saturated-paste ECe",
      "Only a measurement can trigger the FAO salinity curve.",
      "soil",
    );
  }
  if (missing.some((item) => item.key === "water-sample")) {
    add(
      "Add ECw and the quota",
      "Water quality and allocation are local facts, not satellite estimates.",
      "water",
    );
  }
  if (missing.some((item) => item.key === "previous-crop")) {
    add(
      "Set the previous crop",
      "This makes the first family-break check meaningful.",
      "priorities",
    );
  }
  if (context.route === "plan" && context.selected?.cropId) {
    add(
      "Inspect the season checks",
      "Open the selected season and read the assessed vs unassessed rows.",
      "plan",
    );
    add(
      "Compare three rotations",
      "Compare the three rotations by evidence counts and checks.",
      "plan",
    );
  }
  if (context.route === "plan" && context.coverage?.filled === 6) {
    add(
      "Export the plan for the record",
      "The JSON includes the field, climate, priorities and every verdict.",
      "plan",
    );
  }
  if (context.route === "crops" || context.route === "evidence") {
    add(
      "Open the evidence room",
      "Read the claim status and source scope behind a crop value.",
      "evidence",
    );
  }
  return uniqueBy(suggestions, "label").slice(0, 4);
}

function round3(value) {
  return Math.round((value ?? 0) * 1000) / 1000;
}

function parseNum(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildStateNow(context) {
  const rows = [];
  const add = (key, label, value, source) => {
    rows.push({
      key,
      label,
      value: value == null ? "not recorded" : String(value),
      recorded: value != null && value !== "",
      source,
    });
  };
  const field = context.field;
  const soil = context.soil;
  const water = context.water;
  const climate = context.climate;
  const priorities = context.priorities;
  const plan = context.plan;

  add(
    "field.placeLabel",
    "Field location (the field's identity)",
    field?.placeLabel ?? null,
    "place search on the map",
  );
  add(
    "field.areaHa",
    "Field area (ha)",
    field?.areaHa ?? null,
    "drawn polygon",
  );
  add(
    "field.boundary",
    "Field boundary",
    field?.boundary?.length >= 3
      ? field.boundary.length + " WGS84 corners"
      : "not drawn",
    "drawn map",
  );
  add(
    "field.centroidLat",
    "Field centroid latitude",
    field?.centroidLat ?? null,
    "drawn map / NASA POWER",
  );
  add(
    "field.centroidLon",
    "Field centroid longitude",
    field?.centroidLon ?? null,
    "drawn map / NASA POWER",
  );
  add(
    "field.elevationM",
    "Field elevation (m)",
    field?.elevationM ?? null,
    "your input / Open-Meteo DEM fallback",
  );
  add(
    "field.slopeClass",
    "Slope class",
    field?.slopeClass ?? null,
    "your observation",
  );

  add(
    "soil.observations.surfaceSalt",
    "Soil observation — surface salt",
    soil?.observations?.surfaceSalt ?? null,
    "your observation",
  );
  add(
    "soil.observations.drainage",
    "Soil observation — drainage",
    soil?.observations?.drainage ?? null,
    "your observation",
  );
  add(
    "soil.lab.eceDsm",
    "Lab ECe (dS/m)",
    soil?.lab?.eceDsm ?? null,
    "saturated paste lab report",
  );
  add("soil.lab.ph", "Lab pH", soil?.lab?.ph ?? null, "lab report");
  add(
    "soil.lab.clayPct",
    "Lab clay %",
    soil?.lab?.clayPct ?? null,
    "lab report",
  );
  add(
    "soil.lab.sandPct",
    "Lab sand %",
    soil?.lab?.sandPct ?? null,
    "lab report",
  );
  add(
    "soil.lab.siltPct",
    "Lab silt %",
    soil?.lab?.siltPct ?? null,
    "lab report",
  );

  add(
    "water.ecwDsm",
    "Water ECw (dS/m)",
    water?.ecwDsm ?? null,
    "your water sample",
  );
  add(
    "water.quotaMm",
    "Water quota (mm)",
    water?.quotaMm ?? null,
    "your water record",
  );
  add("water.regime", "Water regime", water?.regime ?? null, "your input");
  add("water.system", "Irrigation system", water?.system ?? null, "your input");
  add("water.source", "Water source", water?.source ?? null, "your input");

  if (climate?.summary) {
    const s = climate.summary;
    add(
      "climate.source",
      "Climate source",
      climate.source ?? "NASA POWER",
      "NASA POWER daily AG",
    );
    add(
      "climate.fetchedAtIso",
      "Climate fetched at",
      climate.fetchedAtIso ?? null,
      "your API / browser",
    );
    add(
      "climate.summary.meanTmaxC",
      "Climate mean Tmax (°C)",
      s.meanTmaxC ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.meanTminC",
      "Climate mean Tmin (°C)",
      s.meanTminC ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.annualPrecipMm",
      "Climate rain / year (mm)",
      s.annualPrecipMm ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.etoAnnualMm",
      "Climate reference ETo / year (mm)",
      s.etoAnnualMm ?? null,
      "FAO-56 PM from NASA POWER",
    );
    add(
      "climate.summary.days",
      "Climate days in window",
      s.days ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.startDate",
      "Climate window start",
      s.startDate ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.endDate",
      "Climate window end",
      s.endDate ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.heatDays35",
      "Climate days ≥ 35°C",
      s.heatDays35 ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.dryDays",
      "Climate dry days (rain < 1 mm)",
      s.dryDays ?? null,
      "NASA POWER daily AG",
    );
    add(
      "climate.summary.frostDays",
      "Climate frost days (Tmin ≤ 0°C)",
      s.frostDays ?? null,
      "NASA POWER daily AG",
    );
  } else {
    add("climate.summary", "Climate summary", null, "not loaded");
  }

  add(
    "priorities.preset",
    "Priority preset",
    priorities?.preset ?? null,
    "your input",
  );
  add(
    "priorities.weights.yield",
    "Priority weight — yield",
    priorities?.weights?.yield ?? null,
    "your input",
  );
  add(
    "priorities.weights.water",
    "Priority weight — water",
    priorities?.weights?.water ?? null,
    "your input",
  );
  add(
    "priorities.weights.soil",
    "Priority weight — soil",
    priorities?.weights?.soil ?? null,
    "your input",
  );
  add(
    "priorities.weights.risk",
    "Priority weight — risk",
    priorities?.weights?.risk ?? null,
    "your input",
  );
  add(
    "priorities.previousCropId",
    "Previous crop",
    priorities?.previousCropId ?? null,
    "your input",
  );
  if (Object.keys(priorities?.excluded ?? {}).length) {
    add(
      "priorities.excluded",
      "Hard exclusions",
      Object.entries(priorities.excluded)
        .map(([k, v]) => k + ": " + v)
        .join("; "),
      "your input",
    );
  } else {
    add(
      "priorities.excluded",
      "Hard exclusions",
      "none recorded",
      "your input",
    );
  }

  if (plan?.slots) {
    const filled = plan.slots.filter((s) => s.cropId).length;
    add(
      "plan.slots",
      "Plan slots",
      plan.slots.length + " total, " + filled + " filled",
      "your plan",
    );
    add("plan.cycle", "Plan cycle", plan.cycle ?? null, "your plan");
    add("plan.title", "Plan title", plan.title ?? null, "your plan");
  }

  return rows;
}

function engineAlternativesFor(context, selected) {
  const alts = selected.alternatives ?? [];
  return alts.map((alt) => ({
    cropId: alt.id,
    cropName: alt.name,
    family: alt.family,
    season: alt.seasonMatch ? "matches season" : "season mismatch",
    salinity: alt.salinity,
    salinityClears: alt.salinityClears,
    familyBreak: alt.familyBreak,
    seasonMatch: alt.seasonMatch,
    isLegume: alt.isLegume,
    isCover: alt.isCover,
    blockedByUser: alt.blockedByUser,
    reasons: alt.reasons,
    verdict:
      alt.salinityClears === false
        ? "conflict"
        : alt.familyBreak === false && alt.seasonMatch === false
          ? "caution"
          : "open",
    note: "Shown from the same engine checks the plan uses.",
  }));
}

export async function buildAiChooseResponse(context = {}) {
  const route = context.route ?? "plan";
  const selected = context.selected;
  const coverage = context.coverage ?? null;
  const field = context.field ?? null;
  const soil = context.soil ?? null;
  const water = context.water ?? null;
  const climate = context.climate ?? null;
  const priorities = context.priorities ?? null;
  const plan = context.plan ?? null;

  const missing = missingForRoute(context);
  const chosenCrop = selected?.cropId ? cropLookup(selected.cropId) : null;
  const seasonLabel = selected
    ? `${selected.cropName} · slot ${selected.index}`
    : "none selected";

  const stateNow = buildStateNow(context);
  const ledger = await loadEvidence();
  const ledgerCounts = {
    claims: ledger.claims.length,
    supported: ledger.claims.filter(
      (claim) => claim.status === "SUPPORTED FOR SOURCE SCOPE",
    ).length,
    sources: ledger.sources.length,
  };

  const engineAlternatives = selected
    ? engineAlternativesFor(context, selected)
    : [];
  const withRanker = engineAlternatives.map((alt) => ({
    ...alt,
    rankerProbability: null,
    rankerThreshold: null,
    rankerVersion: null,
  }));

  const suggestions = suggestionsFor(context, missing);

  return {
    schemaVersion: "agrorotate.ai-choose-response/1",
    status: "ok",
    mode: "grounded_rules",
    model: {
      name: "agrorotate-ai-choose",
      version: "0.1.0",
      trained: false,
      ranker: null,
      note: "Deterministic evidence-grounded engine.",
    },
    asOfIso: new Date().toISOString(),
    route,
    routeLabel: ROUTE_LABEL[route] ?? route,
    seasonLabel,
    fieldName: field?.name ?? null,
    fieldLocation: field?.placeLabel ?? null,
    fieldCentroid:
      field?.centroidLat != null && field?.centroidLon != null
        ? { lat: field.centroidLat, lon: field.centroidLon }
        : null,
    climateLoaded: !!climate?.summary,
    climateWindow:
      climate?.summary?.startDate && climate?.summary?.endDate
        ? { start: climate.summary.startDate, end: climate.summary.endDate }
        : null,
    choice: chosenCrop
      ? {
          cropId: chosenCrop.id,
          cropName: chosenCrop.name,
          family: chosenCrop.family,
          season: chosenCrop.season,
          salinityLimitDsm: chosenCrop.salinityLimitDsm ?? null,
          salinitySlopePercentPerDsm:
            chosenCrop.salinitySlopePercentPerDsm ?? null,
          status: "selected",
          salinityClears: selected.salinityClears ?? null,
          familyBreak: selected.familyBreak ?? null,
          seasonMatch: selected.seasonMatch ?? null,
          isLegume: selected.isLegume ?? null,
          isCover: selected.isCover ?? null,
          verdict: selected.evaluation?.verdict ?? null,
          findings: selected.evaluation?.findings ?? [],
          dimensions: selected.evaluation?.dimensions ?? [],
          salinity: selected.evaluation?.salinity ?? null,
          note: "The currently selected crop for this season, shown with its engine check status.",
        }
      : {
          cropId: null,
          cropName: null,
          family: null,
          season: null,
          salinityLimitDsm: null,
          salinitySlopePercentPerDsm: null,
          status: "none",
          salinityClears: null,
          familyBreak: null,
          seasonMatch: null,
          isLegume: null,
          isCover: null,
          verdict: null,
          findings: [],
          dimensions: [],
          salinity: null,
          note: "No crop is selected for this season yet.",
        },
    alternatives: withRanker,
    stateNow,
    missing,
    suggestions,
    evidence: (
      await retrieveEvidence({
        cropName: selected?.cropName ?? "",
        question: "",
        route,
        limit: 6,
      })
    ).claims.map((claim) => ({
      id: claim.id,
      crop: claim.crop,
      parameter: claim.parameter,
      value: claim.value,
      status: claim.status,
      scope: claim.scope,
      url: claim.url,
    })),
    inputRules: (await inputRulesForRoute(route)).slice(0, 3).map((rule) => ({
      section: rule.section,
      name: rule.name,
      why: rule.correctLabel,
    })),
    counts: {
      cropsCatalogued: CROP_CATALOG.length,
      salinityVerified: SALINITY_VERIFIED_COUNT,
      seasonsInPlan: plan?.slots?.length ?? 0,
      seasonsFilled: coverage?.filled ?? 0,
      conflicts: coverage?.conflicts ?? 0,
      cautions: coverage?.cautions ?? 0,
      evidenceClaims: ledgerCounts.claims,
      evidenceSupported: ledgerCounts.supported,
      evidenceSources: ledgerCounts.sources,
    },
  };
}
