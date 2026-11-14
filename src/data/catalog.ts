import { EVIDENCE_CROPS, type EvidenceCrop } from "./evidence/crops.generated";
import type { GlyphName } from "../ui/icons";

export interface CatalogCrop {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  season: "cool" | "warm";
  seasonRaw: string | null;
  /** Only non-null when the v5 ledger marks the FAO pair SUPPORTED FOR SOURCE SCOPE. */
  salinityLimitDsm: number | null;
  salinitySlopePercentPerDsm: number | null;
  salinitySourceUrl: string | null;
  claimsTotal: number;
  supportedClaims: number;
  statusCounts: Record<string, number>;
  accent: string;
  glyph: GlyphName;
  isCoverCrop: boolean;
  roleLabel: string;
}

const FAMILY_ACCENT: Record<string, string> = {
  Poaceae: "var(--harvest)",
  Fabaceae: "var(--forest)",
  Brassicaceae: "var(--sky)",
  Solanaceae: "var(--clay)",
  Asteraceae: "var(--plum)",
  Malvaceae: "var(--plum)",
  Cucurbitaceae: "var(--harvest)",
  Amaryllidaceae: "var(--sky)",
  Amaranthaceae: "var(--clay)",
  Linaceae: "var(--sky)",
  Pedaliaceae: "var(--plum)",
  Convolvulaceae: "var(--clay)",
};

const COVER_PATTERN = /cover|clover|vetch|alfalfa|lucerne/i;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function roleOf(crop: EvidenceCrop): { label: string; glyph: GlyphName } {
  const name = crop.name.toLowerCase();
  if (COVER_PATTERN.test(name))
    return { label: "Forage / cover", glyph: "sprout" };
  if (/bean|chickpea|lentil|peanut|cowpea|soybean/.test(name))
    return { label: "Grain legume", glyph: "sprout" };
  if (/wheat|barley|maize|sorghum|millet|rice|oat/.test(name))
    return { label: "Cereal", glyph: "wheat" };
  if (/cotton|flax/.test(name)) return { label: "Fibre / oilseed", glyph: "sun" };
  if (/sugar|potato|beet/.test(name)) return { label: "Root / sugar", glyph: "layers" };
  if (/onion|tomato|watermelon|canola|sunflower|sesame/.test(name))
    return { label: "Oilseed / vegetable", glyph: "drop" };
  return { label: "Crop", glyph: "sprout" };
}

export const CROP_CATALOG: CatalogCrop[] = EVIDENCE_CROPS.map((crop) => {
  const role = roleOf(crop);
  return {
    id: slugify(crop.name),
    name: crop.name,
    scientificName: crop.scientificName,
    family: crop.family,
    season: crop.season,
    seasonRaw: crop.seasonRaw,
    salinityLimitDsm: crop.salinity.limitDsm,
    salinitySlopePercentPerDsm: crop.salinity.slopePercentPerDsm,
    salinitySourceUrl: crop.salinity.sourceUrl,
    claimsTotal: crop.claimsTotal,
    supportedClaims: crop.supportedClaims,
    statusCounts: crop.statusCounts,
    accent: FAMILY_ACCENT[crop.family] ?? "var(--forest)",
    glyph: role.glyph,
    isCoverCrop: COVER_PATTERN.test(crop.name),
    roleLabel: role.label,
  };
});

export const CROPS_BY_ID: Record<string, CatalogCrop> = Object.fromEntries(
  CROP_CATALOG.map((crop) => [crop.id, crop]),
);

export function cropById(id: string | null | undefined): CatalogCrop | null {
  return id ? (CROPS_BY_ID[id] ?? null) : null;
}

export const CROP_FAMILIES = Array.from(
  new Set(CROP_CATALOG.map((crop) => crop.family)),
).sort();

export const SALINITY_VERIFIED_COUNT = CROP_CATALOG.filter(
  (crop) => crop.salinityLimitDsm !== null,
).length;
