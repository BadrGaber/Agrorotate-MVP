import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOILGRIDS_CACHE = path.join(here, ".cache", "eo", "soilgrids");

export const SOILGRIDS_ENDPOINT =
  "https://rest.isric.org/soilgrids/v2.0/properties/query";
export const GIBS_WMTS_BASE =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
export const SOILGRIDS_TTL_MS = 30 * 24 * 60 * 60 * 1000;


export const EO_PRODUCTS = [
  {
    id: "srtm",
    name: "SRTM DEM",
    provider: "NASA SRTM GL1 · sampled through Open-Meteo elevation",
    resolution: "~30 m source; sampled across the parcel bbox",
    cadence: "static",
    role: "Elevation, slope, aspect, local flow routing and TWI screening.",
    caveat:
      "The metrics come from a small sample grid, not a survey-grade DEM map. Flow routing is D8 on that grid and TWI is a local proxy.",
    status: "live",
    numeric: "live",
    gibs: [
      {
        id: "SRTM_Color_Index",
        matrix: "GoogleMapsCompatible_Level12",
        maxNativeZoom: 12,
        label: "SRTM · colour index",
      },
    ],
    docsUrl:
      "https://www.earthdata.nasa.gov/data/catalog/lpcloud-srtmgl1-003",
  },
  {
    id: "soilgrids",
    name: "SoilGrids (ISRIC)",
    provider: "ISRIC World Soil Information · SoilGrids 250 m v2.0",
    resolution: "250 m mapped prediction",
    cadence: "static (v2.0)",
    role: "Mapped soil priors. Texture, pH, SOC, CEC and bulk density are inputs of the trained yield model; coarse fragments and total N feed the physics and estimates only.",
    caveat:
      "A mapped 250 m prior, not a laboratory test. It never upgrades a soil value to a measurement and is not used by the engine unless the user records it as a prior.",
    status: "live",
    numeric: "live",
    gibs: [],
    docsUrl: "https://soilgrids.org/",
  },
];

const SOILGRIDS_PROPERTIES = [
  {
    key: "clay",
    label: "Clay",
    unit: "%",
    convert: (value, factor) => value / factor,
  },
  {
    key: "sand",
    label: "Sand",
    unit: "%",
    convert: (value, factor) => value / factor,
  },
  {
    key: "silt",
    label: "Silt",
    unit: "%",
    convert: (value, factor) => value / factor,
  },
  {
    key: "phh2o",
    label: "pH (H₂O)",
    unit: "pH",
    convert: (value, factor) => value / factor,
  },
  {
    key: "soc",
    label: "Organic carbon",
    unit: "%",
    convert: (value, factor) => value / factor / 10,
  },
  {
    key: "cec",
    label: "CEC",
    unit: "cmol(c)/kg",
    convert: (value, factor) => value / factor,
  },
  {
    key: "bdod",
    label: "Bulk density",
    unit: "g/cm³",
    convert: (value, factor) => value / factor,
  },
  {
    key: "nitrogen",
    label: "Total N",
    unit: "%",
    convert: (value, factor) => value / factor / 10,
  },
  {
    key: "cfvo",
    label: "Coarse fragments",
    unit: "%",
    convert: (value, factor) => value / factor,
  },
  {
    key: "wv0010",
    label: "Water at 10 kPa",
    unit: "% vol.",
    convert: (value, factor) => value / factor,
  },
  {
    key: "wv0033",
    label: "Field capacity (33 kPa)",
    unit: "% vol.",
    convert: (value, factor) => value / factor,
  },
  {
    key: "wv1500",
    label: "Wilting point (1500 kPa)",
    unit: "% vol.",
    convert: (value, factor) => value / factor,
  },
];

const SOILGRIDS_DEPTHS = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm"];


