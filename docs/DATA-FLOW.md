# Data Architecture and Pipeline Flow: Browser -> Local Engine -> Verified Decision

### Enterprise Privacy, Instant Edge Execution, and Verifiable Scientific Auditability.

AgroRotate is architected for maximum speed, data sovereignty, and reliability. Farm boundaries, soil chemical tests, and rotation plans remain entirely on the local device. Nothing is leaked to third-party cloud analytics or external AI services. The only outbound network requests are direct, transparent queries to public NASA POWER agroclimatology servers, which are immediately cached locally for total auditability and offline reproduction.

## 1. Browser State (Workspace)

The central state lives in `src/state/model.ts` as plain typed interfaces and is managed by `src/state/workspace.ts` (React context + reducer, autosaved to `localStorage`). There is no React Query and no Zod; validation is done in TypeScript and in the engine itself. Key modules:

- `FieldState`  -  geometry, area, centroid, boundary points
- `SoilState`  -  lab values (ECe, pH, clay/sand/silt%), observations (kept as classes), diagnosed pathogens
- `WaterState`  -  ECw, quota, regime, system, source. SARw and NO3-N remain in the
  stored type for old workspaces but are no longer collected or read by the plan.
- `PrioritiesState`  -  preset weights for yield/water/soil/risk, previous crop, hard exclusions
- `WorkspaceState`  -  ties all of the above together + plan metadata

Every value is either **recorded** or **not recorded**. The AI choose endpoint respects these flags  -  if a field is "not recorded", it appears in the `missing` array and the corresponding check stays unassessed.

## 2. Context Building for `/api/v1/ai/choose`

The `/api/v1/ai/choose` endpoint is available for API clients; when it is
called, the browser engine (`src/engine/agronomy.ts`) is the source of truth.
The client computes and sends:

- `coverage`  -  `planCoverage(state)`: filled seasons, salinity-assessable slots, family repeats, conflicts, cautions
- `selected`  -  for the inspected season: the crop, its `evaluateSlot()` evaluation (findings, dimensions, salinity curve), the boolean check results, and the top `alternativeCrops()` candidates with their per-check reasons

The context is a plain JSON-serializable object sent to the local API.

## 3. Local API (`server/index.mjs`)

The Node.js server does **not** re-derive the decision checks. Its responsibilities are:

- Proxy NASA POWER daily AG requests and cache raw responses with exact request records
- Persist rotation plans and post-season outcomes as plain JSON
- Serve `/api/v1/ai/choose` from `server/ai/choose.mjs`

The `POST /api/v1/ai/choose` handler:

1. **Reads** the browser-computed coverage and slot evaluation from the payload
2. **Annotates** the alternatives with the ranker probability when a trained ranker file is present (otherwise the probability stays `null`  -  no number is invented)
3. **Retrieves** the relevant evidence claims for the selected crop (`server/ai/retrieval.mjs`, backed by the 120-claim ledger)
4. **Builds** the response JSON with:
   - `choice`  -  the evaluated crop with its verdict (`open` / `caution` / `conflict`) and findings, or `status: "none"` when the season is empty
   - `alternatives`  -  the engine-built candidates, ordered by the sourced checks the plan uses
   - `stateNow`  -  all 30+ input state fields with recording status
   - `missing`  -  blocking and nice-to-have gaps with routes to fix them
   - `suggestions`  -  actionable items (draw parcel, load climate, add ECe, add water data)
   - `evidence`  -  subset of claims relevant to the selection
   - `counts`  -  catalog, evidence and coverage totals

The API response includes `mode: "grounded_rules"` and `model.trained: false` until a trained ranker file is present  -  the engine runs deterministic, source-scoped rules; the ranking probability activates only when the model file exists.

### 3.1 Rotation yield model (browser and server)

The plan's yield prior is a trained model, separate from the AI choose endpoint's evidence retrieval:

1. The browser builds the 40-dimension contract vector
   (`agronomicVectorToModelContract` + `writeCropTraits`) from the workspace:
   texture, bulk density, Saxton-Rawls hydraulics, pH, SOM, CEC, ETo, slope and the
   eight crop traits.
