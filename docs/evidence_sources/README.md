# AgroRotate Evidence Sources & NASA Research Package (v5.0)

This directory contains the foundational scientific research, empirical parameter claim ledgers, and NASA/FAO source registries that back the AgroRotate decision engine.

---

## 📁 Key Documents & Empirical Ledgers

1. **`Agrorotate_Comprehensive_NASA_Agronomy_Research_v5.pdf` / `.docx`**
   - The primary scientific whitepaper detailing NASA Earth Observation integrations (POWER, GIBS, SRTM), pedotransfer functions (Saxton-Rawls PTFs), hydraulic conductivity calculations, and multi-season crop rotation dynamics.

2. **`Agrorotate_30_Crop_Parameter_Claim_Ledger.csv`**
   - Granular claim-level evidence table covering 30 crops (FAO Ecocrop parameters, salinity thresholds $EC_e$, crop water coefficients $K_c$, rooting depths, and family rotation intervals).

3. **`Agrorotate_20_Input_Evidence_Matrix_v5.csv`**
   - Validation matrix mapping 20 environmental and agronomic inputs to their verified scientific instruments (Lab MEAS, Field EST, Satellite EO_PRIOR).

4. **`Agrorotate_30_Crop_Evidence_Status_v5.csv` & `Agrorotate_Verified_Source_Registry_v5.csv`**
   - Verification status and complete registry of peer-reviewed papers, DOIs, FAO manuals, and NASA datasets.

5. **`Agrorotate_NASA_API_Recipes_v5.txt`**
   - Direct NASA POWER and Earthdata query specifications and API recipe endpoints.

6. **`task 1/2/3 nasa challenge.docx`**
   - Challenge brief deliverables and fulfillment specifications.

---

> [!NOTE]
> Run `node scripts/generate-evidence.mjs` to regenerate the typed TypeScript evidence datasets (`src/data/evidence/crops.generated.ts` and `generated.ts`) directly from these CSV registries.
>
> The CSVs here are raw source exports. The generator maps their internal audit
> statuses to plain **estimated** wording before anything reaches the interface,
> so a value without an exact source is never presented as confirmed.
