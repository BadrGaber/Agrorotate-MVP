# AgroRotate Local API Documentation

### High-Performance Geospatial, NASA Climate Ingestion, and Multi-Objective Rotation Engine.

The AgroRotate Local API provides lightning-fast geospatial processing, NASA Earth Observation caching, and multi-objective crop rotation optimization. Built with zero third-party framework overhead in pure Node.js, it operates seamlessly both as a local desktop proxy for the Progressive Web App and as a standalone server-side decision engine.

## Base URL

`http://127.0.0.1:8000` (or `PORT` environment variable)

## Health Check

### `GET /api/v1/health`

Returns the API status and AI mode.

**Response:**

```json
{
  "ok": true,
  "service": "agrorotate-local-api",
  "version": "v5",
  "ai": {
    "mode": "grounded_rules",
    "trainedRanker": false,
    "modelPath": null
  },
  "time": "2026-11-11T01:20:45.085Z"
}
```

## AI Crop Choose

### `POST /api/v1/ai/choose`

Selects the best crop for the current season based on the full field record and
constraints. The request body is the full structured workspace context (the
same shape the browser builds for the AI choose request) plus the target season.

**Request body:**

```json
{
  "schemaVersion": "agrorotate.aicontext/1",
  "generatedAtIso": "2026-11-11T02:00:00.000Z",
  "route": "plan",
  "seasonIndex": 0,
  "selected": null,
  "field": {
    "name": "...",
    "placeLabel": "...",
    "areaHa": 4.2,
    "boundary": [],
    "centroidLat": 30.9,
    "centroidLon": 30.4,
    "slopeClass": "flat",
    "elevationM": 18
  },
  "soil": {
    "observations": {},
    "lab": { "eceDsm": "8.7", "ph": "7.9" }
  },
  "water": { "ecwDsm": "1.9", "quotaMm": "620" },
  "climate": { "status": "ready", "summary": {} },
  "priorities": {
    "preset": "balanced",
    "weights": {},
    "excluded": {},
    "previousCropId": "grain-maize"
  },
  "plan": { "slots": [{ "cropId": null, "note": "" }] },
  "coverage": null,
  "numerics": {},
  "dataset": {
    "rowCount": 0,
    "labelledOutcomes": 0,
    "source": "browser_workspace",
    "note": ""
  }
}
```

**Response:**