const TEXTURE_CLASSES = [
  ["Sand", 85, 10, 5],
  ["Loamy sand", 80, 15, 5],
  ["Sandy loam", 65, 25, 10],
  ["Loam", 40, 40, 20],
  ["Silt loam", 20, 65, 15],
  ["Silt", 8, 87, 5],
  ["Sandy clay loam", 60, 20, 20],
  ["Clay loam", 32, 33, 35],
  ["Silty clay loam", 10, 55, 35],
  ["Sandy clay", 52, 8, 40],
  ["Silty clay", 6, 46, 48],
  ["Clay", 22, 22, 56],
];

export function textureClassFromFractions(sand, silt, clay) {
  if (![sand, silt, clay].every(Number.isFinite)) return null;
  let best = TEXTURE_CLASSES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of TEXTURE_CLASSES) {
    const distance =
      (sand - candidate[1]) ** 2 +
      (silt - candidate[2]) ** 2 +
      (clay - candidate[3]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best[0];
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}





export function depthWeightedMean(depths, topDepth, bottomDepth) {
  let weighted = 0;
  let weight = 0;
  for (const depth of depths) {
    if (!Number.isFinite(depth.mean)) continue;
    const top = Math.max(topDepth, depth.topDepth);
    const bottom = Math.min(bottomDepth, depth.bottomDepth);
    const thickness = Math.max(0, bottom - top);
    if (thickness <= 0) continue;
    weighted += depth.mean * thickness;
    weight += thickness;
  }
  return weight > 0 ? weighted / weight : null;
}

function normaliseProperty(layer, definition) {
  const factor = Number(layer?.unit_measure?.d_factor);
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const finiteOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const depths = (layer?.depths ?? [])
    .map((depth) => {
      const topDepth = finiteOrNull(depth?.range?.top_depth);
      const bottomDepth = finiteOrNull(depth?.range?.bottom_depth);
      const meanRaw = finiteOrNull(depth?.values?.mean);
      const uncertaintyRaw = finiteOrNull(depth?.values?.uncertainty);
      return {
        label: String(depth?.label ?? ""),
        topDepth,
        bottomDepth,
        mean:
          meanRaw === null
            ? null
            : round(definition.convert(meanRaw, safeFactor), 2),
        uncertainty:
          uncertaintyRaw === null
            ? null
            : round(definition.convert(uncertaintyRaw, safeFactor), 2),
      };
    })
    .filter(
      (depth) =>
        depth.topDepth !== null &&
        depth.bottomDepth !== null &&
        depth.bottomDepth > depth.topDepth,
    );

  return {
    key: definition.key,
    label: definition.label,
    unit: definition.unit,
    mappedUnit: layer?.unit_measure?.mapped_units ?? null,
    targetUnit: layer?.unit_measure?.target_units ?? null,
    depths,
    topsoil030: round(depthWeightedMean(depths, 0, 30), 2),
    rootZone0100: round(depthWeightedMean(depths, 0, 100), 2),
    topsoilUncertainty: round(
      depthWeightedMean(
        depths.map((depth) => ({
          ...depth,
          mean: depth.uncertainty,
        })),
        0,
        30,
      ),
      2,
    ),
  };
}





export function normaliseSoilGrids(payload, meta = {}) {
  const layers = Array.isArray(payload?.properties?.layers)
    ? payload.properties.layers
    : [];
  const normalised = [];
  for (const definition of SOILGRIDS_PROPERTIES) {
    const layer = layers.find((candidate) => candidate?.name === definition.key);
    if (!layer) continue;
    normalised.push(normaliseProperty(layer, definition));
  }

  const byKey = Object.fromEntries(
    normalised.map((layer) => [layer.key, layer]),
  );
  const fc = byKey.wv0033?.topsoil030 ?? null;
  const pwp = byKey.wv1500?.topsoil030 ?? null;
  const sand = byKey.sand?.topsoil030 ?? null;
  const silt = byKey.silt?.topsoil030 ?? null;
  const clay = byKey.clay?.topsoil030 ?? null;

  return {
    type: "SoilGrids 250 m v2.0 mapped priors",
    lat: meta.lat ?? null,
    lon: meta.lon ?? null,
    queryUrl: meta.queryUrl ?? SOILGRIDS_ENDPOINT,
    fetchedAtIso: meta.fetchedAtIso ?? new Date().toISOString(),
    layers: normalised,
    derived: {
      textureClass: textureClassFromFractions(sand, silt, clay),
      fieldCapacityPct: fc,
      wiltingPointPct: pwp,
      availableWaterPct:
        fc !== null && pwp !== null ? round(fc - pwp, 2) : null,
      ph: byKey.phh2o?.topsoil030 ?? null,
      organicCarbonPct: byKey.soc?.topsoil030 ?? null,
      cecCmolKg: byKey.cec?.topsoil030 ?? null,
      bulkDensityGCm3: byKey.bdod?.topsoil030 ?? null,
      coarseFragmentsPct: byKey.cfvo?.topsoil030 ?? null,
    },
    caveat:
      "Mapped 250 m predictions with quantified uncertainty. Not a laboratory test and not a field measurement.",
  };
}

function soilGridsCacheFile(lat, lon, cacheDir) {
  const key = crypto
    .createHash("sha1")
    .update(`${lat.toFixed(5)},${lon.toFixed(5)}`)
    .digest("hex")
    .slice(0, 24);
  return path.join(cacheDir, `${key}.json`);
}

async function readCache(file, ttlMs) {
  try {
    const raw = await fs.readFile(file, "utf8");
    const record = JSON.parse(raw);
    const stamp = Date.parse(record.fetchedAtIso);
    if (!Number.isFinite(stamp) || Date.now() - stamp > ttlMs) return null;
    return record;
  } catch {
    return null;
  }
}

const soilGridsInflight = new Map();
const soilGridsMemoryCache = new Map();


const SOILGRIDS_TIMEOUT_MS = 12_000;
const SOILGRIDS_MAX_RETRIES = 2;
const SOILGRIDS_ERROR_TTL_MS = 10 * 60 * 1000;

export async function fetchSoilGrids({
  lat,
  lon,
  force = false,
  cacheOnly = false,
  cacheDir = DEFAULT_SOILGRIDS_CACHE,
} = {}) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (
    lat === null ||
    lat === undefined ||
    lat === "" ||
    lon === null ||
    lon === undefined ||
    lon === "" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      status: "error",
      error: "A finite latitude and longitude are required",
      layers: [],
      derived: null,
    };
  }

  const coordKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;


  if (!force && soilGridsMemoryCache.has(coordKey)) {
    const memRecord = soilGridsMemoryCache.get(coordKey);
    const stamp = Date.parse(memRecord?.fetchedAtIso ?? "");
    const age = Date.now() - stamp;
    if (Number.isFinite(stamp)) {
      if (memRecord?.status === "error" && age < SOILGRIDS_ERROR_TTL_MS) {
        return { ...memRecord, cache: "none" };
      }
      if (memRecord?.status !== "error" && age < SOILGRIDS_TTL_MS) {
        return { ...memRecord, status: "ready", cache: "memory_cache" };
      }
    }
  }


  const file = soilGridsCacheFile(latitude, longitude, cacheDir);
  if (!force) {
    const cached = await readCache(file, SOILGRIDS_TTL_MS);
    if (cached) {
      soilGridsMemoryCache.set(coordKey, cached);
      return { ...cached, status: "ready", cache: "server_cache" };
    }
  }

  if (cacheOnly) {
    return {
      status: "pending",
      lat: latitude,
      lon: longitude,
      layers: [],
      derived: null,
      source: "ISRIC SoilGrids 250 m v2.0 · REST API",
      fetchedAtIso: null,
      cache: "none",
      note: "Mapped soil priors are being fetched in the background. The rest of the EO snapshot is already usable.",
    };
  }

  if (!force && soilGridsInflight.has(coordKey)) {
    return soilGridsInflight.get(coordKey);
  }

  const task = (async () => {

    const url = new URL(SOILGRIDS_ENDPOINT);
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("lat", String(latitude));
    for (const definition of SOILGRIDS_PROPERTIES) {
      url.searchParams.append("property", definition.key);
    }
    for (const depth of SOILGRIDS_DEPTHS) {
      url.searchParams.append("depth", depth);
    }
    url.searchParams.append("value", "mean");
    url.searchParams.append("value", "uncertainty");

    let lastError = null;


    for (let attempt = 0; attempt <= SOILGRIDS_MAX_RETRIES; attempt += 1) {
      if (attempt > 0) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "AgroRotateDSS/0.1 (soil priors; contact: local app)",
          },

          signal: AbortSignal.timeout(SOILGRIDS_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error(`SoilGrids responded ${response.status}`);
        }

        const payload = await response.json();
        const record = {
          ...normaliseSoilGrids(payload, {
            lat: latitude,
            lon: longitude,
            queryUrl: url.toString(),
            fetchedAtIso: new Date().toISOString(),
          }),
          status: "ready",
          source: "ISRIC SoilGrids 250 m v2.0 · REST API",
          cache: "live",
        };


        soilGridsMemoryCache.set(coordKey, record);
        try {
          await fs.mkdir(cacheDir, { recursive: true });
          await fs.writeFile(file, JSON.stringify(record), "utf8");
        } catch {

        }

        return record;
      } catch (error) {
        lastError = error;
      }
    }



    const isTimeout =
      lastError?.name === "TimeoutError" ||
      lastError?.name === "AbortError" ||
      String(lastError?.message ?? "").toLowerCase().includes("timeout") ||
      String(lastError?.message ?? "").toLowerCase().includes("aborted");



    const errMessage = isTimeout
      ? `ISRIC did not answer within ${SOILGRIDS_TIMEOUT_MS / 1000} s (${SOILGRIDS_MAX_RETRIES + 1} attempts).`
      : `ISRIC responded: ${lastError instanceof Error ? lastError.message : String(lastError)}`;

    const failure = {
      status: "error",
      error: errMessage,
      lat: latitude,
      lon: longitude,
      layers: [],
      derived: null,
      source: "ISRIC SoilGrids 250 m v2.0 · REST API",
      fetchedAtIso: new Date().toISOString(),
      cache: "none",
    };


    soilGridsMemoryCache.set(coordKey, failure);
    return failure;
  })();

  soilGridsInflight.set(coordKey, task);
  try {
    return await task;
  } finally {
    soilGridsInflight.delete(coordKey);
  }
}


