/**
 * AUTO-GENERATED from the Agrorotate research package v5 (29 Oct 2026).
 * Regenerate with: node scripts/generate-evidence.mjs
 *
 * Full audit trail: the 120 crop-parameter claims a decision reads,
 * the 19 input evidence rules and the 30-source registry.
 * 26 claims reached a
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

export const EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    "crop": "Bread Wheat",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bread Wheat",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bread Wheat",
    "parameter": "Salinity Limit",
    "value": "6.0 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for wheat grain yield in FAO A1.1; retain source condition. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Bread Wheat",
    "parameter": "Yield Loss Slope",
    "value": "7.1%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for wheat grain yield in FAO A1.1; retain source condition. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Six-Row Barley",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Six-Row Barley",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Six-Row Barley",
    "parameter": "Salinity Limit",
    "value": "8.0 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for barley grain yield in FAO A1.1; not the same endpoint as forage barley. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Six-Row Barley",
    "parameter": "Yield Loss Slope",
    "value": "5.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for barley grain yield in FAO A1.1; not the same endpoint as forage barley. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Grain Maize",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Grain Maize",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Grain Maize",
    "parameter": "Salinity Limit",
    "value": "1.7 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for corn ear fresh-weight response in FAO A1.1 / FAO-56 table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Grain Maize",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for corn ear fresh-weight response in FAO A1.1 / FAO-56 table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Grain Sorghum",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Grain Sorghum",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Grain Sorghum",
    "parameter": "Salinity Limit",
    "value": "6.8 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sorghum grain yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Grain Sorghum",
    "parameter": "Yield Loss Slope",
    "value": "16.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sorghum grain yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Pearl Millet",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Pearl Millet",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Pearl Millet",
    "parameter": "Salinity Limit",
    "value": "6.0 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numeric source located for Pennisetum glaucum in the cited FAO table; do not borrow from a different “millet” species. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Pearl Millet",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numeric source located for Pennisetum glaucum in the cited FAO table; do not borrow from a different “millet” species. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Paddy Rice",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Paddy Rice",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Paddy Rice",
    "parameter": "Salinity Limit",
    "value": "3.0 dS/m",
    "status": "CONDITIONAL MATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO A1.1, with footnoted conditions/growth-stage qualifications. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Paddy Rice",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "CONDITIONAL MATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO A1.1, with footnoted conditions/growth-stage qualifications. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Faba Bean",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Faba Bean",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Faba Bean",
    "parameter": "Salinity Limit",
    "value": "1.6 dS/m",
    "status": "PARTIAL / ENDPOINT MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists broad bean Vicia faba at 1.6/9.6 for shoot dry weight, not directly grain yield; the numeric pair matches but endpoint differs. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Faba Bean",
    "parameter": "Yield Loss Slope",
    "value": "9.6%/dS/m",
    "status": "PARTIAL / ENDPOINT MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists broad bean Vicia faba at 1.6/9.6 for shoot dry weight, not directly grain yield; the numeric pair matches but endpoint differs. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Chickpea",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Chickpea",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Chickpea",
    "parameter": "Salinity Limit",
    "value": "1.5 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 lists chickpea with no numeric threshold/slope (— / —). The file’s exact pair is unsupported by this source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Chickpea",
    "parameter": "Yield Loss Slope",
    "value": "14.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 lists chickpea with no numeric threshold/slope (— / —). The file’s exact pair is unsupported by this source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Lentil",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Lentil",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Lentil",
    "parameter": "Salinity Limit",
    "value": "1.3 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numeric lentil threshold/slope located in the cited table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Lentil",
    "parameter": "Yield Loss Slope",
    "value": "13.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numeric lentil threshold/slope located in the cited table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Soybean",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Soybean",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Soybean",
    "parameter": "Salinity Limit",
    "value": "5.0 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for soybean seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Soybean",
    "parameter": "Yield Loss Slope",
    "value": "20.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for soybean seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Cowpea",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Cowpea",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Cowpea",
    "parameter": "Salinity Limit",
    "value": "4.9 dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists forage cowpea at 2.5/11 for shoot dry weight; this is not the same endpoint as grain/cover crop. File values are not supported by that table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Cowpea",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists forage cowpea at 2.5/11 for shoot dry weight; this is not the same endpoint as grain/cover crop. File values are not supported by that table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Berseem Clover Multi-Cut",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Berseem Clover Multi-Cut",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Berseem Clover Multi-Cut",
    "parameter": "Salinity Limit",
    "value": "1.5 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for berseem shoot dry weight in FAO A1.1. Not a seed-yield threshold. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Berseem Clover Multi-Cut",
    "parameter": "Yield Loss Slope",
    "value": "5.7%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for berseem shoot dry weight in FAO A1.1. Not a seed-yield threshold. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Alfalfa/Lucerne",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Alfalfa/Lucerne",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Alfalfa/Lucerne",
    "parameter": "Salinity Limit",
    "value": "2.0 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for alfalfa shoot dry weight in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Alfalfa/Lucerne",
    "parameter": "Yield Loss Slope",
    "value": "7.3%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for alfalfa shoot dry weight in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Hairy Vetch Cover",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Hairy Vetch Cover",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Hairy Vetch Cover",
    "parameter": "Salinity Limit",
    "value": "3.0 dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists common vetch Vicia angustifolia at 3.0/11 for shoot dry weight, not hairy vetch Vicia villosa. Species mismatch; cannot transfer without a source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Hairy Vetch Cover",
    "parameter": "Yield Loss Slope",
    "value": "11.0%/dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO lists common vetch Vicia angustifolia at 3.0/11 for shoot dry weight, not hairy vetch Vicia villosa. Species mismatch; cannot transfer without a source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sunflower",
    "parameter": "Family",
    "value": "Asteraceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sunflower",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sunflower",
    "parameter": "Salinity Limit",
    "value": "4.8 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sunflower seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sunflower",
    "parameter": "Yield Loss Slope",
    "value": "5.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sunflower seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Winter Canola/Rapeseed",
    "parameter": "Family",
    "value": "Brassicaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Winter Canola/Rapeseed",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Winter Canola/Rapeseed",
    "parameter": "Salinity Limit",
    "value": "9.0 dS/m",
    "status": "MISMATCH: THRESHOLD",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 gives B. napus 11.0/13 for seed yield. 9.7/14 is for B. rapa. Threshold in file mismatches the stated species. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Winter Canola/Rapeseed",
    "parameter": "Yield Loss Slope",
    "value": "13.0%/dS/m",
    "status": "MISMATCH: THRESHOLD",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 gives B. napus 11.0/13 for seed yield. 9.7/14 is for B. rapa. Threshold in file mismatches the stated species. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sesame",
    "parameter": "Family",
    "value": "Pedaliaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sesame",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sesame",
    "parameter": "Salinity Limit",
    "value": "2.5 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 identifies sesame as salt-sensitive but gives no numeric threshold/slope (— / —). File pair unsupported by this table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sesame",
    "parameter": "Yield Loss Slope",
    "value": "11.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 identifies sesame as salt-sensitive but gives no numeric threshold/slope (— / —). File pair unsupported by this table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Peanut/Groundnut",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Peanut/Groundnut",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Peanut/Groundnut",
    "parameter": "Salinity Limit",
    "value": "3.2 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for peanut seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Peanut/Groundnut",
    "parameter": "Yield Loss Slope",
    "value": "29.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for peanut seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Potato",
    "parameter": "Family",
    "value": "Solanaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Potato",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Potato",
    "parameter": "Salinity Limit",
    "value": "1.7 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for potato in FAO-56 Table 23 / FAO salt-tolerance source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Potato",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for potato in FAO-56 Table 23 / FAO salt-tolerance source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sweet Potato",
    "parameter": "Family",
    "value": "Convolvulaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sweet Potato",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sweet Potato",
    "parameter": "Salinity Limit",
    "value": "1.5 dS/m",
    "status": "MISMATCH / RANGE COLLAPSED",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO-56 gives a threshold range 1.5–2.5 and slope 10.0; file’s 1.5/11.0 does not match that table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sweet Potato",
    "parameter": "Yield Loss Slope",
    "value": "11.0%/dS/m",
    "status": "MISMATCH / RANGE COLLAPSED",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO-56 gives a threshold range 1.5–2.5 and slope 10.0; file’s 1.5/11.0 does not match that table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Egyptian Cotton",
    "parameter": "Family",
    "value": "Malvaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Egyptian Cotton",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Egyptian Cotton",
    "parameter": "Salinity Limit",
    "value": "7.7 dS/m",
    "status": "SPECIES MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO’s 7.7/5.2 row is G. hirsutum seed-cotton yield, not Egyptian G. barbadense. Egypt-specific studies show genotype variation; direct transfer is not justified. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Egyptian Cotton",
    "parameter": "Yield Loss Slope",
    "value": "5.2%/dS/m",
    "status": "SPECIES MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO’s 7.7/5.2 row is G. hirsutum seed-cotton yield, not Egyptian G. barbadense. Egypt-specific studies show genotype variation; direct transfer is not justified. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Flax/Linseed",
    "parameter": "Family",
    "value": "Linaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Flax/Linseed",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Flax/Linseed",
    "parameter": "Salinity Limit",
    "value": "1.7 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for flax seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Flax/Linseed",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for flax seed yield in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sugar Beet",
    "parameter": "Family",
    "value": "Amaranthaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sugar Beet",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sugar Beet",
    "parameter": "Salinity Limit",
    "value": "7.0 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sugar-beet storage-root response in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sugar Beet",
    "parameter": "Yield Loss Slope",
    "value": "5.9%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH for sugar-beet storage-root response in FAO A1.1. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sugarcane",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sugarcane",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Sugarcane",
    "parameter": "Salinity Limit",
    "value": "1.7 dS/m",
    "status": "PARTIAL / ENDPOINT MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO A1.1 for shoot dry weight, not necessarily commercial cane/sugar yield. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Sugarcane",
    "parameter": "Yield Loss Slope",
    "value": "5.9%/dS/m",
    "status": "PARTIAL / ENDPOINT MISMATCH",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO A1.1 for shoot dry weight, not necessarily commercial cane/sugar yield. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Processing Tomato",
    "parameter": "Family",
    "value": "Solanaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Processing Tomato",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Processing Tomato",
    "parameter": "Salinity Limit",
    "value": "2.5 dS/m",
    "status": "MISMATCH / OVER-PRECISE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO-56 table reports tomato threshold 0.9–2.5 and slope 9.0; file fixes threshold at upper end and changes slope to 9.9. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Processing Tomato",
    "parameter": "Yield Loss Slope",
    "value": "9.9%/dS/m",
    "status": "MISMATCH / OVER-PRECISE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO-56 table reports tomato threshold 0.9–2.5 and slope 9.0; file fixes threshold at upper end and changes slope to 9.9. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Watermelon",
    "parameter": "Family",
    "value": "Cucurbitaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Watermelon",
    "parameter": "Season",
    "value": "Warm Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Watermelon",
    "parameter": "Salinity Limit",
    "value": "2.2 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO table lists no numeric threshold/slope for watermelon in the cited Annex; file pair unsupported by that source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Watermelon",
    "parameter": "Yield Loss Slope",
    "value": "7.6%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO table lists no numeric threshold/slope for watermelon in the cited Annex; file pair unsupported by that source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Bulb Onion",
    "parameter": "Family",
    "value": "Amaryllidaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bulb Onion",
    "parameter": "Season",
    "value": "Cool Season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bulb Onion",
    "parameter": "Salinity Limit",
    "value": "1.2 dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO-56 Table 23 / FAO salt-tolerance source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Bulb Onion",
    "parameter": "Yield Loss Slope",
    "value": "16.0%/dS/m",
    "status": "SUPPORTED FOR SOURCE SCOPE",
    "url": "https://www.fao.org/4/X0490E/x0490e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "MATCH in FAO-56 Table 23 / FAO salt-tolerance source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Forage Oat Cover",
    "parameter": "Family",
    "value": "Poaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Forage Oat Cover",
    "parameter": "Season",
    "value": "cool_season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Forage Oat Cover",
    "parameter": "Salinity Limit",
    "value": "5.0 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 gives no numeric oat threshold/slope (— / —), with a qualitative tolerance rating; file’s numeric pair unsupported by this source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Forage Oat Cover",
    "parameter": "Yield Loss Slope",
    "value": "7.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "FAO A1.1 gives no numeric oat threshold/slope (— / —), with a qualitative tolerance rating; file’s numeric pair unsupported by this source. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Summer Cowpea Cover",
    "parameter": "Family",
    "value": "Fabaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Summer Cowpea Cover",
    "parameter": "Season",
    "value": "warm_season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Summer Cowpea Cover",
    "parameter": "Salinity Limit",
    "value": "4.9 dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "Same issue as cowpea: FAO forage-cowpea value is 2.5/11 on shoot dry weight; not a direct cover-crop or grain-yield threshold. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Summer Cowpea Cover",
    "parameter": "Yield Loss Slope",
    "value": "12.0%/dS/m",
    "status": "UNSUPPORTED AS APPLIED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "Same issue as cowpea: FAO forage-cowpea value is 2.5/11 on shoot dry weight; not a direct cover-crop or grain-yield threshold. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Bio-fumigant Mustard Cover",
    "parameter": "Family",
    "value": "Brassicaceae",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bio-fumigant Mustard Cover",
    "parameter": "Season",
    "value": "cool_season",
    "status": "ESTIMATED — NO EXACT SOURCE ATTACHED",
    "url": null,
    "scope": null,
    "note": "This is preserved as the user-file value, not confirmed fact. No citation was attached to this crop×parameter value in the submitted specification. Disable as a hard constraint or numerical score until an exact applicable source or local calibration is added."
  },
  {
    "crop": "Bio-fumigant Mustard Cover",
    "parameter": "Salinity Limit",
    "value": "6.5 dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numerical Brassica juncea threshold/slope located in the cited FAO table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  },
  {
    "crop": "Bio-fumigant Mustard Cover",
    "parameter": "Yield Loss Slope",
    "value": "11.0%/dS/m",
    "status": "UNSUPPORTED",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
    "note": "No matching numerical Brassica juncea threshold/slope located in the cited FAO table. Source scope only; matching a pair does not make the value universal. Crop species, yield endpoint, growth stage, and conditions must match before the value is used. The numeric pair is compared jointly."
  }
];

export const EVIDENCE_INPUTS: EvidenceInputSection[] = [
  {
    "section": 1,
    "name": "Surface slope, elevation, TWI",
    "nasaSupport": "Partially supported by NASA DEM (e.g., SRTM) for elevation and derived slope/flow metrics.",
    "requiredEvidence": "Use named DEM, resolution, CRS, flow-routing/TWI method and terrain quality; local field observations may capture bunds/drains the DEM misses.",
    "doNotEncode": "Delete fixed baselines (elevation 18 m, slope 1.2%, TWI 10.4) as universal constants; no universal irrigation ban from slope alone.",
    "correctLabel": "NASA-derived terrain estimate + method metadata"
  },
  {
    "section": 2,
    "name": "Hand-ribbon texture and physical properties",
    "nasaSupport": "SoilGrids supplies mapped sand/silt/clay and related estimates at 250 m; not NASA. Ribbon test supports only a texture-class observation.",
    "requiredEvidence": "Laboratory particle-size analysis for exact fractions. If SoilGrids is used, label mapped estimate and show depth/uncertainty.",
    "doNotEncode": "Do not map each tactile class to exact sand/silt/clay %, bulk density, FC/PWP/AWC/Ksat/CEC or crop hard blocks.",
    "correctLabel": "Farmer observation / mapped estimate / lab measurement kept separate"
  },
  {
    "section": 3,
    "name": "Knife/spade compaction and bulk density",
    "nasaSupport": "SoilGrids predicts bulk density at 250 m as an external map; NASA satellite does not measure compaction in the field.",
    "requiredEvidence": "Use intact-core bulk density or repeatable penetrometer/profile assessment; distinguish surface tilth from subsoil hardpan.",
    "doNotEncode": "Remove fixed +0.12/+0.22 g/cm3 shifts, rooting-depth caps and +15 bio-tillage bonus unless field-calibrated.",
    "correctLabel": "Measured bulk density / qualitative compaction flag"
  },
  {
    "section": 4,
    "name": "Wilting speed, FC/PWP/AWC",
    "nasaSupport": "SoilGrids provides modeled water-content layers for named pressure conditions; NASA SMAP supports broad moisture context only.",
    "requiredEvidence": "Use lab pressure plate/membrane or a documented pedotransfer method, correct depth and coarse-fragment treatment; plant wilting days are confounded by crop/weather/root depth.",
    "doNotEncode": "Remove deterministic conversions of 2–18 wilting days into precise AWC or blending guesses with formulas without calibration.",
    "correctLabel": "Modelled mapped water property / lab result / local estimate"
  },
  {
    "section": 5,
    "name": "Surface ponding and infiltration/Ksat",
    "nasaSupport": "No direct NASA field-scale Ksat measurement; imagery/moisture only provides indirect context.",
    "requiredEvidence": "Use double-ring infiltrometer/permeameter or a validated local method; ponding observations are screening flags not a numeric Ksat.",
    "doNotEncode": "Remove fixed Ksat values assigned from soak-in hours and universal ECw/SAR penalty coefficients unless a source/validation supports them.",
    "correctLabel": "Field measurement or qualitative drainage-risk flag"
  },
  {
    "section": 6,
    "name": "Subsoil mottling and water table/drainage",
    "nasaSupport": "DEM and NASA moisture/rainfall data can give landscape/climate context; neither directly measures the field water table.",
    "requiredEvidence": "Use soil profile, seasonal water-table observations/piezometer and local drainage records; define the scale of the decision.",
    "doNotEncode": "Do not derive exact drainage class or water-table depth from surface satellite data alone.",
    "correctLabel": "Field profile / water-table observation + regional context"
  },
  {
    "section": 7,
    "name": "Effective rooting depth / hardpan",
    "nasaSupport": "No reliable direct satellite measurement of hardpan/rooting depth; DEM is not a substitute.",
    "requiredEvidence": "Use soil profile pit/auger/penetration plus crop-specific rooting references; record soil depth by layer and actual restriction.",
    "doNotEncode": "Remove universal rooting caps from qualitative observations unless measured and locally checked.",
    "correctLabel": "Field observation or profile measurement"
  },
  {
    "section": 8,
    "name": "Soil reaction pH via weeds/leaf symptoms",
    "nasaSupport": "SoilGrids gives mapped pH estimate; NASA multispectral data cannot uniquely diagnose soil pH from weeds/leaves.",
    "requiredEvidence": "Soil pH lab method, sample depth, date and method; mapping as provisional prior when no test exists.",
    "doNotEncode": "Do not translate a weed or leaf symptom directly into exact pH or hard pass/fail.",
    "correctLabel": "Lab-measured / mapped estimate / visual clue"
  },
  {
    "section": 9,
    "name": "Soil salinity ECe via crust/indicators",
    "nasaSupport": "NASA reflectance may flag surface patterns associated with salinity after local calibration, but not direct root-zone ECe.",
    "requiredEvidence": "Use soil saturated-paste extract ECe with root-zone depth and method; retain EC1:5/ECa separately rather than silently converting.",
    "doNotEncode": "Do not infer exact ECe from a visible crust or one vegetation signal; do not apply crop threshold from a different species.",
    "correctLabel": "Lab ECe or remote-sensing anomaly flag"
  },
  {
    "section": 10,
    "name": "Sodicity ESP/SAR via dispersion/feel",
    "nasaSupport": "Not directly measurable from NASA imagery.",
    "requiredEvidence": "Test exchangeable sodium and CEC for ESP, or water/soil solution ions for SAR; store units, extraction and sample date.",
    "doNotEncode": "Remove universal empirical Ksat adjustment formulas absent validation; ESP and SAR are distinct quantities.",
    "correctLabel": "Lab measured; uncertainty when missing"
  },
  {
    "section": 11,
    "name": "Free lime/CaCO3 vinegar test",
    "nasaSupport": "SoilGrids is not a direct universal CaCO3 lab substitute; GAEZ soil layers may support broad context only.",
    "requiredEvidence": "Use laboratory carbonate content or field test as qualitative screening, explicitly not exact percent.",
    "doNotEncode": "No exact CaCO3 percentage from fizz intensity without validated calibration.",
    "correctLabel": "Qualitative flag / laboratory measurement"
  },
  {
    "section": 12,
    "name": "Color => SOM/SOC/CEC",
    "nasaSupport": "SoilGrids maps SOC/CEC and related soil properties with uncertainty; it does not justify color-to-exact-number conversion.",
    "requiredEvidence": "Lab SOM/SOC and CEC methods; don't use fixed SOC-to-SOM factor without context.",
    "doNotEncode": "Delete soil-color formulas returning exact SOM, SOC, CEC or coupled values without regional calibration.",
    "correctLabel": "Lab or mapped estimate; separate properties"
  },
  {
    "section": 13,
    "name": "Previous crop/leaf vigor => available mineral N",
    "nasaSupport": "SoilGrids total N is not plant-available nitrate+ammonium. NDVI anomaly is nonspecific.",
    "requiredEvidence": "Use time-stamped nitrate/ammonium soil test and crop-stage/management context; previous-crop N credit from a regional recommendation.",
    "doNotEncode": "Do not convert crop appearance/preceding crop into exact NO3-N + NH4-N or universal signed kg N/ha effect.",
    "correctLabel": "Lab measurement / source-specific fertilizer credit"
  },
  {
    "section": 14,
    "name": "Fertilizer history/leaf purple color => Olsen-P",
    "nasaSupport": "No direct NASA measurement of Olsen P; vegetation indices are nonspecific.",
    "requiredEvidence": "Use a soil test with an appropriate extraction method. For critical values, require crop/soil/region calibration; Olsen commonly used in calcareous/alkaline soils.",
    "doNotEncode": "Do not treat purple leaves as exact ppm or carry one critical value across all crops/regions.",
    "correctLabel": "Lab test and region-calibrated interpretation"
  },
  {
    "section": 15,
    "name": "Leaf scorch/texture => exchangeable K",
    "nasaSupport": "No direct NASA measurement of exchangeable K; vegetation stress is not nutrient-specific.",
    "requiredEvidence": "Use NH4OAc-K lab method and regional/crop calibration; inspect other explanations for symptoms.",
    "doNotEncode": "Remove exact K ppm estimates and universal clay thresholds based on symptoms.",
    "correctLabel": "Lab test / missing if unavailable"
  },
  {
    "section": 17,
    "name": "Seasonal water supply/allocation",
    "nasaSupport": "NASA climate/rain/ET data can estimate demand and rainfall context, not actual water entitlement or delivered allocation.",
    "requiredEvidence": "Farmer/irrigation authority records, canal schedule, pumping limit and reliability; season and time horizon required.",
    "doNotEncode": "Do not claim rainfall = irrigation supply or that ET estimates prove water savings.",
    "correctLabel": "User/authority supplied + modeled demand"
  },
  {
    "section": 18,
    "name": "Irrigation water EC/SAR/nitrate",
    "nasaSupport": "Not directly measured by NASA Earth observation.",
    "requiredEvidence": "Water sample and lab analysis (ECw, ions/SAR, nitrate), sample date/source and seasonal variation.",
    "doNotEncode": "No crop suitability hard block based only on source label or unmeasured water quality.",
    "correctLabel": "Laboratory measurement / missing data warning"
  },
  {
    "section": 19,
    "name": "Irrigation delivery method/efficiency/wetted fraction",
    "nasaSupport": "NASA ET/land-surface data may contribute to area-scale context but does not directly measure applied irrigation efficiency for the field.",
    "requiredEvidence": "Capture irrigation system and scheduling; efficiency/amount requires local measurement or a sourced method; wetted fraction depends on geometry and crop stage.",
    "doNotEncode": "Do not presume system efficiency or convert method name directly into a precise water-savings score.",
    "correctLabel": "Farmer-supplied / locally measured / scenario estimate"
  },
  {
    "section": 20,
    "name": "30-crop threshold and carry-over table",
    "nasaSupport": "NASA observations inform environmental conditions and historical crop/vegetation context; they do not certify biological crop parameters.",
    "requiredEvidence": "Use FAO-56 for ETo/Kc methods, FAO salt table only for exact species/end point, FAO Crop Calendar where records exist, GAEZ v5 for broad suitability, peer-reviewed/local sources for every other number.",
    "doNotEncode": "All unsupported fixed values stay null/provisional; remove arbitrary +25 family bonus, generic N credits and undocumented 21-day sorghum rule.",
    "correctLabel": "Crop-parameter evidence registry with source per claim"
  }
];

export const EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    "id": "S01",
    "organization": "NASA Space Apps Challenge",
    "title": "Field Shift: Adapting Farms with NASA Data (2026)",
    "url": "https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/",
    "support": "Challenge brief",
    "use": "Sets the project target: decision support combining NASA Earth observations, local soil data, crop characteristics and farmer priorities for multi-season rotation exploration.",
    "limits": "A challenge brief is not scientific validation of Agrorotate or its input values."
  },
  {
    "id": "S02",
    "organization": "NASA POWER",
    "title": "Daily API documentation",
    "url": "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
    "support": "Daily point/regional time series",
    "use": "Weather and solar-radiation variables for crop-season context; CSV/JSON and other outputs; Agroclimatology community is available.",
    "limits": "Native spatial resolution depends on source parameter; check units, dates, missing values and time standard for each request."
  },
  {
    "id": "S03",
    "organization": "NASA POWER",
    "title": "Data-resolution FAQ",
    "url": "https://power.larc.nasa.gov/docs/faqs/data/",
    "support": "Spatial and temporal resolution notes",
    "use": "Explains that solar and meteorological parameter resolutions follow their source data and distinguishes input time increments.",
    "limits": "Do not quote one universal spatial resolution for every POWER variable."
  },
  {
    "id": "S04",
    "organization": "NASA POWER",
    "title": "Parameter tutorial and dictionary guidance",
    "url": "https://power.larc.nasa.gov/docs/tutorials/parameters/",
    "support": "Parameter names and communities",
    "use": "Use to confirm exact parameter aliases and their availability before requesting T2M, RH2M, WS2M, radiation or precipitation.",
    "limits": "Parameter availability may differ by community, temporal endpoint and release; test the actual response."
  },
  {
    "id": "S05",
    "organization": "NASA HLS",
    "title": "About Harmonized Landsat Sentinel-2 (HLS)",
    "url": "https://hls.gsfc.nasa.gov/about-hls/",
    "support": "30 m surface reflectance; near-frequent observations",
    "use": "Best candidate for repeated field-level surface reflectance/vegetation-index history when field boundaries and quality masks exist.",
    "limits": "Global repeat frequency is not a guarantee of a cloud-free image on each date; does not directly diagnose a particular stress cause."
  },
  {
    "id": "S06",
    "organization": "USGS / NASA-USGS Landsat",
    "title": "Landsat Collection 2 Surface Reflectance",
    "url": "https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-reflectance",
    "support": "30 m surface-reflectance products",
    "use": "Spectral time series, NDVI-type indices, change/anomaly comparisons; correct scaling and quality masks matter.",
    "limits": "Reflectance is not a laboratory measurement of pH, ECe, ESP, N/P/K, pathogen presence or irrigation applied."
  },
  {
    "id": "S07",
    "organization": "USGS",
    "title": "Landsat NDVI formula and product notes",
    "url": "https://www.usgs.gov/landsat-missions/landsat-normalized-difference-vegetation-index",
    "support": "Landsat 8/9 bands 5 (NIR) and 4 (red)",
    "use": "Compute NDVI from scaled/valid reflectance using (NIR - Red) / (NIR + Red); retain valid-data and scale conventions.",
    "limits": "NDVI indicates vegetation greenness/structure; it is not a unique diagnosis of disease, nutrient shortage or yield."
  },
  {
    "id": "S08",
    "organization": "NASA LP DAAC",
    "title": "MOD13Q1 MODIS/Terra Vegetation Indices",
    "url": "https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD13Q1/",
    "support": "250 m; 16-day vegetation-index composites",
    "use": "Regional phenology and multi-year vegetation anomaly comparisons; useful when fields are too small or HLS access is unavailable only as regional context.",
    "limits": "Coarse pixels may mix fields and land cover; NDVI/EVI do not identify crop type or stress cause by themselves."
  },
  {
    "id": "S09",
    "organization": "NASA / NSIDC DAAC",
    "title": "SMAP L4 Global 3-hourly 9-km surface/root-zone soil moisture (current product family)",
    "url": "https://search.earthdata.nasa.gov/search?q=SMAP",
    "support": "About 9 km; 3-hourly model-assisted product",
    "use": "Large-area surface/root-zone moisture context and anomaly series; record exact product short name and version.",
    "limits": "Not a farm-level probe and not soil available-water-capacity, irrigation quantity or lab salinity."
  },
  {
    "id": "S10",
    "organization": "NASA GPM",
    "title": "IMERG precipitation overview and data access",
    "url": "https://gpm.nasa.gov/data/imerg",
    "support": "About 0.1 degree (~10 km); half-hourly base data and aggregated products",
    "use": "Historical/event rainfall context and anomalies; prefer Final for retrospective analysis when the relevant finalized product is available.",
    "limits": "Satellite precipitation is estimated rainfall, not on-farm irrigation delivery. Record product run (Early/Late/Final), version, units and aggregation."
  },
  {
    "id": "S11",
    "organization": "NASA LP DAAC",
    "title": "MOD16A2GF V061: ET 8-day 500-m global product",
    "url": "https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD16A2GF/",
    "support": "500 m; 8-day",
    "use": "Optional historical ET context/cross-check with QC flags and scale factors.",
    "limits": "Not crop-specific irrigation demand nor direct irrigation application; mixed pixels and modeled ET matter."
  },
  {
    "id": "S12",
    "organization": "NASA",
    "title": "ECOSTRESS Gridded Evapotranspiration 70-m V002",
    "url": "https://data.nasa.gov/dataset/ecostress-gridded-evapotranspiration-instantaneous-and-daytime-l3-global-70-m-v002-b0768",
    "support": "70 m grid; global nominal product coverage between 52°N and 52°S; observations irregular",
    "use": "Optional ET/stress research layer where clear observations and correct product are available.",
    "limits": "Observation timing/coverage is irregular; instantaneous/daytime layers are not daily field water requirements; inspect uncertainty, masks and product definition."
  },
  {
    "id": "S13",
    "organization": "NASA Earthdata",
    "title": "SRTM quick guide",
    "url": "https://www.earthdata.nasa.gov/s3fs-public/2025-05/SRTM_Quick_Guide.pdf",
    "support": "Global DEM product choices include 1 arc-second (~30 m) and coarser products",
    "use": "Elevation and derived terrain slope/flow accumulation/TWI can be calculated from a named DEM with recorded method.",
    "limits": "Elevation/slope/TWI are derived terrain measures, not universal crop thresholds; DEM cell size may miss small field ditches/bunds."
  },
  {
    "id": "S14",
    "organization": "NASA Earthdata Search",
    "title": "Earth observation dataset discovery and access",
    "url": "https://search.earthdata.nasa.gov/",
    "support": "Dataset catalogue, versions, granules, temporal/spatial coverage",
    "use": "Discover the selected data collection, exact product/version, dates, bounds and formats; log what was actually downloaded.",
    "limits": "A catalogue entry or link alone does not prove that a product was retrieved or processed for a field."
  },
  {
    "id": "S15",
    "organization": "NASA Giovanni",
    "title": "Giovanni Earth science data visualization and analysis",
    "url": "https://giovanni.earthdata.nasa.gov/",
    "support": "Interactive time series/maps; access may require Earthdata login",
    "use": "Exploratory maps/series for precipitation, soil moisture and temperature; useful for screening and first analysis.",
    "limits": "Exploratory view is not a replacement for saved inputs, quality flags, reproducible processing and product citations."
  },
  {
    "id": "S16",
    "organization": "ISRIC",
    "title": "SoilGrids global gridded soil information",
    "url": "https://isric.org/explore/soilgrids",
    "support": "250 m; six standard depth intervals; prediction uncertainty",
    "use": "External (not NASA) mapped estimates of pH, soil organic carbon, bulk density, sand/silt/clay, CEC, total N and water-related properties.",
    "limits": "Model estimates are not field tests; not direct ECe, ESP, available Olsen P/K, pathogens, Ksat, water table or water quality. Official ISRIC page currently notes REST API is temporarily paused; use stable alternatives/bulk data and recheck status."
  },
  {
    "id": "S17",
    "organization": "ISRIC",
    "title": "SoilGrids FAQ / layers / depth intervals",
    "url": "https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html",
    "support": "Layer definitions and uncertainty; six standard depths",
    "use": "Use correct depth band, units/scale factor and prediction quantiles; distinguish mapped nitrogen from available nitrate/ammonium.",
    "limits": "Never use soil map estimates without the product version, depth interval, units and uncertainty."
  },
  {
    "id": "S18",
    "organization": "USDA NRCS",
    "title": "Field Book for Describing and Sampling Soils v4.0 (2024)",
    "url": "https://www.nrcs.usda.gov/sites/default/files/2025-04/Field-Book-for-Describing-and-Sampling-Soils-v4.pdf",
    "support": "Field observation and lab terminology/methods",
    "use": "Support field-description protocols and distinguish saturated-paste ECe from other EC extraction ratios; support soil profile/scouting workflow.",
    "limits": "US methods can inform measurement practice but local Egyptian agronomic interpretation may differ; not a source of universal crop limits."
  },
  {
    "id": "S19",
    "organization": "USDA NRCS",
    "title": "Soil Health Testing",
    "url": "https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/soil-health-testing",
    "support": "Laboratory/field testing overview",
    "use": "Supports using measured soil indicators and repeatable methods instead of interpreting visual proxies as lab measurements.",
    "limits": "A test result must be interpreted with method, soil type, sample depth, region and crop needs."
  },
  {
    "id": "S20",
    "organization": "USDA NRCS",
    "title": "Testing methods for phosphorus and organic matter",
    "url": "https://www.nrcs.usda.gov/conservation-basics/soil/testing-methods-for-phosphorus-and-organic-matter",
    "support": "Soil-test methods depend on soil properties/pH",
    "use": "Support method selection; Olsen P is relevant in alkaline/calcareous contexts, but the critical level needs local crop/region calibration.",
    "limits": "Do not use an arbitrary Olsen-P ppm threshold as universally transferable across soils and crops."
  },
  {
    "id": "S21",
    "organization": "FAO",
    "title": "Crop evapotranspiration - FAO Irrigation and Drainage Paper 56 (contents)",
    "url": "https://www.fao.org/4/X0490E/X0490E00.htm",
    "support": "Standard agronomic method",
    "use": "Primary method source for reference evapotranspiration (ETo), crop coefficients (Kc), growth-stage changes and water-demand calculations.",
    "limits": "Water need varies with crop stage/management; irrigation delivery/efficiency/effective rainfall are separate quantities."
  },
  {
    "id": "S22",
    "organization": "FAO",
    "title": "ETc introduction and Kc approach",
    "url": "https://www.fao.org/4/X0490E/x0490e0a.htm",
    "support": "Equation and method",
    "use": "Standard crop evapotranspiration equation: ETc = Kc × ETo; select single/dual coefficient method according to task/data.",
    "limits": "ETc is modelled crop evapotranspiration under specified conditions, not automatically irrigation withdrawal or promised savings."
  },
  {
    "id": "S23",
    "organization": "FAO",
    "title": "Crop salt-tolerance data (Maas-Hoffman framework)",
    "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    "support": "Crop-specific ECe threshold/slope for selected species/endpoints",
    "use": "Where crop species, endpoint and ECe definition exactly match, use the reported threshold and slope with the stated conditions.",
    "limits": "Values are guidelines with context/footnotes; do not substitute ECw, EC1:5, visible crust or another species/end-point. Some crops have only qualitative ratings/no numeric pair."
  },
  {
    "id": "S24",
    "organization": "FAO",
    "title": "Crop Calendar platform",
    "url": "https://cropcalendar.apps.fao.org/",
    "support": "Country and agroecological-zone planting/harvesting guidance, where records exist",
    "use": "Use to screen planting windows and feasible rotation season slots for the actual country/crop/zones with visible record provenance.",
    "limits": "Verify that Egypt and the exact crop/zone record is present; don't assume every crop/cultivar is covered."
  },
  {
    "id": "S25",
    "organization": "FAO / IIASA",
    "title": "Global Agro-Ecological Zoning v5 (current version)",
    "url": "https://www.fao.org/gaez/en",
    "support": "Suitability, attainable yield and climate/soil/terrain indicators; key outputs approximately 30 arc-seconds (~1 km)",
    "use": "Broad crop-suitability screening and context; GAEZ v5 launched April 2025 and includes updated baseline and datasets.",
    "limits": "Modeled global/regional suitability/attainable yield is not a farm-level yield guarantee or current-season prediction; retain scenarios and baseline."
  },
  {
    "id": "S26",
    "organization": "Nature Communications (2022)",
    "title": "Meta-analysis: legume-based rotations and subsequent main-crop yields",
    "url": "https://www.nature.com/articles/s41467-022-32464-0",
    "support": "11,768 yield observations from 462 field experiments (reported by paper)",
    "use": "Supports legume rotations as an evidence-backed candidate strategy in aggregate.",
    "limits": "Global pooled results are not a guaranteed Egypt-specific benefit or a fixed N credit for an individual crop/field."
  },
  {
    "id": "S27",
    "organization": "Nature Communications (2025)",
    "title": "Crop rotations synergize yield, nutrition, and revenue: a meta-analysis",
    "url": "https://www.nature.com/articles/s41467-025-64567-9",
    "support": "Peer-reviewed synthesis of field-trial observations",
    "use": "Supports treating rotation outcomes as multi-objective tradeoffs to investigate.",
    "limits": "Do not transfer pooled percentages as a guaranteed effect for a single farm or cultivar."
  },
  {
    "id": "S28",
    "organization": "University of Minnesota Extension",
    "title": "Rotation by plant family and soil health",
    "url": "https://extension.umn.edu/garden-and-home/gardening-in-minnesota/gardening-and-farming/yard-and-garden/gardening-in-minnesota/living-soil-healthy-garden",
    "support": "Crop families, broad rotation principles",
    "use": "Supports a family/host-aware rotation feature and explains why crops in a family may share pests/diseases and nutrient traits.",
    "limits": "Home-garden/extension guidance is a principle source, not an Egyptian crop-specific minimum return interval; the rule should be pathogen-specific when needed."
  },
  {
    "id": "S29",
    "organization": "Utah State University Extension",
    "title": "Sorghum-sudangrass production guide",
    "url": "https://extension.usu.edu/crops/research/sorghum-sudangrass-production-guide",
    "support": "Sorghum cover/forage and sorgoleone discussion",
    "use": "Supports that sorgoleone can suppress some weed species under described conditions.",
    "limits": "Does not establish a universal 21-day tillage gap for Agrorotate's specified onion/flax/sugar-beet sequence; crop-specific allelopathy claim needs its own evidence."
  },
  {
    "id": "S30",
    "organization": "USDA NRCS",
    "title": "Soil Survey Laboratory Methods / SAR / ESP terminology",
    "url": "https://www.nrcs.usda.gov/sites/default/files/2023-01/SSIR51.pdf",
    "support": "Soil lab definitions/methods",
    "use": "Use precise EC/ESP/SAR concepts and recognize that extract methods are not interchangeable.",
    "limits": "Method/unit conversion is method-dependent; do not infer ESP from SAR without appropriate data/model."
  }
];
