# AgroRotate AI Layer - Scientific Grounding, Earth Observations, and Zero-Hallucination Contracts

### High-Precision Decision Support Grounded in Real NASA Satellite Data and Biophysical Truth.

AgroRotate bridges the gap between raw remote sensing data and actionable farm decisions. Unlike generic machine learning models that guess crop performance from thin air or hallucinate agronomic thresholds, AgroRotate operates on a strict, auditable scientific contract: every recommendation is grounded in verifiable soil physics, live satellite feeds, and empirical harvest records.

The product delivers:
1. Exact field geometry and real-time NASA POWER climate intelligence.
2. An auditable, rule-based crop rotation engine backed by a 120-claim peer-reviewed evidence ledger.
3. A calibrated neural surrogate model (real-v1) trained on 3,404 real-world crop-site observations across 22 crops, governed by a rigid 40-dimensional biophysical contract.

The model is purposefully focused: it evaluates relative yield gap potential while deferring critical environmental stress limits (such as soil salinity and thermodynamic water availability) to exact analytical physics equations.

---

## 1. The decision we are actually supporting

A farmer is choosing **one crop for one season**, inside a multi-season rotation,
under four constraints:

| Constraint               | Where it comes from                        | Can it be a hard rule?                                 |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------ |
| Water supply and quality | farmer's quota, lab ECw, NASA climate      | Only the measured water chemistry and the stated quota |
| Soil and salinity        | observations + lab ECe/pH/texture          | Only measured values, with a matched crop threshold    |
| Rotation biology         | previous crop, family, diagnosed pathogens | Family repetition is a caution, not a yield prediction |
| Farmer priorities        | explicit weights and exclusions            | Exclusions are hard; weights are preferences           |

The AI neural surrogate model is the primary engine for predicting multi-season yield gap dynamics, evaluating candidate trade-offs, and optimizing rotation trajectories. It operates in synergy with a dynamic biophysical safety guardrail:

- Primary AI Foundation: Neural predictions directly govern crop rankings, yield estimates, and trajectory choices as long as they remain within biophysical plausibility bounds.
- Automated Discrepancy Override: If an AI prediction diverges significantly (greater than 25 percentage points) from established physical and biological laws (such as Maas-Hoffman salinity limits, FAO-56 thermal season envelopes, or Saxton-Rawls hydraulic wilting points), grounded physical equations automatically take over as an uncompromising safety guardrail.
- Transparent Provenance: Every recommendation explicitly identifies whether it was driven by the primary neural model or protected by the physical guardrail. No model output may silently replace a measured lab value or a user exclusion.
- Dynamic Multi-Objective Steering: Farmer priorities (0 to 5 for yield, water, soil, risk) are extracted from `workspace.priorities.weights` and normalized into a continuous dynamic weight vector `[w_yield, w_water, w_soil, w_risk]` in `[0.0, 1.0]`. The MCTS controller weights its UCB1 exploitation term `Exploitation = sum(w_i * Score_i) / (visits + epsilon)` and runs a fixed budget of 900 rollouts. That is a budgeted approximation, not an enumeration: the ordered 6-season space is a theoretical upper bound computed from the candidate pools, while only the unique rotations the budget reaches are scored. The output's `search` block reports the budget, the simulations executed, the unique rotations evaluated, the theoretical space (explicitly labelled theoretical) and the measured elapsed time; `paretoAssessment` states that the four pathways are the best alternatives found among those evaluated and whether they are mutually non-dominated within that set.
- Automated Risk Guardrail: When the risk priority is set to 3.5 or higher, the maximum profit trajectory automatically prunes rotations that trigger severe salinization hazards (ECe drift) or persistent soil-borne pathogen vulnerabilities.

---

## 2. Data sources

### 2.1 Already used in the product

