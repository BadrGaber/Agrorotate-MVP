# AgroRotate Production AI Training Pipeline (`AI/pipeline`)

### End-to-End Automated Pipeline for Ground-Truth Dataset Assembly, Neural Training, Conformal Calibration, and Zero-Downtime Deployment.

The `AI/pipeline` directory contains the production-grade scripts that engineer raw satellite data and field observations into the calibrated neural surrogate powering AgroRotate. It is completely automated, reproducible, and verifiable against authentic agricultural benchmarks.

---

## The Production Pipeline at a Glance

When you run the pipeline, it executes five fully automated stages in sequence:

1. Real Dataset Assembly: Aggregates MAPSPAM global crop yields, SoilGrids 250m soil physical profiles, and NASA POWER multi-year weather histories into 3,404 ground-truth training records.
2. Neural Surrogate Training: Fits an optimized multi-layer perceptron (40 inputs, 64 hidden, 32 hidden, 4 heads) using 5-fold spatial coordinate block cross-validation to guarantee zero spatial leakage.
3. Independent Trial Benchmarking: Validates generalizability against 589 empirical site-seasons from Egyptian ARC and ICARDA agricultural research trials.
4. Conformal Calibration: Extracts empirical 90% prediction intervals from paired laboratory soil tests to provide honest uncertainty bounds.
5. Zero-Downtime Deployment: Automatically distributes tested, verified weights directly to the browser client and server runtimes.

---

## One-Click Execution and Automation

### Windows Desktop (Fastest)
Run the root launcher:
```text
TRAIN-AI.cmd
```

### Manual Command Line (Developer Mode)
```bash
cd AI/pipeline

# Execute full pipeline and install new weights into production:
python run_all.py --deploy

# Execute pipeline in dry-run mode (train and evaluate without overwriting production models):
python run_all.py
```

---

## Solving the Soil Salinity Dilemma (A/B Discovery)

During development, we ingested 84,815 laboratory soil samples from ISRIC WoSIS to test direct neural learning of electrical conductivity (ECe). 

Our A/B testing revealed a critical insight: because international soil profile sampling is clustered in technologically advanced temperate zones, feeding raw ECe directly into neural weights caused the network to learn geographic wealth rather than biophysical osmotic stress. When tested against real desert farm trials, direct neural salinity prediction collapsed with an inverted correlation.

AgroRotate solved this decisively:
- Yield Gap Dynamics are managed by the neural surrogate model.
- Salinity Limits are enforced by exact, analytical Maas-Hoffman biophysical physics equations.

This hybrid architecture guarantees that salt-sensitive crops are permanently locked out of high-salinity parcels, preventing catastrophic crop failures.

---

## Core Pipeline Modules

| Script | Purpose and Functionality |
|---|---|
| `contract.py` | Defines the rigid 40-dimensional vector contract and agronomic crop specifications. |
| `fetch_wosis_ece.py` | Extracts topsoil laboratory electrical conductivity measurements via OGC WFS endpoints. |
| `attach_site_ece.py` | Implements spatial BallTree indexing to associate nearest soil laboratory profiles with global sites. |
| `build_real_dataset.py` | Harmonizes MAPSPAM, SoilGrids, and NASA POWER into standardized ground-truth records. |
| `train_real_surrogate.py` | PyTorch training engine running 5-fold spatial block cross-validation and empirical benchmarking. |
| `build_conformal_calibration.py` | Calculates empirical 90% confidence bands from real soil measurement residuals. |
| `deploy_model.py` | Validates, archives, and deploys production artifacts directly to client and server directories. |
| `run_all.py` | Master orchestrator executing the full workflow with detailed timing and error reporting. |

---

## Generated Production Artifacts

```text
AI/data/real/real_crop_yield_training.parquet
AI/data/real/real_dataset_report.json
AI/models/real_v1/real_surrogate_weights.json
AI/models/real_v1/real_surrogate_metrics.json
AI/models/real_v1/conformal_calibration.json
AI/models/real_v1/MODEL_CARD.md
AI/models/real_v1/deploy_manifest.json
public/models/agrorotate_surrogate_weights.json
server/models/agrorotate_surrogate_weights.json
```
