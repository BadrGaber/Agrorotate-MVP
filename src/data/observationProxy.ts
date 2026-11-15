import type { LabSoil, WorkspaceState } from "../state/model";
import {
  COLOR_BY_OBSERVATION,
  COLOR_SOM,
  COMPACTION_BULK_DENSITY_DELTA,
  COMPACTION_BY_OBSERVATION,
  DRAINAGE_BY_OBSERVATION,
  DRAINAGE_LOOKUP,
  GROUP_TO_USDA_CLASS,
  REACTION_BY_OBSERVATION,
  REACTION_PH,
  SALINITY_BY_OBSERVATION,
  SALINITY_ECE,
  TEXTURE_GROUP_BY_OBSERVATION,
  TEXTURE_LOOKUP,
  computeSaxtonRawlsHydraulics,
} from "../engine/estimate";

export type ObservationRole = "ai" | "rule";

export interface ObservationProxy {

  value: string;

  detail: string;

  role: ObservationRole;

  learned: boolean;

  labKeys: (keyof LabSoil)[];

  overridden: boolean;
}

function num(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function prettyTextureClass(usdaClass: string): string {
  return usdaClass
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function hasAll(lab: LabSoil, keys: (keyof LabSoil)[]): boolean {
  return keys.every((key) => num(lab[key]) !== null);
}


function textureContext(state: WorkspaceState): {
  sand: number;
  silt: number;
  clay: number;
} {
  const lab = state.soil.lab;
  const sand = num(lab.sandPct);
  const silt = num(lab.siltPct);
  const clay = num(lab.clayPct);
  if (sand !== null && silt !== null && clay !== null) {
    const total = sand + silt + clay || 100;
    return {
      sand: (sand / total) * 100,
      silt: (silt / total) * 100,
      clay: (clay / total) * 100,
    };
  }

  const observed = state.soil.observations.textureRibbon;
  const group = observed ? TEXTURE_GROUP_BY_OBSERVATION[observed] : undefined;
  if (group) {
    const row = TEXTURE_LOOKUP[GROUP_TO_USDA_CLASS[group]];
    return { sand: row.sand, silt: row.silt, clay: row.clay };
  }

  return { sand: 32, silt: 34, clay: 34 };
}





export function observationProxy(
  key: string,
  option: string | null | undefined,
  state: WorkspaceState,
): ObservationProxy | null {
  if (!option || option === "unknown") return null;
  const lab = state.soil.lab;

  if (key === "textureRibbon") {
    const group = TEXTURE_GROUP_BY_OBSERVATION[option];
    if (!group) return null;
    const usda = GROUP_TO_USDA_CLASS[group];
    const row = TEXTURE_LOOKUP[usda];
    return {
      value: `${prettyTextureClass(usda)} — sand ${row.sand}%, silt ${row.silt}%, clay ${row.clay}%`,
      detail:
        "Used as an EST texture class. The model learned sand, silt and clay; a full laboratory analysis replaces all three.",
      role: "ai",
      learned: true,
      labKeys: ["sandPct", "siltPct", "clayPct"],
      overridden: hasAll(lab, ["sandPct", "siltPct", "clayPct"]),
    };
  }

  if (key === "compaction") {
    const compaction = COMPACTION_BY_OBSERVATION[option];
    if (!compaction) return null;
    const texture = textureContext(state);
    const soc = num(lab.socPct);
    const colour = state.soil.observations.colour;
    const colourClass = colour ? COLOR_BY_OBSERVATION[colour] : undefined;
    const som =
      soc !== null
        ? clamp(soc * 1.724, 0.15, 12.0)
        : colourClass
          ? Number(clamp(COLOR_SOM[colourClass] * (0.75 + 0.008 * texture.clay), 0.2, 10).toFixed(2))
          : Number(clamp(0.8 * 1.724, 0.2, 10).toFixed(2));
    const hydraulics = computeSaxtonRawlsHydraulics(
      texture.sand,
      texture.clay,
      som,
      compaction,
      undefined,
      0.02,
      4.0,
    );
    const delta = COMPACTION_BULK_DENSITY_DELTA[compaction];
    const offset =
      delta === 0
        ? "no offset from the texture baseline"
        : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} g/cm³ on the texture baseline`;
    return {
      value: `≈ ${hydraulics.bulkDensityGCm3.toFixed(2)} g/cm³ bulk density`,
      detail: `Used as an EST bulk-density adjustment (${offset}). The model learned bulk density; a lab value replaces it.`,
      role: "ai",
      learned: true,
      labKeys: ["bulkDensity"],
      overridden: num(lab.bulkDensity) !== null,
    };
  }

  if (key === "mottling") {
    const drainage = DRAINAGE_BY_OBSERVATION[option];
    if (!drainage) return null;
    const row = DRAINAGE_LOOKUP[drainage];
    return {
      value: `drainage index ${row.index.toFixed(1)}/5 (AI input) · water table ≈ ${row.wtCm} cm (screening)`,
      detail:
        "Used as an EST drainage class. The model learned the drainage index; the water-table depth is a screening value, not a laboratory measurement.",
      role: "ai",
      learned: true,
      labKeys: [],
      overridden: false,
    };
  }

  if (key === "surfaceSalt") {
    const salinity = SALINITY_BY_OBSERVATION[option];
    if (!salinity) return null;
    const base = SALINITY_ECE[salinity];
    const ecw = num(state.water.ecwDsm);
    const ece = ecw !== null ? Math.max(base, ecw * 1.5 * 0.85) : base;
    return {
      value: `≈ ${ece.toFixed(1)} dS/m ECe`,
      detail:
        "Used as an EST salinity proxy in the salt balance. The trained model is salinity-blind; the physics rule reads ECe. A saturated-paste ECe replaces it.",
      role: "rule",
      learned: false,
      labKeys: ["eceDsm"],
      overridden: num(lab.eceDsm) !== null,
    };
  }

  if (key === "reactionClue") {
    const reaction = REACTION_BY_OBSERVATION[option];
    if (!reaction) return null;
    const ph = REACTION_PH[reaction];
    return {
      value: `≈ pH ${ph.toFixed(1)}`,
      detail: "Used as an EST pH. The model learned pH; a laboratory pH replaces it.",
      role: "ai",
      learned: true,
      labKeys: ["ph"],
      overridden: num(lab.ph) !== null,
    };
  }

  if (key === "colour") {
    const colour = COLOR_BY_OBSERVATION[option];
    if (!colour) return null;
    const texture = textureContext(state);
    const som = Number(
      clamp(COLOR_SOM[colour] * (0.75 + 0.008 * texture.clay), 0.2, 10).toFixed(2),
    );
    const soc = som / 1.724;
    return {
      value: `≈ ${som.toFixed(2)}% organic matter · ≈ ${soc.toFixed(2)}% organic carbon`,
      detail:
        "Used as an EST organic-matter class. The model learned organic matter; a laboratory organic-carbon value replaces it.",
      role: "ai",
      learned: true,
      labKeys: ["socPct"],
      overridden: num(lab.socPct) !== null,
    };
  }

  return null;
}

const OBSERVATION_FOR_LAB: Partial<Record<keyof LabSoil, string>> = {
  sandPct: "textureRibbon",
  siltPct: "textureRibbon",
  clayPct: "textureRibbon",
  bulkDensity: "compaction",
  ph: "reactionClue",
  eceDsm: "surfaceSalt",
  socPct: "colour",
};

const OBSERVATION_LABEL: Record<string, string> = {
  textureRibbon: "texture",
  compaction: "compaction",
  mottling: "mottling",
  surfaceSalt: "salt-crust",
  reactionClue: "reaction",
  colour: "colour",
};





export function observationFallback(
  key: keyof LabSoil,
  state: WorkspaceState,
): string | undefined {
  const observationKey = OBSERVATION_FOR_LAB[key];
  if (!observationKey) return undefined;
  const option = state.soil.observations[observationKey];
  if (!option) return undefined;
  const proxy = observationProxy(observationKey, option, state);
  if (!proxy) return undefined;
  return `${proxy.value} (EST, from the ${OBSERVATION_LABEL[observationKey]} answer)`;
}