| Source       | Product / endpoint                                                         | What we take                                                                    | Role                                                                  |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| NASA POWER      | `https://power.larc.nasa.gov/api/temporal/daily/point` with `community=AG` | `T2M`, `T2M_MAX`, `T2M_MIN`, `RH2M`, `WS2M`, `ALLSKY_SFC_SW_DWN`, `PRECTOTCORR` | Monthly/seasonal climate, heat days, dry days, frost days, FAO-56 ETo |
| NASA GIBS HLS   | WMTS `HLS_S30_Nadir_BRDF_Adjusted_Reflectance`, `HLS_L30_Nadir_BRDF_Adjusted_Reflectance` | rendered 30 m reflectance tiles (`GoogleMapsCompatible_Level12`) | Visual crop-condition context; numeric NDVI/EVI2 is token-gated |
| NASA GIBS SMAP  | WMTS `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture`, `SMAP_L4_Analyzed_Surface_Soil_Moisture` | rendered 9 km moisture tiles (`Level6`) | Visual moisture context; numeric values are token-gated |
| NASA GIBS GPM   | WMTS `IMERG_Precipitation_Rate` | rendered precipitation-rate tiles (`Level6`) | Visual rainfall context; numeric totals are token-gated |
| NASA GIBS MODIS | WMTS `MODIS_Terra_L3_NDVI_16Day` (MOD13Q1 context), `MODIS_Terra_NDVI_8Day` | rendered 250 m NDVI tiles (`Level9`) | Visual vegetation context; numeric index values are token-gated |
| NASA GIBS SRTM  | WMTS `SRTM_Color_Index` | rendered relief tiles (`Level12`) | Visual terrain context |
| SRTM terrain    | Open-Meteo elevation API (Copernicus DEM / SRTM-backed) | 5x5 sample grid across the parcel bbox | Live elevation and plane-fit slope. Slope is a model input; elevation is climate context. The API also returns flow/TWI screening metrics, which the plan does not use |
| ISRIC SoilGrids | REST `https://rest.isric.org/soilgrids/v2.0/properties/query` | clay, sand, silt, pH, SOC, CEC, bulk density, coarse fragments, water retention at 10/33/1500 kPa | Live 250 m mapped soil priors; depth-weighted 0-30 / 0-100 cm, with uncertainty. Never a lab test |
| Esri / CARTO    | World Imagery / dark basemap | satellite and reference tiles | Parcel drawing |
| Nominatim       | geocoding | place search | Finding the field |

GIBS layers are **pictures, not measurements** in this product. The UI says so. A
tile colour must never be converted into a soil-moisture value by code. The map
toolbar exposes one GIBS product at a time and labels the native zoom.

### 2.2 Required for the trained layer

| Source          | Product                                           | Resolution / cadence         | Feature it contributes                                        |
| --------------- | ------------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| NASA SMAP       | `SPL3SMP_E` L3 enhanced; `SPL4SMGP` L4 root-zone  | 9 km, daily / 3-hourly       | surface and root-zone soil moisture, anomalies, dry-down      |
| NASA GPM        | `GPM_3IMERGDF` daily; `GPM_3IMERGHH` half-hourly  | 0.1 deg, daily / 30 min         | rainfall totals, intensity, dry-spell length, heavy-rain days |
| NASA MODIS      | `MOD13Q1` NDVI/EVI; `MOD09Q1` surface reflectance | 250 m, 16-day / 8-day        | vegetation vigour, seasonal anomaly, phenology timing         |
| NASA ECOSTRESS  | `ECO3ETPTJPL` ET; `ECO4ESIALEXI` ESI              | 70 m, irregular ISS overpass | actual ET and evaporative stress where coverage exists        |
| NASA HLS        | `HLSL30` / `HLSS30`                               | 30 m, 2-3 days               | cloud-free crop condition and residue/cover                   |
| NASA SRTM       | `SRTMGL1`                                         | 30 m                         | elevation, slope, flow accumulation proxy                     |
| NASA GRACE-FO   | mascon solutions                                  | ~300 km, monthly             | regional groundwater trend, **not** a field measurement       |
| ISRIC SoilGrids | 250 m                                             | static                       | texture, SOC, pH, CEC, bulk density priors                    |
| Farmer records  | local                                             | per field/season             | **the only real outcome labels**                              |

