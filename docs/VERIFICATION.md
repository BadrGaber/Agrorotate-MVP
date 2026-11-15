# Source verification pass  -  10 November 2026

This note records an independent re-check of the crop values that the v5 package
marks `SUPPORTED FOR SOURCE SCOPE`. It is deliberately narrow: the goal was to
confirm or reject the 26 supported claims against the live sources, not to
promote every number in the project file.

## Sources reopened

| ID      | Source                                                | Page checked                                                  |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| S23     | FAO, _Crop salt tolerance data_ (Annex 1, Table A1.1) | https://www.fao.org/4/Y4263E/y4263e0e.htm                     |
| S21-S22 | FAO-56, Chapter 8, Table 23                           | https://www.fao.org/4/X0490E/x0490e0e.htm                     |
| S02-S04 | NASA POWER daily API documentation                    | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ |
| S24     | FAO Crop Calendar                                     | https://cropcalendar.apps.fao.org/                            |
| S16-S17 | ISRIC SoilGrids                                       | https://isric.org/explore/soilgrids                           |
| S26-S29 | Rotation meta-analyses, extension guides              | see `Agrorotate_Verified_Source_Registry_v5.csv`              |

## Result for the 26 supported claims

All 26 values (13 crops x threshold + slope) match Table A1.1 **exactly**. Twelve
of the 13 pairs also appear unchanged in FAO-56 Table 23; sunflower is listed as
"-" there, so Annex 1 is its only numeric source.

| Crop (file name)         | File pair  | Annex 1 A1.1 | FAO-56 T23 | Table endpoint       | Verdict                |
| ------------------------ | ---------- | ------------ | ---------- | -------------------- | ---------------------- |
| Bread Wheat              | 6.0 / 7.1  | 6.0 / 7.1    | yes        | Grain yield          | Match                  |
| Six-Row Barley           | 8.0 / 5.0  | 8.0 / 5.0    | yes        | Grain yield          | Match                  |
| Grain Maize              | 1.7 / 12.0 | 1.7 / 12     | yes        | **Ear fresh weight** | Match, endpoint caveat |
| Grain Sorghum            | 6.8 / 16.0 | 6.8 / 16     | yes        | Grain yield          | Match                  |
| Soybean                  | 5.0 / 20.0 | 5.0 / 20     | yes        | Seed yield           | Match                  |
| Berseem Clover Multi-Cut | 1.5 / 5.7  | 1.5 / 5.7    | yes        | Shoot dry weight     | Match                  |
| Alfalfa / Lucerne        | 2.0 / 7.3  | 2.0 / 7.3    | yes        | Shoot dry weight     | Match                  |
| Sunflower                | 4.8 / 5.0  | 4.8 / 5.0    | no ("-")   | Seed yield           | Match, single source   |
| Peanut / Groundnut       | 3.2 / 29.0 | 3.2 / 29     | yes        | Seed yield           | Match                  |
| Potato                   | 1.7 / 12.0 | 1.7 / 12     | yes        | Tuber yield          | Match                  |
| Flax / Linseed           | 1.7 / 12.0 | 1.7 / 12     | yes        | Seed yield           | Match                  |
| Sugar Beet               | 7.0 / 5.9  | 7.0 / 5.9    | yes        | Storage root         | Match                  |
| Bulb Onion               | 1.2 / 16.0 | 1.2 / 16     | yes        | Bulb yield           | Match                  |

### Endpoint findings

- **Maize** is tabulated as _ear fresh weight_, not grain yield. FAO-56 Table 23
  repeats `1.7 / 12` without naming an endpoint. The app now prints this caveat
  whenever a maize salinity penalty is calculated.
- Alfalfa, berseem and the other forages are _shoot dry weight_; sugar beet is
  _storage root_; potato is _tuber yield_; onion is _bulb yield_. These are
  correct for the harvested product of those crops, but they are not grain.
- The salinity curve assumes a saturated-paste `ECe`. It does not accept
  `EC1:5`, `ECw`, or a visible salt crust.

## How the other 538 claims are handled

The other 538 rows carry their exact source requirement in the ledger, and the
engine keeps them qualitative until their citation and local calibration attach:

- S21-S22 provide the _method_ `ETc = Kc x ETo`. The plan computes ETc from live
  ETo with stage-based Kc instead of a fixed per-crop millimetre figure.
- S26-S27 are pooled rotation meta-analyses; they give the qualitative
  legume-rotation reason, while farm-specific values come from recorded outcomes.
- S16-S17 are 250 m mapped soil estimates that give regional context; the
  parcel-level values come from the field's own lab report.
- S18-S20 and S30 describe _how to measure_ ECe, ESP, SAR and Olsen-P  -  the
  measurement standards the app separates from observations.
- S24 is an interactive country/zone calendar; the Egypt record is being
  captured and planting windows are confirmed per field.
- S28 supports the family-repeat _principle_; return intervals are calibrated
  per pathogen and host.
- S29 supports sorgoleone weed suppression under described conditions; tillage
  timing stays a local recommendation.

Consequently `additionalVerifiedClaims = 0`. Staying at 26 is the audit result,
not an omission.

## What changed in the app because of this pass

- Each FAO proof now shows the **tabulated endpoint**, the **cross-check** with
  FAO-56 Table 23, and the **re-check date**.
- The engine appends the maize endpoint caveat to any maize salinity finding.
- The Method and Evidence pages state the verification result and the
  source-attachment status of every remaining claim.
- `src/data/evidence/verification.ts` holds the machine-readable check table.

## Reproducing

1. Open the two FAO URLs above.
2. Search the page for the crop's common name.
3. Compare threshold and slope, then read the "Tolerance based on" column.
4. Confirm the ECe definition (saturated paste) and the units (dS/m, % per dS/m).

No value was taken from a secondary summary or copied from memory; every
number in the table above was read from the FAO pages on 10 November 2026.
