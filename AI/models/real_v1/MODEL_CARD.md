# AgroRotate real-v1 Surrogate Model Card

### Production Model Specification, Benchmarks, and Operational Guardrails.

| Metric or Specification | Value |
|---|---|
| Model Identifier | `agrorotate_surrogate_weights.json` (`agrorotate.surrogate_weights/real-v1`) |
| Production Status | Active and Deployed (`public/models` and `server/models`) |
| Neural Architecture | Feedforward MLP: 40 Inputs -> Linear(64) + ReLU -> Linear(32) + ReLU -> Linear(4) |
| Training Dataset | `AI/data/real/real_crop_yield_training.parquet` (MAPSPAM 2020 + SoilGrids + NASA POWER) |
| Observations / Sites / Crops | 3,404 Rows / 501 Global Sites / 22 Standardized Crops |
| Target Training Label | Yield Gap Percentage: 100 * (1 - MAPSPAM Yield / 95th Percentile Crop Yield) |
| Validation Protocol | 5-Fold Spatial Block Cross-Validation (Zero Geographic Leakage) |
| Empirical Confidence Bands | Split-Conformal 90% Half-Width: +/- 41.7 percentage points on held-out sites |

---

## Measured Performance on Held-Out Global Sites

Evaluated using strict out-of-fold cross-validation where validation sites never share coordinate blocks with training sites:

| Model Architecture | Out-of-Fold MAE | Out-of-Fold RMSE | R-squared | Spearman Rank Correlation |
|---|---|---|---|---|
| real-v1 (Production Model) | 20.57 pp | 25.55 pp | 0.063 | +0.278 (within-crop: +0.221) |
| Per-Crop Mean Baseline | 20.90 pp | 25.86 pp | 0.040 | +0.219 |
| Legacy Synthetic Model | 43.39 pp | 48.60 pp | -2.392 | -0.008 |

---

## External Validation on Real Egyptian Field Trials (ARC / ICARDA)

To verify that the model works on real commercial farms and not just on gridded maps, the model was tested out-of-sample against 589 empirical site-seasons from Egyptian agricultural research stations:

| Model Architecture | Trial MAE | Trial RMSE | Trial R-squared | Spearman Correlation (rho) |
|---|---|---|---|---|
| real-v1 (Production Model) | 26.02 pp | 30.41 pp | 0.173 | +0.753 (within-crop: +0.819) |
| Legacy Synthetic Model | 27.50 pp | 37.71 pp | -0.272 | +0.697 |
| Per-Crop Mean Baseline | 26.02 pp | 32.10 pp | 0.079 | +0.326 |

The production real-v1 model demonstrates an outstanding +0.753 rank correlation against real-world field trials, proving high fidelity in predicting relative crop performance.

---

## The Soil Salinity Guardrail Architecture

During model development, topsoil electrical conductivity (ECe) from 84,815 ISRIC WoSIS laboratory profiles was integrated and spatially joined to global sites.

Experimental A/B testing proved that using raw ECe directly inside neural weights inverted the salinity response on independent trials (predicting higher yields in saline desert soils because historical sampling occurred in prosperous regions with modern drainage).

AgroRotate prevents this through a dual-engine architecture:
1. The Neural Surrogate evaluates complex climate, soil texture, pH, and slope interactions to estimate yield gap potential.
2. The Analytical Physics Engine runs Maas-Hoffman threshold functions first, enforcing absolute biophysical floors on salt tolerance.

If a parcel's soil or irrigation salinity exceeds a crop's biophysical limit, the crop is eliminated or penalized by physics before the neural estimate is ever applied.

---

## Runtime Usage and Safety Rules

1. Relative Anchoring: The model outputs a global yield gap, which is anchored to each crop's best-quartile regional baseline to prevent penalizing local potential yields.
2. Unobserved Crop Protection: For crops with no historical training rows (such as specific regional cover crops), the model applies zero neural penalty and relies purely on verified biophysical physics. AgroRotate never hallucinates data for crops it has not seen.
3. Physical Priority: The effective yield reduction is always governed by `max(biophysical_floor, neural_estimate)`.