Access notes:

- POWER, GIBS, the Open-Meteo terrain samples and the ISRIC SoilGrids REST API are
  public; no Earthdata login is required for the endpoints the app calls today.
- SMAP, GPM, MODIS, ECOSTRESS, HLS and SRTM **numeric granules** are distributed
  through NASA Earthdata (GES DISC / LP DAAC / NSIDC). The server needs an
  Earthdata token, username/password pair or `~/.netrc` entry; the browser must
  never hold that credential. `server/eo.mjs` reports only the configured boolean
  and source label.
- The unified `POST /api/v1/eo` response labels every product as `live`,
  `visual` or `token`. A token does not create a value by itself: a numeric
  value appears only after a real granule extraction returns one.
- The unified snapshot returns cached SoilGrids or `status: "pending"`; the
  separate `POST /api/v1/eo/soilgrids` route fills in the slow ISRIC query. A
  missing SoilGrids prediction stays `null` and is never rendered as zero.
- Use NASA CMR (`https://cmr.earthdata.nasa.gov/search`) to resolve granules, then
  download only the subset covering the field buffer. Do not bulk-download whole
  global scenes per request.
- Cache by `(product, field centroid, date window, version)`. A field's historical
  features do not change after the latency window of the product.

### 2.3 Open datasets for pre-training, not for local truth

These can teach a model general crop behaviour, but they are not evidence about a
specific field and must not be presented as such.

| Dataset         | Use                                                  | Limitation                          |
| --------------- | ---------------------------------------------------- | ----------------------------------- |
| CropHarvest     | crop/non-crop and crop-type labels from open sources | sparse in Egypt and the Middle East |
| ESA WorldCereal | global crop/non-crop and temporary-crop maps         | 10 m/20 m map, not field management |
| USDA CDL        | US crop-type labels                                  | US-only; domain shift               |
| FAOSTAT         | national production and area                         | country-level, cannot label a field |
| OpenET          | ET estimates for US fields                           | US-focused; compare, do not copy    |
| PEP725          | European phenology observations                      | Europe-only                         |

Every dataset needs a license check before it is committed or redistributed.
Keep the license and citation beside the cached file.

---

## 3. What a training row looks like

One row = **one field x one season x one decision point**, not one pixel.

```
field_id
season_id                 e.g. 2027-cool
decision_date_iso         the day the recommendation is made
geometry_hash             prevents silent boundary changes
area_ha
centroid_lat, centroid_lon
elevation_m, slope_pct
soil_texture_class, clay_pct, sand_pct, soc_gkg, ph_h2o, cec
ece_dsm, ecw_dsm, water_quota_mm
previous_crop_id, previous_family
target_crop_id
priority_water, priority_soil, priority_risk, priority_yield
excluded_crop_ids
```

Climate and remote-sensing features are computed **only from data available up to
`decision_date_iso`**:

```
season_rain_mm
season_eto_mm
season_water_gap_mm
gdd_base10
heat_days_35
frost_days
dry_spell_max_days
sm_surface_mean, sm_rootzone_mean, sm_p10, sm_p90
sm_anomaly_30d
ndvi_mean, ndvi_max, ndvi_anomaly
et_actual_mm, esi_mean
heavy_rain_days
```

Labels, when they exist:

```
yield_t_ha
yield_relative_to_field_baseline
irrigation_applied_mm
water_productivity_kg_m3
residue_cover_pct
soil_ec_end_of_season
soc_change
disease_incidence
```

`yield_t_ha` is optional. A row without a measured outcome is still useful for
constraint learning and evidence retrieval, but it cannot train a yield model.

### Leakage rules

- Never use end-of-season weather to predict a decision made at planting.
- Never use the target crop's own yield to build its features.
- Split by **field and year**, not by random rows. Otherwise the same field leaks
  into train and test.
