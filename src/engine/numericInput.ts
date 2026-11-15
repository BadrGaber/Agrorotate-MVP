/**
 * One numeric-input contract for the whole engine.
 *
 * Two rules this module exists to enforce:
 *  1. `0` is a value, not "missing". Nothing here uses truthiness.
 *  2. Text that is not a finite number never becomes a value silently. It is
 *     reported as an issue so the caller can stop the affected evaluation.
 *
 * Absence (null / undefined / empty string) is different from invalidity. An
 * optional field may be absent; a required one may not. A field may declare an
 * explicit planning default for absence only — never for invalid text.
 */

export type NumericIssueCode =
  | "required_missing"
  | "not_a_number"
  | "not_finite"
  | "below_min"
  | "above_max";

export interface NumericInputSpec {
  /** Stable field id used in reports and UI messages. */
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  /** Absence is an error when this is true. */
  required?: boolean;
  /**
   * Declared value used only when the field is EMPTY, with the scientific or
   * planning reason. Invalid text never uses this default.
   */
  absentFallback?: { value: number; reason: string };
  /** Reason for a caller-supplied default when absence depends on context. */
  absentFallbackReason?: string;
}

export interface NumericInputIssue {
  field: string;
  code: NumericIssueCode;
  message: string;
  received: string | null;
}

export interface NumericParseResult {
  ok: boolean;
  present: boolean;
  value: number | null;
  issue: NumericInputIssue | null;
}

const isBlank = (raw: unknown): boolean =>
  raw === null ||
  raw === undefined ||
  (typeof raw === "string" && raw.trim() === "");