```json
{
  "schemaVersion": "agrorotate.ai-choose-response/1",
  "status": "ok",
  "mode": "grounded_rules",
  "model": {
    "name": "agrorotate-ai-choose",
    "version": "0.1.0",
    "trained": false,
    "ranker": null,
    "note": "Deterministic evidence-grounded engine. Ranking probability activates when the ranker model file is present."
  },
  "asOfIso": "2026-11-11T01:20:47.980Z",
  "route": "plan",
  "routeLabel": "Rotation plan",
  "seasonLabel": "none selected",
  "fieldName": null,
  "fieldLocation": null,
  "fieldCentroid": null,
  "climateLoaded": false,
  "climateWindow": null,
  "choice": {
    "cropId": null,
    "cropName": null,
    "family": null,
    "season": null,
    "salinityLimitDsm": null,
    "salinitySlopePercentPerDsm": null,
    "status": "none",
    "salinityClears": null,
    "familyBreak": null,
    "seasonMatch": null,
    "isLegume": null,
    "isCover": null,
    "verdict": null,
    "findings": [],
    "dimensions": [],
    "salinity": null,
    "note": "No crop is selected for this season yet."
  },
  "alternatives": [],
  "stateNow": [
    {
      "key": "field.placeLabel",
      "label": "Field location",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "field.placeLabel",
      "label": "Field location",
      "value": "not recorded",
      "recorded": false,
      "source": "your input / place search"
    },
    {
      "key": "field.areaHa",
      "label": "Field area (ha)",
      "value": "not recorded",
      "recorded": false,
      "source": "your record or drawn polygon"
    },
    {
      "key": "field.boundary",
      "label": "Field boundary",
      "value": "not drawn",
      "recorded": true,
      "source": "drawn map"
    },
    {
      "key": "field.centroidLat",
      "label": "Field centroid latitude",
      "value": "not recorded",
      "recorded": false,
      "source": "drawn map / NASA POWER"
    },
    {
      "key": "field.centroidLon",
      "label": "Field centroid longitude",
      "value": "not recorded",
      "recorded": false,
      "source": "drawn map / NASA POWER"
    },
    {
      "key": "field.elevationM",
      "label": "Field elevation (m)",
      "value": "not recorded",
      "recorded": false,
      "source": "your input / Open-Meteo DEM fallback"
    },
    {
      "key": "field.slopeClass",
      "label": "Slope class",
      "value": "not recorded",
      "recorded": false,
      "source": "your observation"
    },
    {
      "key": "field.notes",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "soil.observations.surfaceSalt",
      "label": "Soil observation  -  surface salt",
      "value": "not recorded",
      "recorded": false,
      "source": "your observation"
    },
    {
      "key": "soil.observations.drainage",
      "label": "Soil observation  -  drainage",
      "value": "not recorded",
      "recorded": false,
      "source": "your observation"
    },
    {
      "key": "soil.lab.eceDsm",
      "label": "Lab ECe (dS/m)",
      "value": "not recorded",
      "recorded": false,
      "source": "saturated paste lab report"
    },
    {
      "key": "soil.lab.ph",
      "label": "Lab pH",
      "value": "not recorded",
      "recorded": false,
      "source": "lab report"
    },
    {
      "key": "soil.lab.clayPct",
      "label": "Lab clay %",
      "value": "not recorded",
      "recorded": false,
      "source": "lab report"
    },
    {
      "key": "soil.lab.sandPct",
      "label": "Lab sand %",
      "value": "not recorded",
      "recorded": false,
      "source": "lab report"
    },
    {
      "key": "soil.lab.siltPct",
      "label": "Lab silt %",
      "value": "not recorded",
      "recorded": false,
      "source": "lab report"
    },
    {
      "key": "water.ecwDsm",
      "label": "Water ECw (dS/m)",
      "value": "not recorded",
      "recorded": false,
      "source": "your water sample"
    },
    {
      "key": "water.quotaMm",
      "label": "Water quota (mm)",
      "value": "not recorded",
      "recorded": false,
      "source": "your water record"
    },
    {
      "key": "water.regime",
      "label": "Water regime",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "water.system",
      "label": "Irrigation system",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "water.source",
      "label": "Water source",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "climate.summary",
      "label": "Climate summary",
      "value": "not recorded",
      "recorded": false,
      "source": "not loaded"
    },
    {
      "key": "priorities.preset",
      "label": "Priority preset",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.weights.yield",
      "label": "Priority weight  -  yield",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.weights.water",
      "label": "Priority weight  -  water",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.weights.soil",
      "label": "Priority weight  -  soil",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.weights.risk",
      "label": "Priority weight  -  risk",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.previousCropId",
      "label": "Previous crop",
      "value": "not recorded",
      "recorded": false,
      "source": "your input"
    },
    {
      "key": "priorities.excluded",
      "label": "Hard exclusions",
      "value": "none recorded",
      "recorded": true,
      "source": "your input"
    }
  ],
  "missing": [
    {
      "key": "boundary",
      "label": "Draw the parcel",
      "why": "The plan needs a boundary: area and centroid come from the drawn polygon.",
      "route": "field",
      "priority": "nice"
    },
    {
      "key": "boundary",
      "label": "Draw the parcel",
      "why": "Area and dimensions need at least three WGS84 corners.",
      "route": "field",
      "priority": "blocking"
    },
    {
      "key": "climate",
      "label": "Load NASA POWER",
      "why": "The climate averages are missing for this location.",
      "route": "field",
      "priority": "important"
    },
    {
      "key": "ece",
      "label": "Add a saturated-paste ECe",
      "why": "Without it the salinity check must stay unassessed.",
      "route": "soil",
      "priority": "important"
    },
    {
      "key": "water-sample",
      "label": "Record ECw or the water quota",
      "why": "Climate cannot tell us what comes out of the pump.",
      "route": "water",
      "priority": "important"
    },
    {
      "key": "previous-crop",
      "label": "Set the previous crop",
      "why": "The first family break cannot be checked without it.",
      "route": "priorities",
      "priority": "important"
    },
    {
      "key": "exclusion",
      "label": "Record one hard exclusion",
      "why": "An exclusion is the strongest signal the planner cannot override.",
      "route": "priorities",
      "priority": "nice"
    },
    {
      "key": "plan",
      "label": "Choose a crop for a season",
      "why": "There is nothing to evaluate yet.",
      "route": "plan",
      "priority": "blocking"
    }
  ],
  "suggestions": [
    {
      "label": "Draw the real parcel",
      "reason": "Area and dimensions become reproducible when the polygon is WGS84.",
      "route": "field"
    },
    {
      "label": "Load NASA POWER for this field",
      "reason": "Five years of daily AG data are cached by the local API.",
      "route": "field"
    },
    {
      "label": "Add a saturated-paste ECe",
      "reason": "Only a measurement can trigger the FAO salinity curve.",
      "route": "soil"
    },
    {
      "label": "Add ECw and the quota",
      "reason": "Water quality and allocation are local facts, not satellite estimates.",
      "route": "water"
    }
  ],
  "evidence": [
    {
      "id": "E006",
      "crop": "Bread Wheat",
      "parameter": "Salinity Limit",
      "value": "6.0 dS/m",
      "status": "SUPPORTED FOR SOURCE SCOPE",
      "scope": "FAO Annex 1 Table A1.1; use FAO-56 Table 23 for the FAO-56 cross-check where stated in the audit.",
      "url": "https://www.fao.org/4/Y4263E/y4263e0e.htm"
    }
    // ... more evidence claims
  ],
  "inputRules": [
    {
      "section": 9,
      "name": "Soil salinity ECe via crust/indicators",
      "why": "Lab ECe or remote-sensing anomaly flag"
    }
  ],
  "counts": {
    "cropsCatalogued": 30,
    "salinityVerified": 13,
    "seasonsInPlan": 6,
    "seasonsFilled": 0,
    "conflicts": 0,
    "cautions": 0,
    "evidenceClaims": 120,
    "evidenceSupported": 26,
    "evidenceSources": 30
  }
}
```