- Keep a "new field / new region" test set; report it separately.
- Store the exact API request and product version for every feature so a result
  can be reproduced.

---

## 4. Database shape

Use SQLite/D1 for the first version. The same model works for Postgres later.

```sql
create table fields (
  id text primary key,
  user_id text not null,
  name text not null,
  boundary_geojson text not null,
  centroid_lat real not null,
  centroid_lon real not null,
  area_ha real not null,
  elevation_m real,
  created_at text not null,
  updated_at text not null
);

create table seasons (
  id text primary key,
  field_id text not null references fields(id),
  cycle integer not null,
  year integer not null,
  season text not null check (season in ('warm','cool')),
  previous_crop_id text,
  target_crop_id text,
  decision_date text not null,
  notes text
);

create table observations (
  id text primary key,
  field_id text not null references fields(id),
  season_id text references seasons(id),
  kind text not null,
  value_json text not null,
  method text,
  measured integer not null default 0,
  source text,
  observed_at text not null
);

create table nasa_features (
  field_id text not null,
  season_id text not null,
  product text not null,
  product_version text not null,
  window_start text not null,
  window_end text not null,
  feature_json text not null,
  request_url text not null,
  fetched_at text not null,
  primary key (field_id, season_id, product, product_version, window_start, window_end)
);

create table outcomes (
  id text primary key,
  season_id text not null references seasons(id),
  yield_t_ha real,
  irrigation_mm real,
  water_productivity real,
  ec_end real,
  notes text,
  recorded_at text not null
);

create table model_runs (
  id text primary key,
  model_name text not null,
  model_version text not null,
  trained_at text not null,
  train_window text not null,
  metrics_json text not null,
  feature_list_json text not null
);
```

The browser currently autosaves the whole workspace under
`agrorotate.v6.workspace`. That is the offline fallback, not the multi-user store.
When auth is added, the server copy becomes authoritative and `user_id` scopes
every query.

---

## 5. API contract for the front-end

### `POST /api/v1/context`

Already implemented. Returns the raw POWER payload plus the exact request and a
server-cache marker. The browser should keep calling this instead of POWER
directly when the local API is available.

### `POST /api/v1/features` (next)

Request:

```json
{
  "fieldId": "east-drain-parcel",
  "boundary": [
    [31.02, 30.58],
    [31.03, 30.58],
    [31.03, 30.59],
    [31.02, 30.59]
  ],
  "season": { "year": 2027, "name": "cool" },
  "decisionDate": "2026-10-01",
  "products": ["POWER", "SMAP", "GPM", "MODIS", "SRTM"]
}
```

Response:

```json
{
  "features": {
    "seasonRainMm": 41,
    "seasonEtoMm": 310,
    "waterGapMm": 269,
    "heatDays35": 0,
    "drySpellMaxDays": 12,
    "smRootzoneP10": 0.08,
    "ndviAnomaly": -0.06
  },
  "provenance": [
    {
      "feature": "seasonRainMm",
      "product": "GPM_3IMERGDF",
      "version": "07",
      "window": "2026-09-01/2026-11-30",
      "requestUrl": "https://..."
    }
  ],
  "missing": ["ECO3ETPTJPL: no overpass in this window"],
  "cached": true
}
```

Rules:

- `missing` is mandatory. An absent feature is never returned as `0`.
- Every numeric feature carries provenance.
- The endpoint is server-side only; it holds the Earthdata credential.
- Responses are `Cache-Control: private, no-store` when they include a user field.

### `POST /api/v1/assistant` (later)

Input: a `fieldId`, `seasonId`, candidate crop IDs and the current evidence set.
Output:

```json
{
  "answer": "Faba bean is not blocked by the checks you supplied. Water demand is computed as ETc = Kc x ETo with stage-based Kc calibrated locally.",
  "claims": [
    {
      "text": "ECe 5.4 is below the faba bean threshold",
      "evidenceId": "FAO-ANNEX1-FABA",
      "kind": "measured_rule"
    },
    { "text": "Water demand is unassessed", "evidenceId": null, "kind": "gap" }
  ],
  "blocked": false
}
```

