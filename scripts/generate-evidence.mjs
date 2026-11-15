import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourceDir = path.resolve(root, "docs", "evidence_sources");
const evidenceDir = path.join(root, "src", "data", "evidence");
const cropsFile = path.join(evidenceDir, "crops.generated.ts");
const auditFile = path.join(evidenceDir, "generated.ts");

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  return body.map((r) =>
    Object.fromEntries(
      header.map((key, idx) => [key.trim(), (r[idx] ?? "").trim()]),
    ),
  );
}

const ledgerFile = parseCsv(
  fs.readFileSync(
    path.join(sourceDir, "Agrorotate_30_Crop_Parameter_Claim_Ledger.csv"),
    "utf8",
  ),
);





const DECISION_PARAMETERS = new Set([
  "Family",
  "Season",
  "Salinity Limit",
  "Yield Loss Slope",
]);
const ledger = ledgerFile.filter((claim) =>
  DECISION_PARAMETERS.has(claim.parameter_as_written),
);
const cropStatus = parseCsv(
  fs.readFileSync(
    path.join(sourceDir, "Agrorotate_30_Crop_Evidence_Status_v5.csv"),
    "utf8",
  ),
);
const inputs = parseCsv(
  fs.readFileSync(
    path.join(sourceDir, "Agrorotate_20_Input_Evidence_Matrix_v5.csv"),
    "utf8",
  ),
);
const sources = parseCsv(
  fs.readFileSync(
    path.join(sourceDir, "Agrorotate_Verified_Source_Registry_v5.csv"),
    "utf8",
  ),
);





const normalizeCropName = (value) =>
  value
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();

const canonicalName = new Map(
  cropStatus.map((row) => [normalizeCropName(row.Crop_Name), row.Crop_Name]),
);
canonicalName.set(normalizeCropName("Forage Oat"), "Forage Oat Cover");

const ledgerByCrop = new Map();
for (const claim of ledger) {
  const name =
    canonicalName.get(normalizeCropName(claim.crop_name_in_file)) ??
    claim.crop_name_in_file;
  const list = ledgerByCrop.get(name) ?? [];
  list.push({ ...claim, crop_name_in_file: name });
  ledgerByCrop.set(name, list);
}

const STATUS_COPY = {
  "NOT VERIFIED — NO VALUE-SPECIFIC SOURCE IN ORIGINAL FILE":
    "ESTIMATED — NO EXACT SOURCE ATTACHED",
  "NOT VERIFIED AS A UNIVERSAL FIXED CROP REQUIREMENT":
    "ESTIMATED — LOCAL PRACTICE",
  "NOT VERIFIED — CROP/PATHOGEN-SPECIFIC SOURCE REQUIRED":
    "ESTIMATED — NEEDS HOST SOURCE",
  "NOT VERIFIED AS CURRENT EGYPTIAN LAW / REGULATION":
    "ESTIMATED — LAW NOT CONFIRMED",
};

const displayStatus = (status) => STATUS_COPY[status] ?? status;