## Field Analysis

### `POST /api/v1/field/analyze`

Analyses a drawn boundary: spherical geometry (area, perimeter, bounding box),
a 5x5 terrain sample grid (Open-Meteo elevation, Copernicus DEM/SRTM-backed)
with plane-fit slope/aspect, D8 local flow routing and a TWI proxy, and the
NASA POWER daily window for the centroid. The terrain metrics are explicitly
screening-level, not a survey-grade DEM map.

**Request body:**

```json
{
  "boundary": [
    { "id": "p1", "lat": 30.9, "lon": 30.4, "xPct": 20, "yPct": 25 }
  ],
  "years": 5,
  "force": false,
  "elevationM": null
}
```

**Response:** `geometry`, `terrain`, `climate` (raw POWER record + cache flag),
`request` echo and a `provenance` list naming the source and method behind each
derived value.

## Earth Observation

### `GET|POST /api/v1/eo`

Unified, field-scoped EO snapshot. It returns:

- live SoilGrids 250 m priors for the centroid (ISRIC REST API), including
  depth-weighted 0-30 cm and 0-100 cm means and predicted uncertainty;
- the 5x5 SRTM/Copernicus-backed terrain sample grid (elevation, slope, aspect,
  D8 flow direction, TWI proxy) when a boundary is supplied;
- the registry of the seven EO products with explicit `live`, `visual` or
  `token` states;
- the server-side Earthdata credential status as booleans and a source label.
  The token itself never appears in the response;
- limitations, including "GIBS layers are pictures; the engine never reads a
  number out of a pixel".

The route returns quickly: SoilGrids is included from the server cache when it
is available, and is otherwise returned as `status: "pending"` so the terrain
and product registry render immediately. A separate call to
`/api/v1/eo/soilgrids` fills in the slow ISRIC query.

**Point request:**

```json
{ "lat": 30.2828488, "lon": 30.6079612, "force": false }
```

**Boundary request:**

```json
{
  "boundary": [
    { "lat": 30.2835, "lon": 30.6070 },
    { "lat": 30.2835, "lon": 30.6090 },
    { "lat": 30.2820, "lon": 30.6090 },
    { "lat": 30.2820, "lon": 30.6070 }
  ],
  "force": false
}
```

