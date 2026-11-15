# External Sources Documentation

AgroRotate cites 30 external evidence sources for its crop rules. All are academic,
governmental or institutional. The registry is machine-readable in
`server/ai/evidence.json` (120 claims) and `src/data/evidence/generated.ts`, and
the salinity check table is independently re-verified in
[`docs/VERIFICATION.md`](VERIFICATION.md).

The rotation **yield model** does not train on this registry. It is fitted on three
public datasets  -  MAPSPAM 2020 yields, SoilGrids 250 m topsoil and NASA POWER
climate, plus SRTM slope  -  and it predicts a relative yield gap only. Its inputs,
metrics and limits are listed in `AI/models/real_v1/MODEL_CARD.md`; the sources and
roles are shown in the app's Sources tab.

## Source Index (S01-S30, as registered in `server/ai/evidence.json`)

| #   | ID  | Source                                                                         | Type                        | Contribution                                                    | Limits                                              |
| --- | --- | ------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| 1   | S01 | Field Shift: Adapting Farms with NASA Data (2026)                              | Challenge brief             | Product framing and scope                                       | Brief, not a data source                            |
| 2   | S02 | NASA POWER  -  Daily API documentation                                           | Government API              | T2M/T2M_MAX/T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR | Gridded agroclimatology, not an on-farm station     |
| 3   | S03 | NASA POWER  -  Data-resolution FAQ                                               | Government FAQ              | Native resolution per parameter                                 | Grid value is regional context                      |
| 4   | S04 | NASA POWER  -  Parameter tutorial and dictionary                                 | Government tutorial         | Parameter names, units, AG community                            | Method documentation only                           |
| 5   | S05 | NASA  -  About Harmonized Landsat Sentinel-2 (HLS)                               | Government dataset          | 30 m reflectance / NDVI history                                 | Planned ingestion layer                             |
| 6   | S06 | USGS  -  Landsat Collection 2 Surface Reflectance                                | Government dataset          | Landsat reflectance history                                     | Planned ingestion layer                             |
| 7   | S07 | Landsat NDVI formula and product notes                                         | Government notes            | NDVI computation                                                | Planned ingestion layer                             |
| 8   | S08 | MOD13Q1 MODIS/Terra Vegetation Indices                                         | Government dataset          | 250 m / 16-day vegetation index                                 | Planned ingestion layer                             |
| 9   | S09 | NASA  -  SMAP L4 9 km surface/root-zone soil moisture                            | Government dataset          | Root-zone moisture context                                      | Planned ingestion layer                             |
| 10  | S10 | NASA  -  GPM IMERG precipitation overview                                        | Government dataset          | Satellite rainfall estimates                                    | Planned ingestion layer                             |
| 11  | S11 | MOD16A2GF V061  -  ET 8-day 500 m                                                | Government dataset          | Evapotranspiration layer                                        | Planned ingestion layer                             |
| 12  | S12 | NASA ECOSTRESS  -  Gridded ET 70 m V002                                          | Government dataset          | High-resolution ET layer                                        | Planned ingestion layer                             |
| 13  | S13 | NASA  -  SRTM quick guide                                                        | Government dataset          | Elevation terrain context                                       | Planned ingestion layer                             |
| 14  | S14 | NASA  -  Earth observation dataset discovery and access                          | Government portal           | Dataset discovery                                               | Portal, not a value source                          |
| 15  | S15 | NASA  -  Giovanni data visualization and analysis                                | Government portal           | Data access pattern                                             | Portal, not a value source                          |
| 16  | S16 | ISRIC  -  SoilGrids global gridded soil information                              | Institutional map           | 250 m mapped soil priors                                        | Mapped priors, not a lab report                     |
| 17  | S17 | ISRIC  -  SoilGrids FAQ / layers / depth intervals                               | Institutional FAQ           | Layer definitions and depths                                    | Mapped priors, not a lab report                     |
| 18  | S18 | USDA NRCS  -  Field Book for Describing and Sampling Soils v4.0 (2024)           | Government field guide      | Observation vocabulary (texture, colour, roots)                 | Classes, not measurements                           |
| 19  | S19 | USDA NRCS  -  Soil Health Testing                                                | Government guide            | Soil-health test separation                                     | Method guidance                                     |
| 20  | S20 | Testing methods for phosphorus and organic matter                              | Institutional methods       | Olsen-P / OM measurement methods                                | Method guidance                                     |
| 21  | S21 | FAO  -  Irrigation and Drainage Paper 56 (contents)                              | FAO reference               | ETc = Kc x ETo framework                                        | Method, not fixed per-crop mm                       |
| 22  | S22 | FAO-56  -  ETc introduction and Kc approach                                      | FAO chapter                 | Kc staging approach                                             | Stage coefficients calibrated locally               |
| 23  | S23 | FAO  -  Crop salt-tolerance data (Annex 1, Table A1.1, Maas-Hoffman)             | FAO table                   | Salinity threshold/slope per crop species and endpoint          | Exact species + endpoint + saturated-paste ECe only |
| 24  | S24 | FAO  -  Crop Calendar platform                                                   | FAO tool                    | Country/zone planting windows                                   | Egypt record being captured; confirm per field      |
| 25  | S25 | FAO/IIASA  -  Global Agro-Ecological Zoning v5                                   | FAO/IIASA model             | Broad suitability screening                                     | Modelled suitability, not per-crop parameters       |
| 26  | S26 | Meta-analysis: legume-based rotations and subsequent main-crop yields          | Peer-reviewed study         | Legume-rotation direction of effect                             | Pooled result; qualitative reason only              |
| 27  | S27 | Nature Communications  -  Crop rotations synergize yield, nutrition, and revenue | Peer-reviewed meta-analysis | Rotation benefit direction                                      | Pooled result; qualitative reason only              |
| 28  | S28 | University of Minnesota Extension  -  Rotation by plant family and soil health   | Extension guide             | Family/host principle                                           | No universal minimum return interval                |
| 29  | S29 | Utah State Extension  -  Sorghum-sudangrass production guide                     | Extension guide             | Sorgoleone weed suppression                                     | Condition-specific; tillage timing stays local      |
| 30  | S30 | USDA  -  Soil Survey Laboratory Methods / SAR / ESP terminology                  | Government methods          | ESP/SAR measurement definitions                                 | Method guidance                                     |

