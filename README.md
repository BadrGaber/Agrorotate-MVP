# AgroRotate

### Turn NASA Earth Data and Soil Physics into Profitable, Resilient Crop Rotations.

AgroRotate Decision Support System (DSS) gives agricultural advisors, farm managers, and growers the predictive power to plan multi-year crop rotations with absolute confidence. Instead of gambling on last season's crop prices or guessing soil health trends, AgroRotate combines satellite observations, peer-reviewed pedotransfer hydraulics, and multi-objective optimization to build field-specific rotation strategies that protect yields, conserve water, and restore the soil.

---

## The Problem: Why Single-Season Decisions Cost Fortunes

Most crop plans are built one season at a time, driven almost entirely by short-term market prices. The hidden costs compound silently beneath the surface:

- **Catastrophic Salt Lock:** Using saline irrigation water on sensitive crops without calculating leaching fractions turns productive acres into barren ground within a few cycles.
- **Water Overuse:** Irrigating without modeling root-zone water capacity and real-time reference evapotranspiration wastes expensive diesel, electricity, and dwindling water allocations.
- **Pathogen and Nematode Buildup:** Planting crops from the same botanical families back-to-back breeds persistent soil-borne diseases, forcing growers to spend thousands on chemical treatments that only mask the damage.
- **Soil Organic Carbon Depletion:** Intensive cropping without legume or cover-crop breaks burns through soil organic matter, degrading soil structure and driving up synthetic fertilizer bills year after year.

AgroRotate stops this cycle before the seed is ever bought.

---

## What AgroRotate Delivers

### 1. Instant Satellite Intelligence at Parcel Scale

Draw your field boundary on the interactive map, and AgroRotate immediately queries and integrates global geospatial layers:

- **NASA POWER Agroclimatology:** Delivers location-specific daily and monthly solar radiation, temperature bands, relative humidity, and precipitation history.
- **Digital Elevation & Hydrology:** Ingests SRTM elevation grids to compute field slope, surface relief, and hydrological runoff routing in real time.
- **SoilGrids Physical & Chemical Profiling:** Pulls baseline sand, silt, clay, organic carbon, pH, and bulk density profiles directly to your field parcel.

### 2. AI-First Intelligence with Biophysical Reality Guardrails

AgroRotate is built AI-first. A pre-trained neural surrogate network evaluates multi-dimensional relationships across NASA climate layers, digital soil properties, and crop physiology to drive yields, rankings, and rotation sequences. To ensure commercial reliability, the AI operates under an automated biophysical guardrail:
- **AI as the Primary Driver:** Under all realistic operating conditions, the neural network acts as the primary decision engine, estimating yield gaps and optimizing crop choices.
- **Automated Discrepancy Override:** If an AI prediction diverges significantly (greater than 25 percentage points) from established physical laws (such as Maas-Hoffman salinity toxicity, FAO-56 thermal thresholds, or hydraulic wilting limits), the system automatically defaults to grounded biophysical calculations. You get the predictive power of advanced machine learning backed by the fail-safe certainty of physical science.
- **Peer-Reviewed Soil Hydraulics:** Derives continuous saturated hydraulic conductivity, field capacity, permanent wilting point, and available water capacity directly using Saxton & Rawls (2006) equations.

### 3. Four Pareto-Optimal Strategies for Every Field

Farm management is never one-size-fits-all. AgroRotate evaluates millions of seasonal combinations using a high-performance Batched Monte Carlo Tree Search (MCTS) engine running in background browser workers, presenting four balanced pathways:

- **Maximum Profit:** Targets the highest net economic return while screening for transport risk and seasonal market windows.
- **Water Conservation:** Minimizes total seasonal water consumption and prioritizes drought-resilient crops without sacrificing baseline margins.
- **Soil Regeneration:** Restores exhausted parcels by scheduling strategic nitrogen-fixing legumes and organic matter building sequences.
- **Regional Baseline:** Visualizes standard historical rotations for the region so you can benchmark projected improvements against status-quo farming.