The assistant may only cite entries from the project evidence ledger. If a claim
cannot be tied to a ledger entry, it is returned as a gap, not as prose.

---

## 6. Model plan

### Stage A  -  evidence retrieval and explanation (first, no training)

- Index the 120-row claim ledger, source metadata, crop entries and input rules.
- Retrieval by crop, family, salinity threshold, input gap and season.
- A small language model rewrites retrieved claims into a short explanation.
- Hard guard: no number is generated by the model; numbers are copied from the
  ledger or the measured input.
- Success metric: every sentence maps to an evidence ID or an explicit gap.

This is the highest-value AI step for the challenge because it makes the existing
audit trail usable in seconds.

**Implemented now:** `server/ai/` does evidence retrieval and deterministic JSON
advice without an LLM. The API exposes `/api/v1/ai/choose`. The exact first
training loop, row contract and commands live in [`ai/README.md`](../AI/README.md).
The first ranker is deliberately logistic, not gradient-boosted, because 30-100
rows cannot justify a high-capacity model.

### Stage B (implemented)  -  rotation yield-gap surrogate

The rotation engine now ships a trained model, but not the one this plan first
sketched. It is deliberately narrow:

- **Artefact:** `public/models/agrorotate_surrogate_weights.json`
  (`agrorotate.surrogate_weights/real-v1`), MLP 40 -> 64 -> 32 -> 4, ReLU.
- **Trained targets:** head 0 only (`yield_gap_pct`). Heads 1-3 are zeroed and the
  runtime ignores any head outside `trained_targets`.
- **Rows:** 3,404 site x crop rows over 501 sites and 22 crops.
- **Inputs that actually vary:** sand, silt, clay, bulk density, field capacity,
  wilting point, AWC, Ksat, drainage class, root depth, pH, SOM, CEC, annual ETo
  and slope, plus the eight crop traits. ETo is clamped to 1.0 in most rows, so its
  learned signal is weak.
- **Inputs the model never learned:** ECe, ESP, CaCO3, N, P, K, the six pathogen
  pressures, irrigation quota/ECw, coarse fragments, water table, aeration. They are
  not all decision inputs. What each one actually reaches is listed in the next
  subsection, measured rather than assumed.
- **Validation:** 5-fold spatial block CV (MAE 20.57 pp, within-crop rho 0.22) and an
  independent 504-row ARC/ICARDA exam (MAE 26.02, rho 0.75).
- **Salinity:** a real WoSIS ELCOSP ECe layer was ingested and tested. It did not
  improve accuracy and produced an inverted salinity response (ARC rho 0.75 -> -0.24),
  so ECe stays out of the model and salinity stays with Maas-Hoffman.
- **Crops without real rows:** no neural penalty at all; the physical floor decides.

Retrain with `TRAIN-AI.cmd` (see `AI/pipeline/README.md`). The model card and the
A/B results live in `AI/models/real_v1/`.

#### Measured input audit (what the plan really reads)

Two scripts keep the UI honest. `npm run audit:inputs` lists every field the forms
collect and the decision files that reference it. `npm run audit:decision` re-runs
`optimizeWorkspace` with one input changed at a time, under fixed random seeds, and
reports whether any of the four plans moved. Measured on the shipped model:

| Changes the four plans              | Does not change them                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- |
| ECe, pH, SOC, CEC, bulk density, texture, ETo, ECw, water regime, seasonal allocation, previous crop, exclusions | lab N, Olsen-P, exchangeable K, water N, SARw, delivery method, heat days, annual rain, slope class, elevation, priority weights |