## How the engine uses the registry

- **Salinity checks (the hard crop number)** are derived from S23 (FAO Annex 1,
  Table A1.1) with the FAO-56 Table 23 cross-check where tabulated  -  26 claims
  across 13 crops are source-scoped to this table and independently re-verified
  (see [`docs/VERIFICATION.md`](VERIFICATION.md)).
- **Climate** is live from S02-S04 (NASA POWER daily AG), cached locally with
  the exact request for reproduction.
- **Family repeats** use the S28/S26/S27 principle: the planner flags the
  repetition; return intervals are calibrated per pathogen and host.
- **Water demand** follows the S21-S22 method: ETc = Kc x ETo with live ETo and
  stage-based Kc calibrated locally.
- **Soil observations vs lab values** follow S18-S20/S30: observations stay
  classes; laboratory numbers stay measurements.
- No single source names a "recommended crop"  -  the engine aggregates the
  source-scoped constraints above.

## Claim statuses

Every one of the 120 claims carries a status:

- `SUPPORTED FOR SOURCE SCOPE`  -  matched to the named source and used by the
  engine's quantitative checks.
- `UNDER REVIEW  -  ...` / `PENDING ...`  -  the value-specific citation is in
  attachment; the engine keeps these values qualitative (flags and ordering,
  never hard constraints or scores).
- `PARTIAL / ENDPOINT MISMATCH`, `CONDITIONAL MATCH`, `SPECIES MISMATCH`  - 
  audit results against the FAO tables, kept for traceability.

## Limits

- Soil lab values must come from saturated-paste reports and similar measured
  sources; observations are never silently converted into lab numbers.
- Water quality (ECw) must be from a measured sample.
- Climate is NASA POWER (S02-S04), cached locally with the exact request.
- This registry is **not** the training data of the rotation model. That model
  (`agrorotate.surrogate_weights/real-v1`) is fitted on MAPSPAM 2020 yields,
  SoilGrids 250 m topsoil, NASA POWER climate and SRTM slope; it predicts a
  relative yield gap and nothing else, and it is validated against the ARC/ICARDA
  trials. See `AI/models/real_v1/MODEL_CARD.md`.
- Salinity stays physics-only. A measured WoSIS ECe layer was joined and tested;
  it did not improve accuracy and inverted the salinity response, so ECe is not a
  model input. The AI choose ranking slot is a third, optional model that
  activates only when a ranker file trained from saved decisions exists.
- The 30 sources above are the complete evidence base for the current product
  scope.