#### Dynamic Priority Steering and the Risk Guardrail

Growers configure four dedicated priority wheels (scaled 0 to 5) in their workspace:
1. **Yield:** Maximizing commercial cash returns and net margins ($/ha).
2. **Water:** Water conservation and drought resilience (saving mm of seasonal allocation).
3. **Soil:** Soil organic matter (SOM) building, biological nitrogen fixation, and cover cropping.
4. **Risk:** Avoiding salinization hazards, breaking persistent pest/nematode cycles, and climatic resilience.

These values dynamically compile into a normalized multi-objective weight vector:
w_yield, w_water, w_soil, w_risk in [0.0, 1.0]

The Tensor MCTS tree search directly integrates these weights into its Upper Confidence Bound (UCB1) exploitation equation:
Exploitation = sum(w_i * Score_i) / (visits + epsilon)

- **Targeted Exploration:** Raising the Risk slider to 5 immediately steers the tree search toward biofumigant mustards, parasitic weed trap crops (such as Orobanche suicidal germination stimulants), and proven salt-tolerant cultivars. Raising the Water slider shifts exploration toward coarse grains and water-efficient pulses.
- **Automated Profit Risk Guardrail:** If the grower selects an elevated risk aversion setting (risk >= 3.5), the Maximum Profit algorithm automatically enforces a strict vulnerability filter. Rotations containing severe salinization hazards or monoculture vascular wilt risks are pruned from consideration, guaranteeing that high commercial paper margins never compromise the long-term biological viability of the farm.

### 4. Biological Pest and Disease Defense

AgroRotate enforces strict botanical family intervals (Poaceae, Fabaceae, Solanaceae, Brassicaceae, Cucurbitaceae). By calculating mandatory break intervals, it systematically starves host-specific nematodes, root rots, and wilt pathogens, cutting chemical input costs and preserving biological soil health.

### 5. Triple-Tier Data Integrity Guardrails

Real-world farm data is messy. AgroRotate safeguards every decision with a three-layer validation system:

- **Biophysical Validation:** Instantly rejects physically impossible inputs (such as negative bulk density or pH values outside realistic ranges).
- **Thermodynamic Consistency:** Flags input contradictions, such as soil textural fractions that do not sum to 100% or wilting points exceeding field capacity.
- **Source Confidence Weighting:** Explicitly tracks data provenance across verified laboratory measurements, farmer estimates, and satellite priors, dynamically widening uncertainty buffers when data is estimated.

### 6. True Offline-First Architecture

Remote fields rarely have reliable 5G connections. AgroRotate is engineered from the ground up as a Progressive Web App (PWA) with persistent local storage and client-side web workers. You can take your laptop or tablet into the field, draw parcels, generate rotation schedules, and export plans completely offline.

---

## Quick Start Guide

### Option A: One-Click Launch (Windows)

Double-click the launcher in the root folder:

```text
START-HERE.cmd
```

This script checks your local environment, installs dependencies if needed, starts the application, and opens your default browser at `http://localhost:5173`.

### Option B: Cross-Platform Terminal (macOS, Linux, WSL)

```bash
# 1. Install dependencies
npm install

# 2. Start the interactive frontend
npm run dev

# 3. (Optional) Start the local proxy and persistence server
npm run dev:api
```

### Option C: Retraining the Neural Model

AgroRotate comes pre-packaged with trained production weights. If you want to retrain the neural surrogate model on audited real-world datasets:

```text
TRAIN-AI.cmd
```

For complete training architecture, loss equations, and conformal calibration benchmarks, review [TRAIN-AI.md](TRAIN-AI.md).

---

## Software Architecture