function netrcEntry(text) {
  const machine = /machine\s+urs\.earthdata\.nasa\.gov\b([\s\S]*?)(?=\n\s*machine\b|$)/i.exec(
    text,
  );
  if (!machine) return null;
  const login = /\blogin\s+(\S+)/i.exec(machine[1]);
  const password = /\bpassword\s+(\S+)/i.exec(machine[1]);
  if (!login || !password) return null;
  return { login: login[1], password: password[1] };
}





export async function detectEarthdataCredentials(env = process.env) {
  const token = String(env.EARTHDATA_TOKEN ?? "").trim();
  const bearer = String(env.EARTHDATA_BEARER_TOKEN ?? "").trim();
  const username = String(env.EARTHDATA_USERNAME ?? "").trim();
  const password = String(env.EARTHDATA_PASSWORD ?? "").trim();
  let netrc = null;

  if (!token && !bearer && !(username && password)) {
    for (const file of [
      path.join(os.homedir(), "_netrc"),
      path.join(os.homedir(), ".netrc"),
    ]) {
      try {
        netrc = netrcEntry(await fs.readFile(file, "utf8"));
        if (netrc) break;
      } catch {

      }
    }
  }

  const configured = Boolean(token || bearer || (username && password) || netrc);
  return {
    configured,
    mode: token || bearer
      ? "bearer_token"
      : username && password
        ? "basic_auth"
        : netrc
          ? "netrc"
          : "none",
    source: token || bearer
      ? "EARTHDATA_TOKEN / EARTHDATA_BEARER_TOKEN"
      : username && password
        ? "EARTHDATA_USERNAME + EARTHDATA_PASSWORD"
        : netrc
          ? "~/.netrc (urs.earthdata.nasa.gov)"
          : "not configured",
    note: configured
      ? "Numeric NASA adapters can authenticate on the server. No granule task is submitted automatically."
      : "Numeric NASA granules are not fetched. Set EARTHDATA_TOKEN on the server to enable numeric adapters. The browser never holds this credential.",
  };
}