const CROPS = cropStatus.map((row) => {
  const claims = ledgerByCrop.get(row.Crop_Name) ?? [];
  const findByParam = (name) =>
    claims.find((c) => c.parameter_as_written === name);
  const salinity = findByParam("Salinity Limit");
  const slope = findByParam("Yield Loss Slope");
  const season = findByParam("Season");
  const salinityVerified =
    salinity?.evidence_status === "SUPPORTED FOR SOURCE SCOPE";
  const slopeVerified = slope?.evidence_status === "SUPPORTED FOR SOURCE SCOPE";
  const counts = claims.reduce((acc, c) => {
    const status = displayStatus(c.evidence_status);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const supported = claims.filter(
    (c) => c.evidence_status === "SUPPORTED FOR SOURCE SCOPE",
  ).length;
  return {
    name: row.Crop_Name,
    scientificName: row.Scientific_Name_as_supplied_or_representative,
    family: row.Family,
    seasonRaw: season?.value_as_written ?? null,
    season: /warm|summer/i.test(season?.value_as_written ?? "")
      ? "warm"
      : "cool",
    salinity: {
      limitDsm:
        salinityVerified && salinity
          ? Number.parseFloat(salinity.value_as_written)
          : null,
      slopePercentPerDsm:
        slopeVerified && slope
          ? Number.parseFloat(slope.value_as_written)
          : null,
      sourceUrl: salinityVerified ? salinity.external_source_url : null,
      scope: salinityVerified ? salinity.source_table_or_scope : null,
      status: displayStatus(salinity?.evidence_status ?? "MISSING"),
    },
    claimsTotal: claims.length,
    supportedClaims: supported,
    unsupportedClaims: claims.length - supported,
    statusCounts: counts,
    activationGate: row.Activation_Gate,
    caution: row.Evidence_Caution,
    obligationNote:
      "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value.",
  };
});

const CLAIMS = ledger.map((c) => ({
  crop:
    canonicalName.get(normalizeCropName(c.crop_name_in_file)) ??
    c.crop_name_in_file,
  parameter: c.parameter_as_written,
  value: c.value_as_written,
  status: displayStatus(c.evidence_status),
  url: c.external_source_url || null,
  scope: c.source_table_or_scope || null,
  note: (c.audit_note || "").slice(0, 420),
}));

const INPUTS = inputs


  .filter((i) => !/pathogen/i.test(i.Section_Name))
  .map((i) => ({
  section: Number(i.Original_Section),
  name: i.Section_Name,
  nasaSupport: i["What_NASA_or_maps_can_support"],
  requiredEvidence: i.Required_primary_evidence,
  doNotEncode: i.Do_not_encode_without_evidence,
  correctLabel: i.Correct_data_label,
}));

const SOURCES = sources.map((s) => ({
  id: s.Source_ID,
  organization: s.Organization,
  title: s.Source_Title,
  url: s.Direct_URL,
  support: s.Spatial_Temporal_Support,
  use: s.Supported_Use,
  limits: s.Limits_and_Nonclaims,
}));





const AI_DIR = path.resolve(root, "AI");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const METRICS = readJson(path.join(AI_DIR, "models", "real_v1", "real_surrogate_metrics.json"));
const DATASET = readJson(path.join(AI_DIR, "data", "real", "real_dataset_report.json"));
const ECE_AB = readJson(path.join(AI_DIR, "models", "real_v1", "ece_ab_experiment.json"));

function contractFeatures() {
  try {
    const source = fs.readFileSync(path.join(AI_DIR, "pipeline", "contract.py"), "utf8");
    const rows = [...source.matchAll(/\{"idx": (\d+), "name": "([^"]+)", "unit": "([^"]+)", "norm": "([^"]*)", "real": "([^"]+)"\}/g)];
    return rows.map((m) => ({ idx: Number(m[1]), name: m[2], unit: m[3], real: m[5] }));
  } catch {
    return [];
  }
}

const imputedIndices = new Set();
for (const key of Object.keys(DATASET?.imputed_dimensions ?? {})) {
  const match = key.match(/^f(\d+)-f(\d+)$/);
  if (match) {
    for (let i = Number(match[1]); i <= Number(match[2]); i += 1) imputedIndices.add(i);
  } else if (key.startsWith("f")) {
    imputedIndices.add(Number(key.slice(1)));
  }
}

const signals = DATASET?.feature_spearman_with_label ?? {};




const READ_BY = {
  12: "none — aeration is held at one value and no rule reads it",
  14: "salinity physics: Maas–Hoffman threshold/slope from the crop registry",
  15: "the infiltration estimate only (Ksat dispersion factor); the rotation plan does not read it",
  16: "lab validation cross-checks only; the rotation plan does not read it",
  19: "none — the engine overwrites it with a 45 kg/ha working stock before inference",
  20: "none — stored with the lab result, never read by a rule or by the model",
  21: "none — stored with the lab result, never read by a rule or by the model",
  22: "none — no diagnosis input exists in this build",
  23: "none — no diagnosis input exists in this build",
  24: "none — no diagnosis input exists in this build",
  25: "none — no diagnosis input exists in this build",
  26: "none — no diagnosis input exists in this build",
  27: "none — no diagnosis input exists in this build",
  28: "written as a model feature only; it does not cap or rescale the plan",
  29: "salinity physics: irrigation ECw in the salt mass balance",
};
const CROP_TRAITS = [
  [32, "kc", "crop Kc", "crop_trait"],
  [33, "salinity_threshold", "ECe threshold (dS/m)", "crop_trait"],
  [34, "salinity_slope", "yield-loss slope (%/dS/m)", "crop_trait"],
  [35, "nitrogen_fixation", "N fixation (kg/ha)", "crop_trait"],
  [36, "crop_root_depth", "crop root depth (cm)", "crop_trait"],
  [37, "base_yield", "base yield (t/ha)", "crop_trait"],
  [38, "crop_index", "crop registry index", "crop_trait"],
  [39, "season_is_warm", "warm-season flag", "crop_trait"],
];

const MODEL_FEATURES = [


  ...contractFeatures().filter((f) => f.idx < 32).map((f) => {
    const signal = signals[`f${f.idx}`] ?? null;
    const role = imputedIndices.has(f.idx)
      ? "physics_only"
      : signal === null
        ? "constant"
        : "learned";
    return {
      idx: f.idx,
      key: `f${f.idx}`,
      name: f.name,
      unit: f.unit,
      role,
      signal,
      usedBy:
        READ_BY[f.idx] ??
        (role === "learned"
          ? "varies in training, so the trained network reads it"
          : "none — written as a feature, but no rule in the engine reads it"),
      note:
        role === "physics_only"
          ? "held constant in every training row, so the model has no learned response"
          : role === "constant"
            ? "held at one documented value in every training row, so the model has no response to it"
            : "varies in the 3,404 training rows",
    };
  }),
  ...CROP_TRAITS.map(([idx, key, name, role]) => ({
    idx,
    key: `c${idx - 32}`,
    name,
    unit: "",
    role,
    signal: null,
    usedBy: "supplied per crop by the registry, for every slot",
    note: "one value per crop, identical in training and at runtime",
  })),
];

const learned = MODEL_FEATURES.filter((f) => f.role === "learned");
const physicsOnly = MODEL_FEATURES.filter((f) => f.role === "physics_only");
const constant = MODEL_FEATURES.filter((f) => f.role === "constant");
const arc = METRICS?.external_exam_arc_icarda?.real_v1_model ?? null;

const MODEL_CARD = {
  version: METRICS ? "agrorotate.surrogate_weights/real-v1" : "not-trained",
  architecture: "MLP 40 -> 64 -> 32 -> 4 (only head 0 is trained)",
  predicts: "relative yield gap (%) of one crop on one site",
  trainedOn: [
    "MAPSPAM 2020 cultivated grid cells (yield labels)",
    "SoilGrids 250 m topsoil 0-5 cm (sand, silt, clay, bulk density, SOC, CEC, pH)",
    "NASA POWER daily climate -> Hargreaves ETo (clamped in training)",
    "SRTM slope",
  ],
  rows: METRICS?.rows ?? null,
  sites: METRICS?.sites ?? null,
  crops: METRICS?.crops ?? null,
  label: DATASET?.label_definition ?? null,
  validation: METRICS?.validation ?? null,
  metrics: METRICS
    ? {
        oofMae: METRICS.oof_metrics?.mae ?? null,
        oofSpearman: METRICS.oof_metrics?.spearman ?? null,
        withinCropSpearman: METRICS.within_crop_spearman?.real_v1_oof ?? null,
        arcMae: arc?.mae ?? null,
        arcR2: arc?.r2 ?? null,
        arcSpearman: arc?.spearman ?? null,
      }
    : null,
  featureCounts: {
    total: MODEL_FEATURES.length,
    learned: learned.length,
    constant: constant.length,
    physicsOnly: physicsOnly.length,
    cropTraits: CROP_TRAITS.length,
  },
  learnedNames: learned.map((f) => f.name),
  physicsOnlyNames: physicsOnly.map((f) => f.name),
  physicsOnlyDetail: physicsOnly.map((f) => `${f.name} — ${f.usedBy}`),
  constantNames: constant.map((f) => f.name),
  measuredCrops: DATASET?.crop_list?.length ?? null,
  registeredCrops: CROPS.length,
  salinity: {
    policy:
      "The network never learned ECe, ESP, CaCO3, nutrients, the water quota or ECw: they were constant in training. Only ECe and ECw have a documented salinity rule; ESP reaches the infiltration estimate, and N/P/K are recorded only. There is no pathogen input. The model predicts no salinity number.",
    eceCoverageSites: DATASET?.real_ece?.sites_with_measured_ece ?? null,
    eceCoverageRows: DATASET?.real_ece?.rows_with_measured_ece ?? null,
    eceExperiment: ECE_AB?.results
      ? {
          withoutEce: ECE_AB.results.ece_excluded_baseline ?? null,
          withEce: ECE_AB.results.ece_measured_16pct ?? null,
          conclusion: ECE_AB.conclusion ?? null,
        }
      : null,
  },
  note: "Crops without real training rows receive no neural penalty at runtime; the physical floor decides alone.",
};

const totalClaims = CLAIMS.length;
const supportedTotal = CLAIMS.filter(
  (c) => c.status === "SUPPORTED FOR SOURCE SCOPE",
).length;
const cropsWithSalinityPair = CROPS.filter(
  (crop) =>
    crop.salinity.limitDsm !== null &&
    crop.salinity.slopePercentPerDsm !== null,
).length;

const header = `/**
 * AUTO-GENERATED from the Agrorotate research package v5 (29 Oct 2026).
 * Regenerate with: node scripts/generate-evidence.mjs`;

const cropsBody = `${header}
 *
 * Catalogue + package metadata only. The ${totalClaims}-row audit ledger lives in
 * ./generated.ts and is code-split so it does not load on first paint.
 *
 * ${supportedTotal} of ${totalClaims} crop claims are supported for a named
 * source scope (FAO salinity tables). The rest are preserved as supplied by the
 * project file and must not be treated as a verified agronomic fact.
 */

export type EvidenceStatus = string;

export interface EvidenceCrop {
  name: string;
  scientificName: string;
  family: string;
  seasonRaw: string | null;
  season: "cool" | "warm";
  salinity: {
    limitDsm: number | null;
    slopePercentPerDsm: number | null;
    sourceUrl: string | null;
    scope: string | null;
    status: EvidenceStatus;
  };
  claimsTotal: number;
  supportedClaims: number;
  unsupportedClaims: number;
  statusCounts: Record<string, number>;
  activationGate: string;
  caution: string;
  obligationNote: string;
}

export const EVIDENCE_META = ${JSON.stringify(
  {
    packageVersion: "v5.0",
    packageDate: "2026-10-29",
    totalCropClaims: totalClaims,
    supportedCropClaims: supportedTotal,
    crops: CROPS.length,
    cropsWithSalinityPair,
    sources: SOURCES.length,
    inputSections: INPUTS.length,
    modelVersion: MODEL_CARD.version,
    modelRows: MODEL_CARD.rows,
    modelLearnedFeatures: MODEL_CARD.featureCounts.learned,
    modelPhysicsOnlyFeatures: MODEL_CARD.featureCounts.physicsOnly,
    note: "Only the claims a decision reads are kept: family, season and the source-scoped FAO Annex 1 salinity threshold/slope pair. The rotation yield model is trained on MAPSPAM/SoilGrids/NASA, not on this ledger.",
  },
  null,
  2,
)} as const;

export const EVIDENCE_CROPS: EvidenceCrop[] = ${JSON.stringify(CROPS, null, 2)};

export interface ModelFeature {
  idx: number;
  key: string;
  name: string;
  unit: string;
  role: "learned" | "constant" | "physics_only" | "crop_trait";
  signal: number | null;
  /** The code path, if any, that consumes this dimension. "none" = display only. */
  usedBy: string;
  note: string;
}

export const MODEL_CARD = ${JSON.stringify(MODEL_CARD, null, 2)} as const;

export const MODEL_FEATURES: ModelFeature[] = ${JSON.stringify(MODEL_FEATURES, null, 2)};
`;

const auditBody = `${header}
 *
 * Full audit trail: the ${totalClaims} crop-parameter claims a decision reads,
 * the ${INPUTS.length} input evidence rules and the 30-source registry.
 * ${supportedTotal} claims reached a
 * named source scope. The rest are preserved, never used as verified facts.
 */

import type { EvidenceStatus } from "./crops.generated";

export * from "./crops.generated";

export interface EvidenceClaim {
  crop: string;
  parameter: string;
  value: string;
  status: EvidenceStatus;
  url: string | null;
  scope: string | null;
  note: string;
}

export interface EvidenceInputSection {
  section: number;
  name: string;
  nasaSupport: string;
  requiredEvidence: string;
  doNotEncode: string;
  correctLabel: string;
}

export interface EvidenceSource {
  id: string;
  organization: string;
  title: string;
  url: string;
  support: string;
  use: string;
  limits: string;
}

export const EVIDENCE_CLAIMS: EvidenceClaim[] = ${JSON.stringify(CLAIMS, null, 2)};

export const EVIDENCE_INPUTS: EvidenceInputSection[] = ${JSON.stringify(INPUTS, null, 2)};

export const EVIDENCE_SOURCES: EvidenceSource[] = ${JSON.stringify(SOURCES, null, 2)};
`;

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(cropsFile, cropsBody, "utf8");
fs.writeFileSync(auditFile, auditBody, "utf8");
console.log(
  `Wrote crops catalogue: ${CROPS.length} crops (${cropsWithSalinityPair} with FAO salinity pair).`,
);
console.log(
  `Wrote audit trail: ${CLAIMS.length} claims (${supportedTotal} supported), ${INPUTS.length} input sections, ${SOURCES.length} sources.`,
);
