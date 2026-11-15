# AgroRotate - Real Data AI Training and Deployment Guide

### Machine Learning Built on Real Earth Observations and Field Science, Not Synthetic Hallucinations.

Most agricultural AI models are academic toys trained on synthetic data that fail the minute they touch real field soil. AgroRotate takes the opposite approach: a high-performance neural surrogate trained strictly on real-world crop yield records, NASA satellite agroclimatology, and global digital soil maps. It delivers instant, calibrated yield gap predictions across multi-season crop rotations without requiring cloud GPUs or complex server infrastructure.

---

## One-Click Retraining and Deployment

Retraining and packaging the production neural model takes less than two minutes.

### Windows (Recommended)

Double-click the dedicated launcher in the root folder:

```text
TRAIN-AI.cmd
```

The script verifies your Python environment, audits dependencies (PyTorch, NumPy, SciPy, scikit-learn, pyarrow), harmonizes global datasets, runs spatial cross-validation, calibrates conformal confidence bands, and automatically updates the production weights in both the browser and server runtimes.

### Cross-Platform Command Line (Linux, macOS, WSL)

```bash
cd AI/pipeline

# Full pipeline: train, validate, calibrate, and deploy to production
python run_all.py --deploy

# Evaluation dry-run: verify metrics without overwriting production weights
python run_all.py
```

---

## Ground-Truth Dataset Foundations

AgroRotate rejects synthetic relics. The surrogate model is trained on 3,404 audited ground-truth crop-site observations spanning 501 global agricultural regions:

| Dataset                    | Role in Training Pipeline                                            | Scientific Coverage & Precision                                               |
| -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| MAPSPAM 2020 v2r2          | Real-world crop yield labels (metric tons per hectare)               | Global 5 arc-minute resolution covering 22 standardized crop classifications  |
| NASA POWER Agroclimatology | Daily and monthly insolation, thermal bands, relative humidity       | 0.5-degree grid computing FAO-56 Penman-Monteith reference evapotranspiration |
| ISRIC SoilGrids 250m v2.0  | Depth-weighted topsoil physical and chemical properties (0 to 30 cm) | Mapped clay, sand, silt, soil organic carbon, pH, CEC, and bulk density       |
| ISRIC WoSIS ELCOSP         | Real measured topsoil electrical conductivity (ECe)                  | 84,815 laboratory soil samples across 20,312 soil profiles                    |
| ARC / ICARDA Field Trials  | Out-of-sample empirical benchmark (589 site-seasons)                 | Independent Egyptian field trials verifying real-world generalizability       |

---

## The 40-Dimensional Biophysical Neural Contract

The surrogate network is a compact, ultra-fast feedforward Multi-Layer Perceptron (MLP: 40 input dimensions, 64 hidden units with ReLU, 32 hidden units with ReLU, and 4 output heads). It is specifically engineered to execute zero-dependency matrix math in raw JavaScript (Float32Array) inside browser Web Workers:

### Feature Breakdown:

- Features 0 through 12 (Soil Physical and Hydraulic Mechanics): Sand, silt, clay fractions, coarse fragments, bulk density, field capacity, permanent wilting point, available water capacity, saturated hydraulic conductivity, drainage index, rooting depth, and aeration stress.
- Features 13 through 21 (Soil Chemistry and Nutrient Balance): Soil pH, electrical conductivity (ECe), exchangeable sodium percentage (ESP), calcium carbonate (CaCO3), soil organic matter (SOM), cation exchange capacity (CEC), and primary nutrient stocks.
- Features 22 through 27 (Pathogen and Biological Pressure): Root-knot nematodes (Meloidogyne), Fusarium vascular wilt, white rot (Stromatinia), broomrape (Orobanche), cyst nematodes (Heterodera), and Rhizoctonia root rot.
- Features 28 through 31 (Hydrology and Topography): Water allocation quotas, irrigation water salinity (ECw), annual reference evapotranspiration (ETo), and terrain relief slope.
- Features 32 through 39 (Crop Physiology and Salt Thresholds): Crop-specific seasonal crop coefficients (Kc), Maas-Hoffman salinity thresholds (dS/m), yield loss slope per dS/m, biological nitrogen fixation capacity, rooting depth, baseline potential yield, and thermal suitability index.

---

## Spatial Cross-Validation and Independent Benchmarking