const COMPASS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

export function compassLabel(degrees) {
  if (!Number.isFinite(degrees)) return null;
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return COMPASS[index];
}

const FLOW_LABELS = {
  1: "E",
  2: "SE",
  3: "S",
  4: "SW",
  5: "W",
  6: "NW",
  7: "N",
  8: "NE",
};








export function analyseDemGrid(
  elevations,
  { rows, cols, cellSizeXm, cellSizeYm } = {},
) {
  const expected = Number(rows) * Number(cols);
  if (
    !Array.isArray(elevations) ||
    !Number.isInteger(rows) ||
    !Number.isInteger(cols) ||
    rows < 3 ||
    cols < 3 ||
    elevations.length !== expected
  ) {
    return {
      error: "A complete 3×3-or-larger row-major elevation grid is required",
    };
  }
  const values = elevations.map((value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  });
  const finite = values.filter((value) => value !== null);
  if (finite.length === 0) return { error: "No finite elevations" };

  const meanElevationM =
    finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const minElevationM = Math.min(...finite);
  const maxElevationM = Math.max(...finite);
  const reliefM = maxElevationM - minElevationM;
  const dx = Number(cellSizeXm);
  const dy = Number(cellSizeYm);
  if (
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    dx <= 0 ||
    dy <= 0
  ) {
    return { error: "Positive cell sizes are required" };
  }


  let n = 0;
  let sx = 0;
  let sy = 0;
  let sz = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sxz = 0;
  let syz = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const z = values[row * cols + col];
      if (z === null) continue;
      const x = col * dx;
      const y = (rows - 1 - row) * dy;
      n += 1;
      sx += x;
      sy += y;
      sz += z;
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
      sxz += x * z;
      syz += y * z;
    }
  }

  let a = null;
  let b = null;
  if (n >= 3) {

    const m = [
      [sxx, sxy, sx],
      [sxy, syy, sy],
      [sx, sy, n],
    ];
    const rhs = [sxz, syz, sz];
    const det = determinant3(m);
    if (Number.isFinite(det) && Math.abs(det) > 1e-12) {
      a = determinant3(replaceColumn(m, 0, rhs)) / det;
      b = determinant3(replaceColumn(m, 1, rhs)) / det;
    }
  }

  const slope = a !== null && b !== null ? Math.hypot(a, b) : null;
  const slopePercent = slope === null ? null : round(slope * 100, 2);
  const slopeDegrees =
    slope === null ? null : round((Math.atan(slope) * 180) / Math.PI, 2);
  let aspectDeg = null;
  if (a !== null && b !== null && slope > 1e-9) {

    aspectDeg = round(
      ((Math.atan2(-a, -b) * 180) / Math.PI + 360) % 360,
      1,
    );
  }

  const complete = values.every((value) => value !== null);
  let twi = null;
  let twiRange = null;
  let flowDirection = null;
  let flowAccumulationMax = null;
  let flowMetrics = null;

  if (complete) {
    const cellArea = dx * dy;
    const contourWidth = Math.sqrt(cellArea);
    const downstream = new Array(expected).fill(-1);
    const direction = new Array(expected).fill(null);
    const neighbours = [
      { dr: 0, dc: 1, code: 1, distance: dx },
      { dr: 1, dc: 1, code: 2, distance: Math.hypot(dx, dy) },
      { dr: 1, dc: 0, code: 3, distance: dy },
      { dr: 1, dc: -1, code: 4, distance: Math.hypot(dx, dy) },
      { dr: 0, dc: -1, code: 5, distance: dx },
      { dr: -1, dc: -1, code: 6, distance: Math.hypot(dx, dy) },
      { dr: -1, dc: 0, code: 7, distance: dy },
      { dr: -1, dc: 1, code: 8, distance: Math.hypot(dx, dy) },
    ];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const z = values[index];
        let bestDrop = 0;
        let bestIndex = -1;
        let bestCode = null;
        for (const neighbour of neighbours) {
          const nextRow = row + neighbour.dr;
          const nextCol = col + neighbour.dc;
          if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
            continue;
          }
          const nextIndex = nextRow * cols + nextCol;
          const drop = z - values[nextIndex];
          if (drop <= 0) continue;
          const gradient = drop / neighbour.distance;
          if (gradient > bestDrop) {
            bestDrop = gradient;
            bestIndex = nextIndex;
            bestCode = neighbour.code;
          }
        }
        if (bestIndex >= 0) {
          downstream[index] = bestIndex;
          direction[index] = bestCode;
        }
      }
    }

    const accumulation = new Array(expected).fill(1);
    const order = values
      .map((value, index) => ({ value, index }))
      .sort((left, right) => right.value - left.value);
    for (const cell of order) {
      const target = downstream[cell.index];
      if (target >= 0) accumulation[target] += accumulation[cell.index];
    }

    const twiValues = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const z = values[index];
        const west = col > 0 ? values[row * cols + (col - 1)] : z;
        const east = col < cols - 1 ? values[row * cols + (col + 1)] : z;
        const south = row < rows - 1 ? values[(row + 1) * cols + col] : z;
        const north = row > 0 ? values[(row - 1) * cols + col] : z;
        const dzdx = (east - west) / (2 * dx);
        const dzdy = (north - south) / (2 * dy);
        const localSlope = Math.hypot(dzdx, dzdy);
        const flowLength =
          (accumulation[index] * cellArea) / Math.max(contourWidth, 1);
        const twiValue = Math.log(
          flowLength / Math.max(localSlope, 0.005),
        );
        if (Number.isFinite(twiValue)) twiValues.push(twiValue);
      }
    }

    const centreRow = Math.floor(rows / 2);
    const centreCol = Math.floor(cols / 2);
    const centreIndex = centreRow * cols + centreCol;
    const centreWest = centreCol > 0 ? values[centreRow * cols + (centreCol - 1)] : values[centreIndex];
    const centreEast = centreCol < cols - 1 ? values[centreRow * cols + (centreCol + 1)] : values[centreIndex];
    const centreSouth = centreRow < rows - 1 ? values[(centreRow + 1) * cols + centreCol] : values[centreIndex];
    const centreNorth = centreRow > 0 ? values[(centreRow - 1) * cols + centreCol] : values[centreIndex];
    const centreSlope = Math.hypot(
      (centreEast - centreWest) / (2 * dx),
      (centreNorth - centreSouth) / (2 * dy),
    );
    const centreFlow =
      (accumulation[centreIndex] * cellArea) / Math.max(contourWidth, 1);
    const centreTwi = Math.log(centreFlow / Math.max(centreSlope, 0.005));

    twi = round(centreTwi, 2);
    twiRange =
      twiValues.length > 0
        ? [round(Math.min(...twiValues), 2), round(Math.max(...twiValues), 2)]
        : null;
    flowDirection = direction[centreIndex];
    flowAccumulationMax = Math.max(...accumulation);
    flowMetrics = {
      method:
        "D8 steepest descent on the sample grid, no depression filling; TWI = ln(a / tanβ) with a local flow-length proxy",
      cellAreaM2: round(cellArea, 1),
      contourWidthM: round(contourWidth, 1),
    };
  }

  return {
    meanElevationM: round(meanElevationM, 1),
    minElevationM: round(minElevationM, 1),
    maxElevationM: round(maxElevationM, 1),
    reliefM: round(reliefM, 1),
    slopePercent,
    slopeDegrees,
    aspectDeg,
    aspectLabel: compassLabel(aspectDeg),
    twi,
    twiRange,
    flowDirection,
    flowDirectionLabel:
      flowDirection !== null ? FLOW_LABELS[flowDirection] ?? null : null,
    flowAccumulationMax,
    flowMetrics,
    complete,
    rows,
    cols,
    cellSizeXm: round(dx, 1),
    cellSizeYm: round(dy, 1),
    gridPointCount: expected,
    caveat:
      "Local screening grid, not a survey-grade DEM. D8 routing has no depression filling; TWI is a local proxy.",
  };
}

