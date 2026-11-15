/**
 * ============================================================================
 * AgroRotate — TRIPLE-LAYER AGRONOMIC VALIDATION GUARDRAILS ENGINE
 * NASA Space Apps Challenge
 * ============================================================================
 *
 * Enforces three simultaneous defense layers:
 *  - Layer 1: Hard physical range constraints (biophysical bounds per parameter)
 *  - Layer 2: Cross-parameter coherence & sanity checks (hydrologic, chemical & pedologic)
 *  - Layer 3: Data provenance tracking & confidence weighting (MEAS, EST, EO_PRIOR)
 */

import type { DataProvenance, NormalizedAgronomicVector } from "../state/model";
import { parseNumericInput } from "./numericInput.ts";

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  field: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  bounds?: { min: number; max: number; unit: string };
  suggestedAction?: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  confidenceSummary: {
    overallConfidenceScore: number; // 0.50 to 1.00
    uncertaintyBandPercent: number; // e.g. ±5% to ±25%
    tierCounts: Record<DataProvenance, number>;
  };
}

export interface PhysicalBound {
  min: number;
  max: number;
  unit: string;
  label: string;
}

/**
 * Layer 1 Master Physical Bounds Table.
 * Any entry outside these bounds violates thermodynamic, chemical, or biophysical reality.
 */
export const PHYSICAL_BOUNDS: Record<string, PhysicalBound> = {
  // Canonical scientific names
  sandPercent: { min: 0.0, max: 100.0, unit: "%", label: "Sand fraction" },
  siltPercent: { min: 0.0, max: 100.0, unit: "%", label: "Silt fraction" },
  clayPercent: { min: 0.0, max: 100.0, unit: "%", label: "Clay fraction" },
  bulkDensityGCm3: {
    min: 0.85,
    max: 1.95,
    unit: "g/cm³",
    label: "Dry bulk density",
  },
  fieldCapacityVolPct: {
    min: 6.0,
    max: 55.0,
    unit: "% vol",
    label: "Field capacity (θFC)",
  },
  wiltingPointVolPct: {
    min: 2.0,
    max: 38.0,
    unit: "% vol",
    label: "Wilting point (θPWP)",
  },
  awcMmM: {
    min: 0.0,
    max: 240.0,
    unit: "mm/m",
    label: "Available water capacity",
  },
  infiltrationRateMmHr: {
    min: 0.1,
    max: 250.0,
    unit: "mm/hr",
    label: "Saturated hydraulic conductivity",
  },
  drainageIndex: {
    min: 1.0,
    max: 5.0,
    unit: "index",
    label: "Internal drainage index",
  },
  waterTableDepthCm: {
    min: 15.0,
    max: 500.0,
    unit: "cm",
    label: "Depth to water table",
  },
  effectiveRootDepthCm: {
    min: 15.0,
    max: 250.0,
    unit: "cm",
    label: "Effective rooting depth",
  },
  phH2o: { min: 3.5, max: 10.5, unit: "pH", label: "Soil reaction pH" },
  eceDsm: {
    min: 0.1,
    max: 50.0,
    unit: "dS/m",
    label: "Saturated paste salinity (ECe)",
  },
  espPercent: {
    min: 0.0,
    max: 65.0,
    unit: "%",
    label: "Exchangeable sodium percentage (ESP)",
  },
  caco3Percent: {
    min: 0.0,
    max: 65.0,
    unit: "%",
    label: "Calcium carbonate (CaCO₃)",
  },
  somPercent: {
    min: 0.1,
    max: 12.0,
    unit: "%",
    label: "Soil organic matter (SOM)",
  },
  socPercent: {
    min: 0.05,
    max: 7.0,
    unit: "%",
    label: "Soil organic carbon (SOC)",
  },
  cecCmolKg: {
    min: 1.5,
    max: 65.0,
    unit: "cmol(+)/kg",
    label: "Cation exchange capacity (CEC)",
  },
  availableNPpm: {
    min: 0.0,
    max: 150.0,
    unit: "ppm",
    label: "Available mineral nitrogen (NO₃-N)",
  },
  availablePPpm: {
    min: 0.0,
    max: 100.0,
    unit: "ppm",
    label: "Olsen available phosphorus",
  },
  availableKPpm: {
    min: 0.0,
    max: 900.0,
    unit: "ppm",
    label: "Exchangeable potassium",
  },
  seasonalWaterQuotaM3Ha: {
    min: 0.0,
    max: 18000.0,
    unit: "m³/ha",
    label: "Seasonal water quota",
  },
  irrigationEcwDsm: {
    min: 0.1,
    max: 15.0,
    unit: "dS/m",
    label: "Irrigation water salinity (ECw)",
  },
  irrigationSarw: {
    min: 0.1,
    max: 35.0,
    unit: "ratio",
    label: "Irrigation sodium adsorption ratio (SARw)",
  },
  slopePercent: { min: 0.0, max: 45.0, unit: "%", label: "Topographic slope" },

  // UI & Lab state aliases (matching SmartInput fieldKeys)
  sandPct: { min: 0.0, max: 100.0, unit: "%", label: "Sand fraction" },
  siltPct: { min: 0.0, max: 100.0, unit: "%", label: "Silt fraction" },
  clayPct: { min: 0.0, max: 100.0, unit: "%", label: "Clay fraction" },
  bulkDensity: {
    min: 0.85,
    max: 1.95,
    unit: "g/cm³",
    label: "Dry bulk density",
  },
  ph: { min: 3.5, max: 10.5, unit: "pH", label: "Soil reaction pH" },
  espPct: {
    min: 0.0,
    max: 65.0,
    unit: "%",
    label: "Exchangeable sodium percentage (ESP)",
  },
  caco3Pct: {
    min: 0.0,
    max: 65.0,
    unit: "%",
    label: "Calcium carbonate (CaCO₃)",
  },
  socPct: {
    min: 0.05,
    max: 7.0,
    unit: "%",
    label: "Soil organic carbon (SOC)",
  },
  cec: {
    min: 1.5,
    max: 65.0,
    unit: "cmol(+)/kg",
    label: "Cation exchange capacity (CEC)",
  },
  no3nPpm: {
    min: 0.0,
    max: 150.0,
    unit: "ppm",
    label: "Available mineral nitrogen (NO₃-N)",
  },
  olsenPPpm: {
    min: 0.0,
    max: 100.0,
    unit: "ppm",
    label: "Olsen available phosphorus",
  },
  exchangeableKPpm: {
    min: 0.0,
    max: 900.0,
    unit: "ppm",
    label: "Exchangeable potassium",
  },
  ecwDsm: {
    min: 0.1,
    max: 15.0,
    unit: "dS/m",
    label: "Irrigation water salinity (ECw)",
  },
  sarw: {
    min: 0.1,
    max: 35.0,
    unit: "ratio",
    label: "Irrigation sodium adsorption ratio (SARw)",
  },
  quotaMm: { min: 0.0, max: 1800.0, unit: "mm", label: "Seasonal water quota" },
};

