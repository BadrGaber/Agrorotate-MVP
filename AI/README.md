# AgroRotate Machine Learning and Physics Simulation Pipeline

### Scientific Machine Learning, Soil Physics, and Real-World Evidence Engineering.

This module houses the complete artificial intelligence, remote sensing, and biophysical simulation stack that powers the AgroRotate Decision Support System (DSS). Designed for precision agriculture and real-world farm resilience, this pipeline translates raw satellite rasters and soil physics into lightweight, lightning-fast neural models that run on any browser or local server.

---

## What Makes This Pipeline Unique

1. Real-World Field Grounding: Built entirely on real crop harvest yields (MAPSPAM 2020), NASA POWER agroclimatology, and ISRIC SoilGrids global profiles. We never train on synthetic hallucinations.
2. Saxton-Rawls Soil Hydraulics: Deeply integrates continuous pedotransfer physics directly into dataset assembly, deriving real moisture retention and conductivity parameters from soil texture.
3. Automated Calibration and Quality Control: Employs 5-fold spatial block cross-validation to prevent spatial coordinate leakage and split-conformal prediction for guaranteed 90% confidence bands.
4. Instant Browser Deployment: Compiles neural networks into pure JSON weight matrices and Web Worker routines, executing in sub-millisecond speeds without external API dependencies.

---

## Directory Architecture

| Directory or File | Core Functionality |
|---|---|
| `data/` | Standardized dataset repository containing raw rasters, processed features, and empirical benchmarks. |
| `data/raw/` | Immutable source datasets including MAPSPAM harvest yields, FAO agricultural statistics, and ISRIC WoSIS profiles. |
| `data/processed/` | Standardized multi-feature tables combining 550 global agro-climatic sites with NASA POWER weather records. |
| `data/real/` | Ground-truth training tables (`real_crop_yield_training.parquet`) and paired soil test registries. |
| `data/benchmarks/` | Independent field trial registries (`empirical_field_trials_589.parquet`) from ARC and ICARDA research stations. |
| `data/metadata/` | Complete data dictionary, provenance ledgers, and source tracking manifests. |
| `pipeline/` | End-to-end automated scripts for data extraction, training, validation, conformal calibration, and deployment. |
| `models/real_v1/` | Active production neural network weights, metrics logs, and official MODEL_CARD documentation. |
| `physics_simulator.py` | Analytical Saxton-Rawls pedotransfer mechanics and soil hydraulic modeling engine. |

---

## Retraining and Deployment Workflow

The entire retraining and distribution pipeline is fully automated and reproducible:

```bash
# Windows one-click deployment
TRAIN-AI.cmd

# Cross-platform CLI execution
cd pipeline
python run_all.py --deploy
```

All trained artifacts undergo automated spatial validation and out-of-sample benchmarking against authentic field trials before being packaged for production.