So the audit justified the cut: N/P/K were stored with the lab result but read by
neither the model nor a rule; ESP reached the infiltration estimate and CaCO3 the
lab cross-checks; pathogen flags raised an advisory only; SARw, delivery method and
water source were context; the seasonal allocation changes the water-availability
feature and the water-savings trade-off, so it is kept; priority weights order the
alternatives offered on the board and never rewrite the four plans. If a future
build wires one of these in, both audit scripts and this table must be updated in
the same change.

After this audit, the forms were cut to the decision-relevant subset. The Soil page
now asks for the model dimensions it actually uses (texture, bulk density, pH,
organic carbon, CEC) plus measured ECe for the salinity rule. ESP, CaCO3, nitrate-N,
Olsen-P, exchangeable K and SARw were removed from the forms; the ponding, rooting,
fizz and dispersion observations were also removed because they reached no learned
or decision dimension. `workspaceToAgronomicVector` no longer reads those saved lab
values, so a workspace from an older build cannot keep feeding them in silently.
The observation-to-number substitutions that remain are defined once in
`src/data/observationProxy.ts` and use the same exported maps as the engine.

### Stage B (not shipped)  -  constrained candidate ranker (tabular, trainable)

- Model: gradient-boosted trees (LightGBM/XGBoost) or a small monotonic model.
- Target: a **documented preference**, not "best crop". Options:
  - probability that a candidate clears all known constraints;
  - farmer's stated choice among the candidates actually offered;
  - measured water productivity, where records exist.
- Features: the table in section 3.
- Hard constraints are applied **before** ranking; the model cannot rank an
  excluded crop back in.
- Report calibration and the "new field" split. Do not report a single accuracy
  number without the baseline.

### Stage C  -  season outcome models (only with local labels)

- Yield and water productivity need at least two seasons of measured outcomes per
  field, and enough fields to separate field effects from season effects.
- Start with a baseline: field mean, crop mean, then weather features.
- A model that cannot beat the field-mean baseline is not shipped.
- Always output an interval and the features that drove it; never a single
  "guaranteed" number.

### Not planned

- A crop score out of 100.
- A water-savings percentage without metered before/after data.
- A yield prediction from a satellite image alone.
- An LLM that invents an FAO threshold.

---

## 7. Product scope vs. later work

| Now (front-end + basic API)                                  | After the freeze                             |
| ------------------------------------------------------------ | -------------------------------------------- |
| Leaflet field drawing, Esri imagery, GIBS NDVI/SMAP overlays | SMAP/GPM/MODIS feature extraction            |
| NASA POWER climate context and FAO-56 ETo                    | ECOSTRESS/HLS/GRACE ingestion                |
| Local autosave + optional plan sync                          | Accounts, server-scoped fields               |
| Rule-based board, 3-rotation compare, plan summary           | Calibrated season-outcome models             |
| Five-step preview, evidence drawer, method page               | Evidence-grounded assistant                  |
| Yield-gap surrogate (22 crops, gap only) + model card        | Drift checks, repeated field validation      |

The UI must keep saying which side of that line a number is on. A future model
does not get to erase the "unassessed" badge; it has to earn the right to replace
it with a measured or modelled value and show its source.

---

## 8. Sources to cite in the app

- NASA POWER: <https://power.larc.nasa.gov/>
- NASA GIBS: <https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs>
- SMAP: <https://smap.jpl.nasa.gov/>
- GPM IMERG: <https://gpm.nasa.gov/data/imerg>
- MODIS vegetation indices: <https://modis.gsfc.nasa.gov/data/dataprod/mod13.php>
- ECOSTRESS: <https://ecostress.jpl.nasa.gov/>
- HLS: <https://hls.gsfc.nasa.gov/>
- SRTM: <https://www.earthdata.nasa.gov/data/instruments/srtm>
- GRACE-FO: <https://gracefo.jpl.nasa.gov/>
- SoilGrids: <https://soilgrids.org/>
- CropHarvest: <https://github.com/nasaharvest/cropharvest>
- ESA WorldCereal: <https://worldcereal.org/>
- USDA CDL: <https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php>