2. `src/workers/aiOptimizer.worker.ts` loads
   `/models/agrorotate_surrogate_weights.json` network-first (cache only as the
   offline fallback), so a freshly trained file takes effect on the next reload.
3. The model returns a relative yield gap for the 22 crops that have real training
   rows. The engine anchors it to each crop's best-quartile gap and applies
   `max(physical floor, neural)`.
4. `POST /api/v1/optimize` follows the same contract server-side with
   `server/models/agrorotate_surrogate_weights.json`, building the vector from raw
   field values (`buildRuntimeVector40`), not from 32 pre-normalised numbers.

ECe, ESP, nutrients, pathogens, quota and ECw travel in the vector because the
contract has slots for them, but the model has **no learned response** to any of
them: they were constant in training. Salinity is decided by the Maas-Hoffman floor
and the crop threshold/slope pairs, never by the network. Crops absent from the
training set get no neural penalty at all.

The forms no longer collect the stored-only slots. The Soil page asks for the model
dimensions it uses (texture, bulk density, pH, organic carbon, CEC) plus measured
ECe for the salinity rule; ESP, CaCO3, N/P/K and SARw were removed, as were the
ponding, rooting, fizz and dispersion observations. `workspaceToAgronomicVector`
also ignores those old saved values, so an older workspace cannot keep feeding
them in. A field observation becomes an EST proxy through
`src/data/observationProxy.ts`; a typed lab number is MEAS and wins. The proxy
module imports the same exported class maps as the engine, so the number shown in
the UI is the number the engine substitutes.

## 4. AI Response Shape

The `/api/v1/ai/choose` response schema (as documented in `API.md`) includes:

- `schemaVersion`  -  `agrorotate.ai-choose-response/1`
- `status`  -  `"ok"` or error indicator
- `mode`  -  `"grounded_rules"` until a ranker is trained
- `model`  -  name/version info + `trained` flag + ranker metrics when loaded
- `choice`  -  crop details with verdict and findings, or `status: "none"` with note
- `alternatives`  -  engine candidates with per-check reasons and ranker probability when available
- `stateNow`  -  30+ fields with `key`, `label`, `value`, `recorded`, `source`
- `missing`  -  blocked/important/nice gaps with `key`, `label`, `why`, `route`, `priority`
- `suggestions`  -  actionable items with `label`, `reason`, `route`
- `evidence`  -  claims with `id`, `crop`, `parameter`, `value`, `status`, `scope`, `url`
- `inputRules`  -  rule index entries with `section`, `name`, `why`
- `counts`  -  aggregated totals (crops catalogued, salinity verified, seasons, conflicts, cautions, evidenceClaims, evidenceSources)

## 5. Data Provenance

- **Origin**: Farmer enters data via forms -> stored in localStorage + API JSON files
- **NASA POWER**: Queried once per field location, cached for 24h, never re-fetched unless cleared
- **Evidence claims**: 120 claims indexed from 30 external sources (see SOURCES.md)
- **No external AI**: All decisions are rule-based; the model field in the response is descriptive only
- **No telemetry**: No data leaves the local machine unless the farmer explicitly submits a saved plan

## 6. Flow Diagram

```
Farmer Input (browser)
    |
useWorkspace (typed store + autosave)
    |
browser engine: planCoverage / evaluateSlot / alternativeCrops
    |
POST /api/v1/ai/choose (Node server)
    |
server annotates: evidence retrieval + ranker probability (if trained)
    |
Response JSON (choice + alternatives + state + missing + suggestions + evidence)
    |
Client renders the choice, alternatives, gaps and suggestions
    |
Farmer fills gaps and re-runs
```

## 7. Caching & Reproducibility

- NASA POWER requests are cached with a hash of the exact query URL
- If the same location/parameters are requested again, the cached raw response is returned
- All API responses include timestamps (`asOfIso`) for auditability
- Local JSON data (plans, outcomes) is persisted as `.json` files in the `server/data` directory
- The system is designed so that every climate number is reproducible from the exact request that generated it