`GET /api/v1/eo?lat=...&lon=...` is supported for a point. With no coordinates the
endpoint still returns the product registry and token status, without inventing
a location. Add `?soilgrids=await` (or `"soilgrids": "await"` in the body) to
make the unified response wait for the ISRIC query instead of returning
`pending`.

### `GET|POST /api/v1/eo/soilgrids`

The slow half of the snapshot. Takes the same point or boundary body as
`/api/v1/eo` and returns the normalised SoilGrids record:

```json
{
  "status": "ready",
  "lat": 30.28275,
  "lon": 30.608,
  "layers": [],
  "derived": { "textureClass": "Clay loam", "ph": 8.1 },
  "cache": "server_cache"
}
```

The route never holds a slow ISRIC request open. It answers from the in-memory
or disk cache, and otherwise starts the upstream fetch in the background and
returns `{"status": "pending", "retryAfterMs": 4000}`. The browser polls until
the record is `ready` or `error` (30 s budget). Each ISRIC attempt times out
after 12 s, with two retries; a failure is remembered for 10 minutes so polling
gets an immediate, stable answer instead of repeating the attempts.

When ISRIC cannot answer, the record is `{"status": "error", "error":
"ISRIC did not answer within 12 s (3 attempts)."}`  -  the reason only. The policy
sentence ("no prior is invented") belongs to the UI and is printed once.
Missing SoilGrids means stay `null`; the API never turns a missing prediction
into zero. `force: true` skips the cache and starts a fresh fetch.

**Server-only credential detection.** Numeric NASA products are not faked. The
server looks for `EARTHDATA_TOKEN`, `EARTHDATA_BEARER_TOKEN`,
`EARTHDATA_USERNAME` + `EARTHDATA_PASSWORD`, or a `~/.netrc` / `_netrc` entry
for `urs.earthdata.nasa.gov`. A configured token only unlocks the numeric adapter
path; it does not create values until a real granule extraction returns them.

## Climate Context

### `POST /api/v1/context`

Direct NASA POWER proxy. Requires `latitude`, `longitude`, `start` and `end`
(`YYYYMMDD`); returns the raw POWER record with the request metadata and the
cache flag (`live` or `server_cache`).

## Plans

### `GET /api/v1/plans/:id`

Get a specific plan by ID (the ID is derived from the field's location label).

### `POST /api/v1/plans/sync`

Sync or create a new rotation plan. Requires the full workspace object
(`field` + `plan` at minimum); stores `plan-<fieldId>.json` on this machine and
returns the revision ID.

### `POST /api/v1/outcomes`

Record a season outcome.

### `GET /api/v1/outcomes`

List all outcomes.

## Parcellary outlines

### `GET /api/v1/parcels`

`:lat`, `:lon` (required WGS84), `radius` metres (default 600, 50-1500),
`limit` (default 6, max 10).

Returns farmland/field/orchard/vineyard outlines mapped in OpenStreetMap near
the point, each with its vertices, spherical area, centroid and distance from
the searched point. Results are cached server-side for 7 days. Overpass is
best-effort public data: the client shows where the outline came from and the
corners stay editable before anything is saved.

Attribution: "(c) OpenStreetMap contributors, ODbL - Overpass API".

## Geocode

### `GET /api/v1/geocode`

Query place search for a location string (`q`, optional `limit` 1-8).

## Version

The API version is v5. All responses include structural stability and will not break between patch releases without a version bump.

## Caching Policy

- NASA POWER climate data is cached for 24 hours per location
- Geocode results are cached for 30 days
- Terrain (elevation) samples are cached for 30 days
- Evidence claims are cached per crop/parameter combination
- No client-side caching headers are set; the application manages its own cache

## Place Search Policy

- `GET /api/v1/geocode` calls the Nominatim service (OpenStreetMap) with a
  descriptive User-Agent and a rate-limited queue (one request per ~1.1 s)
- Results are attributed "(c) OpenStreetMap contributors, ODbL - Nominatim"
- All location data is derived from WGS84 coordinates drawn on the map or
  entered manually

## POWER API Parameters

The API queries the NASA POWER (Prediction of Worldwide Energy Resource) database for:

- Daily temperature, precipitation, and radiation data
- Five-year historical averages
- Climate normals for the selected location
- Data is cached locally with exact request reproduction for reproducibility