function determinant3(matrix) {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
}

function replaceColumn(matrix, index, column) {
  return matrix.map((row, rowIndex) =>
    row.map((value, colIndex) =>
      colIndex === index ? column[rowIndex] : value,
    ),
  );
}


export function buildProductStatuses(earthdata, terrain) {
  return EO_PRODUCTS.map((product) => {
    const numericLive = product.numeric === "live";
    const visualLive = product.gibs.length > 0;
    const status = numericLive ? "live" : visualLive ? "visual" : "token";
    const numericStatus = numericLive
      ? "live"
      : earthdata.configured
        ? "token_configured"
        : "token_required";
    const values =
      product.id === "srtm" && terrain
        ? {
            meanElevationM: terrain.meanElevationM ?? null,
            reliefM: terrain.reliefM ?? null,
            slopePercent: terrain.slopePercent ?? null,
            slopeDegrees: terrain.slopeDegrees ?? null,
            aspectDeg: terrain.aspectDeg ?? null,
            aspectLabel: terrain.aspectLabel ?? null,
            twi: terrain.twi ?? null,
            twiRange: terrain.twiRange ?? null,
            flowDirection: terrain.flowDirection ?? null,
            flowDirectionLabel: terrain.flowDirectionLabel ?? null,
          }
        : null;
    return {
      ...product,
      status,
      numericStatus,
      values,
      detail: numericLive
        ? product.caveat
        : visualLive
          ? `${product.caveat} The GIBS layer is available on the field map.`
          : product.caveat,
    };
  });
}