Traditional random train-test splits cheat by leaking spatial autocorrelation between neighboring coordinates. AgroRotate enforces strict 5-Fold Spatial Coordinate Block Cross-Validation, ensuring no training farm parcel shares geographic blocks with validation sites:

- Out-of-Fold Mean Absolute Error: 20.57 percentage points on yield gap prediction across all global validation sites.
- Independent ARC / ICARDA Benchmark: Strong positive rank correlation (rho = +0.753) when tested directly against empirical multi-season field trials in Egypt.

### Architectural Discovery on Soil Salinity

Our A/B evaluation established that feeding raw measured ECe directly into neural weights caused inverted salinity predictions due to geographical bias in historical sampling (well-drained temperate soils dominate profile registries). AgroRotate solves this cleanly: salinity limits are strictly enforced via analytical Maas-Hoffman physics guardrails, guaranteeing that crops never get recommended in toxic saline soils, while the neural surrogate focuses purely on complex yield gap dynamics.

---

## AI-First Engine with Dynamic Biophysical Reality Guardrails

In commercial runtime deployment, the neural surrogate model serves as the primary decision-making engine across the full catalog of crops. However, unconstrained deep learning models can produce non-physical extrapolations under extreme out-of-distribution conditions. AgroRotate enforces an automated 25 percentage point discrepancy guardrail:

1. AI as the Primary Driver: When neural yield gap predictions remain within biophysical plausibility (a divergence of 25 percentage points or less from physical baselines), the AI prediction directly drives crop scores, ranking alternatives, and rotation optimization.
2. Automated Physical Override: If the neural surrogate diverges significantly (greater than 25 percentage points) from established biophysical equations (such as Maas-Hoffman salt thresholds, FAO-56 thermal limits, or Saxton-Rawls hydraulic wilting points), grounded physical laws automatically override the neural estimate as a fail-safe safety guardrail.
3. Unobserved Crop Protection: For regional cover crops and specialty forages without real-world harvest rows, the physical floor answers directly, guaranteeing that the model never hallucinates performance for unobserved crops.

### Multi-Objective MCTS UCB1 Search Steering and Risk Guardrails

During multi-season rotation trajectory optimization, the Batched Tensor Monte Carlo Tree Search (MCTS) engine extracts the grower's explicit priority weights from `workspace.priorities.weights` across four discrete axes (scaled 0 to 5):
- Yield: Financial return and net margins ($/ha).
- Water: Seasonal irrigation water saving (mm) and drought resilience.
- Soil: Organic matter buildup, biological nitrogen fixation, and minimal bare soil exposure.
- Risk: Pathogen break sequences, salinity avoidance, and climatic resilience.

These values are normalized into a continuous dynamic weight vector `[w_yield, w_water, w_soil, w_risk]` in `[0.0, 1.0]`. The MCTS Upper Confidence Bound (UCB1) exploitation equation dynamically integrates these weights:
`Exploitation = sum(w_i * Score_i) / (visits + epsilon)`

When the grower sets the risk priority to 3.5 or higher, an automated risk guardrail activates on the Maximum Profit trajectory: candidate sequences containing severe salinization drift (ECe spikes) or monoculture vascular wilt vulnerabilities are pruned from consideration, ensuring that profit maximization never risks catastrophic crop failure.

---

## Split-Conformal Uncertainty Calibration

Growers and enterprise farm managers cannot afford uncalibrated black-box guesses. AgroRotate incorporates Split-Conformal Prediction calibrated against real paired WoSIS laboratory soil tests and SoilGrids predictions, delivering honest 90% empirical coverage bands:

- Soil pH Prediction Residuals: Empirical 90% half-width of plus-or-minus 0.81 pH units.
- Clay Percentage Residuals: Empirical 90% half-width of plus-or-minus 10.9% clay fraction.
- Dynamic Provenance Inflation:
  - Laboratory Measurements (MEAS): 1.0x baseline uncertainty band.
  - Farmer Field Observations (EST): 1.15x adjusted uncertainty band.
  - Satellite Remote Sensing Priors (EO_PRIOR): 1.65x conservative uncertainty band.

---

## Production Deployment Workflow

When training finishes, the deployment script distributes production-ready model weights and calibration tables directly to runtime consumers:

1. `public/models/`: Serves client-side inference directly inside the browser Web Worker without requiring server communication.
2. `server/models/`: Powers server-side batch optimization and API consumers.
3. `AI/models/real_v1/MODEL_CARD.md`: Records complete timestamped training metadata, hyperparameters, and data provenance manifests.