```text
Agrorotate_Front-end_MVP/
|
|-- START-HERE.cmd               Windows primary launcher
|-- run.cmd / run.sh             Windows and Bash operational runners
|-- TRAIN-AI.cmd                 One-click AI retraining script
|-- README.md                    Executive overview, features, and user guide
|-- TRAIN-AI.md                  Scientific AI training and calibration documentation
|-- .env                         Unified project environment variables
|-- .env.example                 Environment template with NASA token instructions
|
|-- src/                         Client Web Application (React, TypeScript, Vite)
|   |-- app/                     Core layout and navigation views
|   |-- components/              Interactive Leaflet GIS map and data visualizers
|   |-- engine/                  Hydraulic estimation, agronomic rules, and validation
|   |-- data/                    Crop definitions (30 crops), evidence matrices, EO specs
|   |-- pages/                   Field, Soil, Water, Priorities, Plan, Crops, Evidence
|   |-- state/                   Central workspace store with local persistence
|   |-- ui/                      Interface components, charts, and audio engine
|   |-- workers/                 Web Worker thread running Pareto MCTS optimization
|
|-- server/                      Node.js Local API and Satellite Proxy
|   |-- index.mjs                REST API router and JSON farm plan storage
|   |-- eo.mjs                   NASA POWER, GIBS, and SoilGrids client with caching
|   |-- geo.mjs                  Geodesic distance and spherical polygon analysis
|   |-- ai/                      Server-side surrogate scoring and evidence lookup
|   |-- models/                  Production model weights and calibration metadata
|
|-- AI/                          Machine Learning Pipeline
|   |-- pipeline/                Data acquisition, training, and deployment scripts
|   |-- data/                    Raw, processed, and benchmark agricultural data
|   |-- models/real_v1/          Active neural weights and model specification card
|
|-- tests/                       Automated Quality Assurance Suite
|   |-- climate.test.mjs         FAO-56 Penman-Monteith and solar radiation tests
|   |-- eo.test.mjs              Earth observation caching and data pipeline tests
|   |-- geo.test.mjs             Spatial polygon and coordinate integrity tests
|   |-- optimizer.test.mjs       Pareto optimization and salinity pruning tests
|   |-- ptf.test.mjs             Saxton-Rawls pedotransfer hydraulic physics tests
|   |-- server.test.mjs          REST API contract and pipe communication tests
|   |-- validation.test.mjs      Triple-tier agronomic guardrail tests
|
|-- docs/                        Documentation and Reference Evidence
|   |-- AI-DATA.md               NASA satellite and climate layer specifications
|   |-- API.md                   Backend REST API specifications
|   |-- DATA-FLOW.md             System architecture and data pipeline diagrams
|   |-- OFFLINE.md               Offline PWA architecture and caching protocols
|   |-- SOURCES.md               Peer-reviewed literature, agronomic formulas, DOIs
|   |-- VERIFICATION.md          Real-world field validation protocols
|   |-- openapi.yaml             OpenAPI 3.0 specification
|
|-- scripts/                     Auditing and evidence synchronization utilities
```

---

## Quality Assurance and Reliability

AgroRotate is built for mission-critical farm decisions where mistakes cost real money. Every release passes a rigorous automated verification suite before deployment:

```bash
# Execute the full automated test suite (50 tests covering physics, EO, and API)
npm test

# Verify complete TypeScript type integrity
npm run typecheck

# Build the production distribution bundle
npm run build
```

- **50 Automated Tests Passing:** Verifies physical boundaries, hydraulic formulas, salinity thresholds, and API endpoints.
- **Zero TypeScript Errors:** Strict compile-time typing guarantees contract safety across all user inputs and engine outputs.
- **Sub-Second Production Builds:** Lightweight bundle optimized for fast cold-start load times on rural connections.

---

## License and Academic Attribution

AgroRotate is released under the MIT License. Developed for the NASA Space Apps Challenge, combining NASA Earth Observations with open scientific research from the FAO, USDA-ARS, and ISRIC World Soil Information. For full citations and literature DOIs, see [docs/SOURCES.md](docs/SOURCES.md).