/**
 * Checks a single value against Layer 1 physical bounds.
 */
export function validateSingleField(
  fieldKey: string,
  value: number | string | null | undefined,
): ValidationIssue | null {
  if (value === null || value === undefined || value === "") return null;
  const bound = PHYSICAL_BOUNDS[fieldKey];
  if (!bound) return null;

  const parsed = parseNumericInput(value, {
    key: fieldKey,
    label: bound.label,
    unit: bound.unit,
    min: bound.min,
    max: bound.max,
  });

  if (parsed.ok) return null;

  const code = parsed.issue?.code;
  if (code === "not_a_number" || code === "not_finite") {
    return {
      id: `${fieldKey}_not_number`,
      field: fieldKey,
      severity: "error",
      title: "Non-numeric input",
      message: `The entered value "${value}" is not a valid number.`,
    };
  }

  return {
    id: `${fieldKey}_out_of_bounds`,
    field: fieldKey,
    severity: "error",
    title: `${bound.label} out of physical range`,
    message: `${bound.label} must be between ${bound.min} and ${bound.max} ${bound.unit}. Entered: ${
      typeof value === "number"
        ? value
        : Number(String(value).trim().replace(",", "."))
    } ${bound.unit}.`,
    bounds: bound,
    suggestedAction: `Check the lab report for typo or ensure value is within [${bound.min}, ${bound.max}].`,
  };
}

/**
 * Validates the complete scientific agronomic vector against all 3 layers.
 */