function describeReceived(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw;
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function issue(
  spec: NumericInputSpec,
  code: NumericIssueCode,
  message: string,
  raw: unknown,
): NumericParseResult {
  return {
    ok: false,
    present: false,
    value: null,
    issue: {
      field: spec.key,
      code,
      message,
      received: describeReceived(raw),
    },
  };
}

/**
 * Parses one UI / API value against a field-specific spec.
 * Bounds are per variable and unit; there is no shared global range.
 */
export function parseNumericInput(
  raw: unknown,
  spec: NumericInputSpec,
): NumericParseResult {
  if (isBlank(raw)) {
    if (spec.required) {
      return issue(
        spec,
        "required_missing",
        `${spec.label} is required and was left empty.`,
        raw,
      );
    }
    return { ok: true, present: false, value: null, issue: null };
  }

  let value: number;
  if (typeof raw === "number") {
    value = raw;
  } else if (typeof raw === "string") {
    const normalized = raw.trim().replace(",", ".");
    value = Number(normalized);
    if (Number.isNaN(value)) {
      return issue(
        spec,
        "not_a_number",
        `${spec.label} must be a finite number in ${spec.unit}; received "${raw}".`,
        raw,
      );
    }
  } else {
    return issue(
      spec,
      "not_a_number",
      `${spec.label} must be a number in ${spec.unit}; received "${describeReceived(raw)}".`,
      raw,
    );
  }

  if (!Number.isFinite(value)) {
    return issue(
      spec,
      "not_finite",
      `${spec.label} must be a finite number in ${spec.unit}; received "${describeReceived(raw)}". NaN and ±Infinity are rejected.`,
      raw,
    );
  }

  if (value < spec.min) {
    return issue(
      spec,
      "below_min",
      `${spec.label} must be at least ${spec.min} ${spec.unit}; received ${value}.`,
      raw,
    );
  }
  if (value > spec.max) {
    return issue(
      spec,
      "above_max",
      `${spec.label} must be at most ${spec.max} ${spec.unit}; received ${value}.`,
      raw,
    );
  }

  return { ok: true, present: true, value, issue: null };
}

/**
 * Reads a value that must be a number for the calculation to run.
 *
 * - valid value (including 0) -> that value, no issue
 * - empty + declared absentFallback -> the declared default, no issue
 * - empty + no declared default -> `fallback`, no issue (caller documents it)
 * - invalid -> `fallback` AND an issue; callers must not use the result as a
 *   valid decision. The optimizer blocks the run when any issue is returned.
 */
export function resolveNumericInput(
  raw: unknown,
  spec: NumericInputSpec,
  fallback: number,
): { value: number; issue: NumericInputIssue | null; usedFallback: boolean } {
  const parsed = parseNumericInput(raw, spec);
  if (parsed.ok) {
    if (parsed.present) {
      return { value: parsed.value ?? fallback, issue: null, usedFallback: false };
    }
    return {
      value: spec.absentFallback?.value ?? fallback,
      issue: null,
      usedFallback: true,
    };
  }
  return { value: fallback, issue: parsed.issue, usedFallback: true };
}

/** Keeps a computed number only when it is finite; otherwise uses the fallback. */
export function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Field specs for the numbers that enter the optimizer. Ranges are per
 * variable and unit; a zero is accepted wherever zero is physically meaningful.
 */
export const INPUT_SPECS = {
  waterQuotaMm: {
    key: "water.quotaMm",
    label: "Seasonal water quota",
    unit: "mm / season (the unit the app stores)",
    min: 0,
    // The engine, the API fixtures and the planning default (5500) all use this
    // stored range; 18,000 is the same ceiling as the scientific vector field.
    max: 18000,
    absentFallbackReason:
      "Blank quota falls back to the declared planning default (1500 mm rain-fed / 5500 mm irrigated) shown on the water step.",
  } as NumericInputSpec,
  waterEcwDsm: {
    key: "water.ecwDsm",
    label: "Irrigation water salinity (ECw)",
    unit: "dS/m",
    min: 0.1,
    max: 15,
    absentFallback: {
      value: 1.1,
      reason: "Blank ECw uses the regional water-source prior, labelled EST.",
    },
  } as NumericInputSpec,
  waterSarw: {
    key: "water.sarw",
    label: "Irrigation sodium adsorption ratio (SARw)",
    unit: "ratio",
    min: 0,
    max: 35,
    absentFallback: {
      value: 2.0,
      reason: "Blank SARw uses the regional water-source prior, labelled EST.",
    },
  } as NumericInputSpec,
  waterNo3nPpm: {
    key: "water.no3nPpm",
    label: "Irrigation-water nitrate nitrogen",
    unit: "ppm",
    min: 0,
    max: 150,
    absentFallback: {
      value: 2.0,
      reason: "Blank water N uses the regional water-source prior, labelled EST.",
    },
  } as NumericInputSpec,
  eceDsm: {
    key: "soil.eceDsm",
    label: "Saturated-paste salinity (ECe)",
    unit: "dS/m",
    min: 0.1,
    max: 50,
  } as NumericInputSpec,
  ph: {
    key: "soil.ph",
    label: "Soil reaction pH",
    unit: "pH",
    min: 3.5,
    max: 10.5,
  } as NumericInputSpec,
  espPct: {
    key: "soil.espPct",
    label: "Exchangeable sodium percentage (ESP)",
    unit: "%",
    min: 0,
    max: 65,
  } as NumericInputSpec,
  caco3Pct: {
    key: "soil.caco3Pct",
    label: "Calcium carbonate (CaCO₃)",
    unit: "%",
    min: 0,
    max: 65,
  } as NumericInputSpec,
  no3nPpm: {
    key: "soil.no3nPpm",
    label: "Available mineral nitrogen (NO₃-N)",
    unit: "ppm",
    min: 0,
    max: 150,
  } as NumericInputSpec,
  olsenPPpm: {
    key: "soil.olsenPPpm",
    label: "Olsen available phosphorus",
    unit: "ppm",
    min: 0,
    max: 100,
  } as NumericInputSpec,
  exchangeableKPpm: {
    key: "soil.exchangeableKPpm",
    label: "Exchangeable potassium",
    unit: "ppm",
    min: 0,
    max: 900,
  } as NumericInputSpec,
  priorityWeight: {
    key: "priorities.weight",
    label: "Priority weight",
    unit: "0–5",
    min: 0,
    max: 5,
    absentFallback: { value: 3, reason: "Blank slider means neutral weight (3)." },
  } as NumericInputSpec,
} as const;
