/**
 * AUTO-GENERATED from the Agrorotate research package v5 (29 Oct 2026).
 * Regenerate with: node scripts/generate-evidence.mjs
 *
 * Catalogue + package metadata only. The 120-row audit ledger lives in
 * ./generated.ts and is code-split so it does not load on first paint.
 *
 * 26 of 120 crop claims are supported for a named
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

export const EVIDENCE_META = {
  "packageVersion": "v5.0",
  "packageDate": "2026-10-29",
  "totalCropClaims": 120,
  "supportedCropClaims": 26,
  "crops": 30,
  "cropsWithSalinityPair": 13,
  "sources": 30,
  "inputSections": 19,
  "modelVersion": "agrorotate.surrogate_weights/real-v1",
  "modelRows": 3404,
  "modelLearnedFeatures": 15,
  "modelPhysicsOnlyFeatures": 16,
  "note": "Only the claims a decision reads are kept: family, season and the source-scoped FAO Annex 1 salinity threshold/slope pair. The rotation yield model is trained on MAPSPAM/SoilGrids/NASA, not on this ledger."
} as const;

export const EVIDENCE_CROPS: EvidenceCrop[] = [
  {
    "name": "Bread Wheat",
    "scientificName": "Triticum aestivum",
    "family": "Poaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 6,
      "slopePercentPerDsm": 7.1,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Six-Row Barley",
    "scientificName": "Hordeum vulgare",
    "family": "Poaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 8,
      "slopePercentPerDsm": 5,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Grain Maize",
    "scientificName": "Zea mays",
    "family": "Poaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": 1.7,
      "slopePercentPerDsm": 12,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Grain Sorghum",
    "scientificName": "Sorghum bicolor",
    "family": "Poaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": 6.8,
      "slopePercentPerDsm": 16,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Pearl Millet",
    "scientificName": "Pennisetum glaucum",
    "family": "Poaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Paddy Rice",
    "scientificName": "Oryza sativa",
    "family": "Poaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "CONDITIONAL MATCH"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "CONDITIONAL MATCH": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Faba Bean",
    "scientificName": "Vicia faba",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "PARTIAL / ENDPOINT MISMATCH"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "PARTIAL / ENDPOINT MISMATCH": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Chickpea",
    "scientificName": "Cicer arietinum",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Lentil",
    "scientificName": "Lens culinaris",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Soybean",
    "scientificName": "Glycine max",
    "family": "Fabaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": 5,
      "slopePercentPerDsm": 20,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Cowpea",
    "scientificName": "Vigna unguiculata",
    "family": "Fabaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED AS APPLIED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED AS APPLIED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Berseem Clover Multi-Cut",
    "scientificName": "Trifolium alexandrinum",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 1.5,
      "slopePercentPerDsm": 5.7,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Alfalfa/Lucerne",
    "scientificName": "Medicago sativa",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 2,
      "slopePercentPerDsm": 7.3,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Hairy Vetch Cover",
    "scientificName": "Vicia villosa",
    "family": "Fabaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED AS APPLIED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED AS APPLIED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Sunflower",
    "scientificName": "Helianthus annuus",
    "family": "Asteraceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": 4.8,
      "slopePercentPerDsm": 5,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Winter Canola/Rapeseed",
    "scientificName": "Brassica napus",
    "family": "Brassicaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "MISMATCH: THRESHOLD"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "MISMATCH: THRESHOLD": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Sesame",
    "scientificName": "Sesamum indicum",
    "family": "Pedaliaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Peanut/Groundnut",
    "scientificName": "Arachis hypogaea",
    "family": "Fabaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": 3.2,
      "slopePercentPerDsm": 29,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Potato",
    "scientificName": "Solanum tuberosum",
    "family": "Solanaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 1.7,
      "slopePercentPerDsm": 12,
      "sourceUrl": "https://www.fao.org/4/X0490E/x0490e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Sweet Potato",
    "scientificName": "Ipomoea batatas",
    "family": "Convolvulaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "MISMATCH / RANGE COLLAPSED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "MISMATCH / RANGE COLLAPSED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Egyptian Cotton",
    "scientificName": "Gossypium barbadense",
    "family": "Malvaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "SPECIES MISMATCH"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SPECIES MISMATCH": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Flax/Linseed",
    "scientificName": "Linum usitatissimum",
    "family": "Linaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 1.7,
      "slopePercentPerDsm": 12,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Sugar Beet",
    "scientificName": "Beta vulgaris",
    "family": "Amaranthaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 7,
      "slopePercentPerDsm": 5.9,
      "sourceUrl": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Sugarcane",
    "scientificName": "Saccharum officinarum",
    "family": "Poaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "PARTIAL / ENDPOINT MISMATCH"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "PARTIAL / ENDPOINT MISMATCH": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Processing Tomato",
    "scientificName": "Solanum lycopersicum",
    "family": "Solanaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "MISMATCH / OVER-PRECISE"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "MISMATCH / OVER-PRECISE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Watermelon",
    "scientificName": "Citrullus lanatus",
    "family": "Cucurbitaceae",
    "seasonRaw": "Warm Season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Bulb Onion",
    "scientificName": "Allium cepa",
    "family": "Amaryllidaceae",
    "seasonRaw": "Cool Season",
    "season": "cool",
    "salinity": {
      "limitDsm": 1.2,
      "slopePercentPerDsm": 16,
      "sourceUrl": "https://www.fao.org/4/X0490E/x0490e0e.htm",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "status": "SUPPORTED FOR SOURCE SCOPE"
    },
    "claimsTotal": 4,
    "supportedClaims": 2,
    "unsupportedClaims": 2,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "SUPPORTED FOR SOURCE SCOPE": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Forage Oat Cover",
    "scientificName": "Avena sativa",
    "family": "Poaceae",
    "seasonRaw": "cool_season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Summer Cowpea Cover",
    "scientificName": "Vigna unguiculata",
    "family": "Fabaceae",
    "seasonRaw": "warm_season",
    "season": "warm",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED AS APPLIED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED AS APPLIED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.; This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  },
  {
    "name": "Bio-fumigant Mustard Cover",
    "scientificName": "Brassica spp.",
    "family": "Brassicaceae",
    "seasonRaw": "cool_season",
    "season": "cool",
    "salinity": {
      "limitDsm": null,
      "slopePercentPerDsm": null,
      "sourceUrl": null,
      "scope": null,
      "status": "UNSUPPORTED"
    },
    "claimsTotal": 4,
    "supportedClaims": 0,
    "unsupportedClaims": 4,
    "statusCounts": {
      "ESTIMATED — NO EXACT SOURCE ATTACHED": 2,
      "UNSUPPORTED": 2
    },
    "activationGate": "Activate only when required parameter cells are source-complete for pilot and agronomist-reviewed.",
    "caution": "Treat as provisional until each required crop parameter has a source with matching species, endpoint, region, conditions and units.",
    "obligationNote": "Preserved as supplied by the project file, not confirmed fact. No citation was attached to this value."
  }
];

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

export const MODEL_CARD = {
  "version": "agrorotate.surrogate_weights/real-v1",
  "architecture": "MLP 40 -> 64 -> 32 -> 4 (only head 0 is trained)",
  "predicts": "relative yield gap (%) of one crop on one site",
  "trainedOn": [
    "MAPSPAM 2020 cultivated grid cells (yield labels)",
    "SoilGrids 250 m topsoil 0-5 cm (sand, silt, clay, bulk density, SOC, CEC, pH)",
    "NASA POWER daily climate -> Hargreaves ETo (clamped in training)",
    "SRTM slope"
  ],
  "rows": 3404,
  "sites": 501,
  "crops": 22,
  "label": "100 * (1 - MAPSPAM yield_t_ha / p95 yield_t_ha of the same crop); clipped 0..100",
  "validation": "5-fold spatial block CV (folds from lat/lon blocks)",
  "metrics": {
    "oofMae": 20.57,
    "oofSpearman": 0.278,
    "withinCropSpearman": 0.221,
    "arcMae": 26.02,
    "arcR2": 0.173,
    "arcSpearman": 0.753
  },
  "featureCounts": {
    "total": 40,
    "learned": 15,
    "constant": 1,
    "physicsOnly": 16,
    "cropTraits": 8
  },
  "learnedNames": [
    "sand_fraction",
    "silt_fraction",
    "clay_fraction",
    "bulk_density_norm",
    "field_capacity",
    "wilting_point",
    "awc_norm",
    "ksat_norm",
    "drainage_index",
    "root_depth_norm",
    "ph_norm",
    "som_norm",
    "cec_norm",
    "annual_eto_norm",
    "slope_norm"
  ],
  "physicsOnlyNames": [
    "coarse_fragment",
    "water_table_norm",
    "ece_norm",
    "esp_norm",
    "caco3",
    "nitrogen_stock_norm",
    "phosphorus_norm",
    "potassium_norm",
    "root_knot_nematode",
    "fusarium_wilt",
    "allium_white_rot",
    "orobanche",
    "cyst_nematode",
    "rhizoctonia",
    "water_quota_norm",
    "ecw_norm"
  ],
  "physicsOnlyDetail": [
    "coarse_fragment — none — written as a feature, but no rule in the engine reads it",
    "water_table_norm — none — written as a feature, but no rule in the engine reads it",
    "ece_norm — salinity physics: Maas–Hoffman threshold/slope from the crop registry",
    "esp_norm — the infiltration estimate only (Ksat dispersion factor); the rotation plan does not read it",
    "caco3 — lab validation cross-checks only; the rotation plan does not read it",
    "nitrogen_stock_norm — none — the engine overwrites it with a 45 kg/ha working stock before inference",
    "phosphorus_norm — none — stored with the lab result, never read by a rule or by the model",
    "potassium_norm — none — stored with the lab result, never read by a rule or by the model",
    "root_knot_nematode — none — no diagnosis input exists in this build",
    "fusarium_wilt — none — no diagnosis input exists in this build",
    "allium_white_rot — none — no diagnosis input exists in this build",
    "orobanche — none — no diagnosis input exists in this build",
    "cyst_nematode — none — no diagnosis input exists in this build",
    "rhizoctonia — none — no diagnosis input exists in this build",
    "water_quota_norm — written as a model feature only; it does not cap or rescale the plan",
    "ecw_norm — salinity physics: irrigation ECw in the salt mass balance"
  ],
  "constantNames": [
    "aeration_stress"
  ],
  "measuredCrops": 22,
  "registeredCrops": 30,
  "salinity": {
    "policy": "The network never learned ECe, ESP, CaCO3, nutrients, the water quota or ECw: they were constant in training. Only ECe and ECw have a documented salinity rule; ESP reaches the infiltration estimate, and N/P/K are recorded only. There is no pathogen input. The model predicts no salinity number.",
    "eceCoverageSites": 85,
    "eceCoverageRows": 632,
    "eceExperiment": {
      "withoutEce": {
        "ece_input": "imputed",
        "oof_mae": 20.57,
        "oof_within_crop_spearman": 0.221,
        "oof_subset_632_rows_mae": 22.31,
        "oof_subset_within_crop_spearman": 0.151,
        "arc_mae": 26.02,
        "arc_r2": 0.173,
        "arc_spearman": 0.753,
        "arc_within_crop_spearman": 0.819,
        "ece_sweep_mean_gap_delta_16_vs_1_pp": 5.16
      },
      "withEce": {
        "ece_input": "real",
        "oof_mae": 20.56,
        "oof_within_crop_spearman": 0.222,
        "oof_subset_632_rows_mae": 22.28,
        "oof_subset_within_crop_spearman": 0.166,
        "arc_mae": 31.64,
        "arc_r2": -0.163,
        "arc_spearman": -0.244,
        "arc_within_crop_spearman": -0.247,
        "ece_sweep_mean_gap_delta_16_vs_1_pp": -7.93
      },
      "conclusion": "Feeding the measured ECe neither improves held-out gap accuracy (MAE 20.57 -> 20.56) nor teaches the correct salinity response: the ECe sweep flips sign (+5.2 pp at 16 vs 1 dS/m without ECe, -7.9 pp with it), and the independent ARC/ICARDA exam collapses (Spearman 0.753 -> -0.244, R2 0.173 -> -0.163). Cause: only 16% of sites have a WoSIS profile within 50 km, and those sites are not a random sample (well-managed temperate regions have low MAPSPAM gaps for reasons unrelated to salinity). ECe therefore stays a physics-only driver; the deployed model keeps the documented 0.5 dS/m constant."
    }
  },
  "note": "Crops without real training rows receive no neural penalty at runtime; the physical floor decides alone."
} as const;

export const MODEL_FEATURES: ModelFeature[] = [
  {
    "idx": 0,
    "key": "f0",
    "name": "sand_fraction",
    "unit": "frac",
    "role": "learned",
    "signal": 0.139,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 1,
    "key": "f1",
    "name": "silt_fraction",
    "unit": "frac",
    "role": "learned",
    "signal": -0.247,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 2,
    "key": "f2",
    "name": "clay_fraction",
    "unit": "frac",
    "role": "learned",
    "signal": 0.063,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 3,
    "key": "f3",
    "name": "coarse_fragment",
    "unit": "frac",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — written as a feature, but no rule in the engine reads it",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 4,
    "key": "f4",
    "name": "bulk_density_norm",
    "unit": "g/cm3",
    "role": "learned",
    "signal": 0.049,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 5,
    "key": "f5",
    "name": "field_capacity",
    "unit": "vol frac",
    "role": "learned",
    "signal": -0.056,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 6,
    "key": "f6",
    "name": "wilting_point",
    "unit": "vol frac",
    "role": "learned",
    "signal": 0.028,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 7,
    "key": "f7",
    "name": "awc_norm",
    "unit": "vol frac",
    "role": "learned",
    "signal": -0.24,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 8,
    "key": "f8",
    "name": "ksat_norm",
    "unit": "mm/hr",
    "role": "learned",
    "signal": -0.089,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 9,
    "key": "f9",
    "name": "drainage_index",
    "unit": "0..1",
    "role": "learned",
    "signal": -0.069,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 10,
    "key": "f10",
    "name": "water_table_norm",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — written as a feature, but no rule in the engine reads it",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 11,
    "key": "f11",
    "name": "root_depth_norm",
    "unit": "cm",
    "role": "learned",
    "signal": -0.002,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 12,
    "key": "f12",
    "name": "aeration_stress",
    "unit": "0..1",
    "role": "constant",
    "signal": null,
    "usedBy": "none — aeration is held at one value and no rule reads it",
    "note": "held at one documented value in every training row, so the model has no response to it"
  },
  {
    "idx": 13,
    "key": "f13",
    "name": "ph_norm",
    "unit": "pH",
    "role": "learned",
    "signal": -0.045,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 14,
    "key": "f14",
    "name": "ece_norm",
    "unit": "dS/m",
    "role": "physics_only",
    "signal": -0.005,
    "usedBy": "salinity physics: Maas–Hoffman threshold/slope from the crop registry",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 15,
    "key": "f15",
    "name": "esp_norm",
    "unit": "%",
    "role": "physics_only",
    "signal": null,
    "usedBy": "the infiltration estimate only (Ksat dispersion factor); the rotation plan does not read it",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 16,
    "key": "f16",
    "name": "caco3",
    "unit": "frac",
    "role": "physics_only",
    "signal": null,
    "usedBy": "lab validation cross-checks only; the rotation plan does not read it",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 17,
    "key": "f17",
    "name": "som_norm",
    "unit": "%",
    "role": "learned",
    "signal": -0.118,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 18,
    "key": "f18",
    "name": "cec_norm",
    "unit": "cmol/kg",
    "role": "learned",
    "signal": -0.188,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 19,
    "key": "f19",
    "name": "nitrogen_stock_norm",
    "unit": "kg/ha",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — the engine overwrites it with a 45 kg/ha working stock before inference",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 20,
    "key": "f20",
    "name": "phosphorus_norm",
    "unit": "ppm",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — stored with the lab result, never read by a rule or by the model",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 21,
    "key": "f21",
    "name": "potassium_norm",
    "unit": "ppm",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — stored with the lab result, never read by a rule or by the model",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 22,
    "key": "f22",
    "name": "root_knot_nematode",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 23,
    "key": "f23",
    "name": "fusarium_wilt",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 24,
    "key": "f24",
    "name": "allium_white_rot",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 25,
    "key": "f25",
    "name": "orobanche",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 26,
    "key": "f26",
    "name": "cyst_nematode",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 27,
    "key": "f27",
    "name": "rhizoctonia",
    "unit": "0..1",
    "role": "physics_only",
    "signal": null,
    "usedBy": "none — no diagnosis input exists in this build",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 28,
    "key": "f28",
    "name": "water_quota_norm",
    "unit": "m3/ha",
    "role": "physics_only",
    "signal": null,
    "usedBy": "written as a model feature only; it does not cap or rescale the plan",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 29,
    "key": "f29",
    "name": "ecw_norm",
    "unit": "dS/m",
    "role": "physics_only",
    "signal": null,
    "usedBy": "salinity physics: irrigation ECw in the salt mass balance",
    "note": "held constant in every training row, so the model has no learned response"
  },
  {
    "idx": 30,
    "key": "f30",
    "name": "annual_eto_norm",
    "unit": "mm/yr",
    "role": "learned",
    "signal": 0.022,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 31,
    "key": "f31",
    "name": "slope_norm",
    "unit": "%",
    "role": "learned",
    "signal": 0.089,
    "usedBy": "varies in training, so the trained network reads it",
    "note": "varies in the 3,404 training rows"
  },
  {
    "idx": 32,
    "key": "c0",
    "name": "crop Kc",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 33,
    "key": "c1",
    "name": "ECe threshold (dS/m)",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 34,
    "key": "c2",
    "name": "yield-loss slope (%/dS/m)",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 35,
    "key": "c3",
    "name": "N fixation (kg/ha)",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 36,
    "key": "c4",
    "name": "crop root depth (cm)",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 37,
    "key": "c5",
    "name": "base yield (t/ha)",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 38,
    "key": "c6",
    "name": "crop registry index",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  },
  {
    "idx": 39,
    "key": "c7",
    "name": "warm-season flag",
    "unit": "",
    "role": "crop_trait",
    "signal": null,
    "usedBy": "supplied per crop by the registry, for every slot",
    "note": "one value per crop, identical in training and at runtime"
  }
];