export function validateAgronomicVector(
  vector: NormalizedAgronomicVector,
): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // --------------------------------------------------------------------------
  // LAYER 1: HARD PHYSICAL BOUND CHECKS
  // --------------------------------------------------------------------------
  const phys = vector.soilPhysical;
  const chem = vector.soilChemical;
  const nut = vector.soilNutrients;
  const water = vector.waterAndIrrigation;
  const eo = vector.eoAgroclimate;

  const checkField = (key: string, val: number) => {
    const issue = validateSingleField(key, val);
    if (issue) {
      if (issue.severity === "error") errors.push(issue);
      else if (issue.severity === "warning") warnings.push(issue);
      else info.push(issue);
    }
  };

  checkField("sandPercent", phys.sandPercent);
  checkField("siltPercent", phys.siltPercent);
  checkField("clayPercent", phys.clayPercent);
  checkField("bulkDensityGCm3", phys.bulkDensityGCm3);
  checkField("fieldCapacityVolPct", phys.fieldCapacityVolPct);
  checkField("wiltingPointVolPct", phys.wiltingPointVolPct);
  checkField("awcMmM", phys.awcMmM);
  checkField("infiltrationRateMmHr", phys.infiltrationRateMmHr);
  checkField("drainageIndex", phys.drainageIndex);
  checkField("waterTableDepthCm", phys.waterTableDepthCm);
  checkField("effectiveRootDepthCm", phys.effectiveRootDepthCm);

  checkField("phH2o", chem.phH2o);
  checkField("eceDsm", chem.eceDsm);
  checkField("espPercent", chem.espPercent);
  checkField("caco3Percent", chem.caco3Percent);
  checkField("somPercent", chem.somPercent);
  checkField("socPercent", chem.socPercent);
  checkField("cecCmolKg", chem.cecCmolKg);

  checkField("availableNPpm", nut.availableNPpm);
  checkField("availablePPpm", nut.availablePPpm);
  checkField("availableKPpm", nut.availableKPpm);

  checkField("seasonalWaterQuotaM3Ha", water.seasonalWaterQuotaM3Ha);
  checkField("irrigationEcwDsm", water.irrigationEcwDsm);
  checkField("irrigationSarw", water.irrigationSarw);

  checkField("slopePercent", eo.slopePercent);

  // --------------------------------------------------------------------------
  // LAYER 2: CROSS-PARAMETER SANITY & COHERENCE CHECKS
  // --------------------------------------------------------------------------

  // 1. Soil Texture Particle-size sum
  const textureSum = phys.sandPercent + phys.siltPercent + phys.clayPercent;
  if (Math.abs(textureSum - 100.0) > 1.5) {
    errors.push({
      id: "cross_texture_sum",
      field: "soilTexture",
      severity: "error",
      title: "Soil texture fractions must sum to 100%",
      message: `Sand (${phys.sandPercent.toFixed(1)}%) + Silt (${phys.siltPercent.toFixed(1)}%) + Clay (${phys.clayPercent.toFixed(1)}%) = ${textureSum.toFixed(1)}%, deviating from 100%.`,
      suggestedAction:
        "Normalize particle-size fractions so their sum equals 100.0%.",
    });
  }

  // 2. Hydraulic sequence: Wilting Point < Field Capacity < Saturation
  if (phys.wiltingPointVolPct >= phys.fieldCapacityVolPct) {
    errors.push({
      id: "cross_hydraulic_pwp_fc",
      field: "fieldCapacityVolPct",
      severity: "error",
      title: "Physical contradiction in soil moisture retention",
      message: `Wilting point (${phys.wiltingPointVolPct}%) cannot be greater than or equal to field capacity (${phys.fieldCapacityVolPct}%).`,
      suggestedAction:
        "Review pressure-plate extraction data (FC at -33 kPa must hold more water than PWP at -1500 kPa).",
    });
  }
  if (phys.fieldCapacityVolPct >= phys.saturationVolPct) {
    errors.push({
      id: "cross_hydraulic_fc_sat",
      field: "saturationVolPct",
      severity: "error",
      title: "Field capacity exceeds total porosity saturation",
      message: `Field capacity (${phys.fieldCapacityVolPct}%) cannot exceed total saturation porosity (${phys.saturationVolPct}%).`,
      suggestedAction:
        "Reduce field capacity or adjust bulk density to allow sufficient drainable macropores.",
    });
  }

  // 3. Calcium Carbonate (Lime) vs. pH contradiction
  if (chem.caco3Percent > 15.0 && chem.phH2o < 6.5) {
    errors.push({
      id: "cross_lime_ph_contradiction",
      field: "phH2o",
      severity: "error",
      title: "Calcareous alkaline buffer contradiction",
      message: `Soil has high CaCO₃ (${chem.caco3Percent.toFixed(1)}%) but an acidic pH (${chem.phH2o.toFixed(2)}). Free calcium carbonate buffers soil reaction to pH > 7.3.`,
      suggestedAction:
        "Verify whether the acid fizz test was false, or re-test pH electrode calibration.",
    });
  }

  // 4. Irrigation Water Salinity vs. Steady-State Soil Salinity
  if (
    water.waterSupplyRegime !== "RAINFED" &&
    chem.eceDsm < 0.75 * water.irrigationEcwDsm &&
    water.irrigationEcwDsm > 1.5
  ) {
    warnings.push({
      id: "cross_salinity_water_soil",
      field: "eceDsm",
      severity: "warning",
      title: "Soil salinity unusually lower than irrigation water",
      message: `Soil ECe (${chem.eceDsm.toFixed(2)} dS/m) is significantly lower than irrigation water ECw (${water.irrigationEcwDsm.toFixed(2)} dS/m). Under steady-state irrigation, soil ECe typically stabilizes at ≥ 1.2 × ECw.`,
      suggestedAction:
        "Confirm whether the field was recently reclaimed, flood-leached with rainwater, or if the water sample is unusually saline.",
    });
  }

  // 5. Effective root depth vs. Water table depth
  if (phys.effectiveRootDepthCm > phys.waterTableDepthCm - 10) {
    warnings.push({
      id: "cross_root_water_table",
      field: "effectiveRootDepthCm",
      severity: "warning",
      title: "Root depth penetrates shallow water table",
      message: `Effective root depth (${phys.effectiveRootDepthCm} cm) exceeds safe distance to water table (${phys.waterTableDepthCm} cm), causing aeration stress and root rot.`,
      suggestedAction:
        "Root zone should be capped at water table depth minus 15 cm unless sub-surface drainage is active.",
    });
  }

  // 6. Sodicity (ESP) vs. Infiltration collapse
  if (chem.espPercent > 15.0 && phys.infiltrationRateMmHr > 25.0) {
    warnings.push({
      id: "cross_esp_ksat_dispersion",
      field: "infiltrationRateMmHr",
      severity: "warning",
      title: "High ESP with elevated infiltration rate",
      message: `ESP is ${chem.espPercent.toFixed(1)}% (sodic soil prone to clay dispersion), but infiltration rate is reported at ${phys.infiltrationRateMmHr.toFixed(1)} mm/hr. Dispersion usually plugs macro-pores unless soil has high electrolyte salinity.`,
      suggestedAction:
        "Assess whether gypsum application is needed to maintain hydraulic conductivity.",
    });
  }

  // --------------------------------------------------------------------------
  // LAYER 3: PROVENANCE & CONFIDENCE SUMMARY
  // --------------------------------------------------------------------------
  const tierCounts: Record<DataProvenance, number> = {
    MEAS: 0,
    EST: 0,
    EO_PRIOR: 0,
    EO_FALLBACK: 0,
  };

  let totalWeight = 0;
  let featureCount = 0;

  for (const meta of Object.values(vector.provenance)) {
    const tier = meta.source === "EO_FALLBACK" ? "EO_PRIOR" : meta.source;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    totalWeight += meta.confidenceWeight;
    featureCount += 1;
  }

  const overallConfidenceScore =
    featureCount > 0 ? Number((totalWeight / featureCount).toFixed(3)) : 0.75;
  // Uncertainty band: 100% MEAS => ±5%, 75% EST => ±14%, 50% EO => ±24%
  const uncertaintyBandPercent = Number(
    ((1.0 - overallConfidenceScore) * 38.0 + 4.5).toFixed(1),
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    confidenceSummary: {
      overallConfidenceScore,
      uncertaintyBandPercent,
      tierCounts,
    },
  };
}