export async function buildEoSnapshot({
  analysis = null,
  terrain = null,
  force = false,
  soilgridsMode = "await",
  cacheDir = DEFAULT_SOILGRIDS_CACHE,
} = {}) {
  const earthdata = await detectEarthdataCredentials();
  const soilgrids = analysis
    ? await fetchSoilGrids({
        lat: analysis.centroidLat,
        lon: analysis.centroidLon,
        force,
        cacheOnly: soilgridsMode === "cache",
        cacheDir,
      })
    : null;

  return {
    asOfIso: new Date().toISOString(),
    gibsBase: GIBS_WMTS_BASE,
    earthdata,
    products: buildProductStatuses(earthdata, terrain),
    soilgrids,
    terrain: terrain
      ? {
          meanElevationM: terrain.meanElevationM ?? null,
          minElevationM: terrain.minElevationM ?? null,
          maxElevationM: terrain.maxElevationM ?? null,
          reliefM: terrain.reliefM ?? null,
          slopePercent: terrain.slopePercent ?? null,
          slopeDegrees: terrain.slopeDegrees ?? null,
          aspectDeg: terrain.aspectDeg ?? null,
          aspectLabel: terrain.aspectLabel ?? null,
          twi: terrain.twi ?? null,
          twiRange: terrain.twiRange ?? null,
          flowDirection: terrain.flowDirection ?? null,
          flowDirectionLabel: terrain.flowDirectionLabel ?? null,
          flowAccumulationMax: terrain.flowAccumulationMax ?? null,
          flowMetrics: terrain.flowMetrics ?? null,
          complete: terrain.complete ?? null,
          grid: terrain.grid ?? null,
          source: terrain.source ?? null,
          slopeMethod: terrain.slopeMethod ?? null,
          cache: terrain.cache ?? null,
          fetchedAtIso: terrain.fetchedAtIso ?? null,
        }
      : null,
    limitations: [
      "GIBS layers are pictures; the decision engine never reads a number out of a pixel.",
      "No token-gated granule product is part of this build; GIBS is visual and the numeric EO inputs are terrain and SoilGrids.",
      "SoilGrids values are 250 m mapped priors, not laboratory measurements.",
    ],
  };
}