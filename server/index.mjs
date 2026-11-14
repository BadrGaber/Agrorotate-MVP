/**
 * AgroRotate local API — no external dependencies, no AI.
 *
 * Responsibilities:
 *  - Proxy NASA POWER daily AG requests and cache the raw response with an
 *    exact record of the request, so every climate number is reproducible.
 *  - Persist rotation plans as plain JSON on this machine. No account, no
 *    cloud, no telemetry.
 *
 * Run: node server/index.mjs   (PORT defaults to 8000)
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { analyseBoundary, validateBoundary } from "./geo.mjs";
import { analyseDemGrid, buildEoSnapshot, fetchSoilGrids } from "./eo.mjs";
import { buildAiChooseResponse } from "./ai/choose.mjs";
import { optimizeWorkspace } from "./ai/optimizer.mjs";
import { loadEnvFiles } from "./env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnvFiles({
  files: [
    path.join(here, ".env"),
    path.join(here, ".env.local"),
    path.join(here, "..", ".env"),
    path.join(here, "..", ".env.local"),
  ],
});

const DATA_DIR = path.join(here, "data");
const CACHE_DIR = path.join(here, ".cache", "context");
const GEOCODE_CACHE_DIR = path.join(here, ".cache", "geocode");
const PARCEL_CACHE_DIR = path.join(here, ".cache", "parcels");
const TERRAIN_CACHE_DIR = path.join(here, ".cache", "terrain");
const requestedPort = Number(process.env.PORT);
const PORT =
  Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 8000;
const HOST = process.env.HOST ?? "127.0.0.1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GEOCODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PARCEL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TERRAIN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const POWER_PARAMETERS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "RH2M",
  "WS2M",
  "ALLSKY_SFC_SW_DWN",
  "PRECTOTCORR",
];

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (process.env.ALLOWED_ORIGINS) {
    const custom = process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    if (custom.includes(origin) || custom.includes("*")) return true;
  }
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") {
      return true;
    }
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function setCors(request, response) {
  const origin = request.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

async function readJson(request, limit = 2 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const isIsoDate = (value) => typeof value === "string" && /^\d{8}$/.test(value);
const inRange = (value, min, max) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(GEOCODE_CACHE_DIR, { recursive: true });
  await fs.mkdir(PARCEL_CACHE_DIR, { recursive: true });
  await fs.mkdir(TERRAIN_CACHE_DIR, { recursive: true });
}

function contextCacheFile(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

async function readCache(file) {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (Date.now() - new Date(parsed.fetchedAtIso).getTime() > CACHE_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function getPowerRecord({
  latitude,
  longitude,
  start,
  end,
  force = false,
}) {
  const key = crypto
    .createHash("sha1")
    .update(`${latitude.toFixed(3)}|${longitude.toFixed(3)}|${start}|${end}`)
    .digest("hex")
    .slice(0, 20);
  const file = contextCacheFile(key);

  if (!force) {
    const cached = await readCache(file);
    if (cached) return { ...cached, cache: "server_cache" };
  }

  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.searchParams.set("parameters", POWER_PARAMETERS.join(","));
  url.searchParams.set("community", "AG");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("format", "JSON");

  let powerResponse;
  const powerHeaders = { Accept: "application/json" };
  if (process.env.EARTHDATA_TOKEN) {
    powerHeaders["Authorization"] = `Bearer ${process.env.EARTHDATA_TOKEN}`;
  }
  try {
    powerResponse = await fetch(url, {
      headers: powerHeaders,
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    const failure = new Error("NASA POWER could not be reached");
    failure.status = 502;
    failure.payload = {
      error: "NASA POWER could not be reached",
      detail: error instanceof Error ? error.message : String(error),
      requestUrl: url.toString(),
    };
    throw failure;
  }

  if (!powerResponse.ok) {
    const failure = new Error(`NASA POWER responded ${powerResponse.status}`);
    failure.status = 502;
    failure.payload = {
      error: `NASA POWER responded ${powerResponse.status}`,
      requestUrl: url.toString(),
    };
    throw failure;
  }

  const raw = await powerResponse.json();
  const record = {
    request: { latitude, longitude, start, end, parameters: POWER_PARAMETERS },
    fetchedAtIso: new Date().toISOString(),
    queryUrl: url.toString(),
    powerHeader: raw?.header ?? null,
    raw,
  };
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(record), "utf8");
  return { ...record, cache: "live" };
}

async function handleContext(request, response) {
  const body = await readJson(request);
  const { latitude, longitude, start, end } = body;

  if (
    !inRange(latitude, -60, 60) ||
    !inRange(longitude, -180, 180) ||
    !isIsoDate(start) ||
    !isIsoDate(end)
  ) {
    return sendJson(response, 400, {
      error:
        "latitude, longitude, start (YYYYMMDD) and end (YYYYMMDD) are required. POWER only covers about 60°S–60°N.",
    });
  }
  if (start >= end) {
    return sendJson(response, 400, { error: "start must be before end" });
  }

  try {
    const record = await getPowerRecord({
      latitude,
      longitude,
      start,
      end,
      force: body.force === true,
    });
    return sendJson(response, 200, {
      raw: record.raw,
      request: record.request,
      fetchedAtIso: record.fetchedAtIso,
      cache: record.cache,
      parameters: POWER_PARAMETERS,
    });
  } catch (error) {
    return sendJson(
      response,
      error.status ?? 500,
      error.payload ?? {
        error: "NASA POWER request failed",
        detail: error instanceof Error ? error.message : String(error),
      },
    );
  }
}

async function readJsonCache(file, ttlMs) {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (Date.now() - new Date(parsed.fetchedAtIso).getTime() > ttlMs)
      return null;
    return parsed;
  } catch {
    return null;
  }
}

let geocodeQueue = Promise.resolve();
let lastGeocodeAt = 0;

function enqueueGeocode(task) {
  const run = async () => {
    const waitMs = Math.max(0, 1_100 - (Date.now() - lastGeocodeAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGeocodeAt = Date.now();
    return task();
  };
  const result = geocodeQueue.then(run, run);
  geocodeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function geocodePlace(query, limit) {
  const key = crypto
    .createHash("sha1")
    .update(`${query.toLowerCase()}|${limit}`)
    .digest("hex")
    .slice(0, 20);
  const file = path.join(GEOCODE_CACHE_DIR, `${key}.json`);
  const cached = await readJsonCache(file, GEOCODE_TTL_MS);
  if (cached) return { ...cached, cache: "server_cache" };

  const rows = await enqueueGeocode(async () => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "en");
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "AgroRotateDSS/0.1 (local research prototype; place search is user-triggered)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);
    return response.json();
  });

  const places = (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.lat && row.lon)
    .map((row) => ({
      label: String(row.display_name ?? query),
      lat: Number(row.lat),
      lon: Number(row.lon),
      type: row.type ? String(row.type) : null,
      category: row.class ? String(row.class) : null,
      importance: typeof row.importance === "number" ? row.importance : null,
      bbox: Array.isArray(row.boundingbox)
        ? row.boundingbox.map((value) => Number(value))
        : null,
    }));
  const record = { query, places, fetchedAtIso: new Date().toISOString() };
  await fs.mkdir(GEOCODE_CACHE_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(record), "utf8");
  return { ...record, cache: "live" };
}

async function handleGeocode(request, response, url) {
  const query = String(url.searchParams.get("q") ?? "").trim();
  const requestedLimit = Number(url.searchParams.get("limit") ?? 5);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(8, Math.round(requestedLimit)))
    : 5;
  if (query.length < 2 || query.length > 200) {
    return sendJson(response, 400, {
      error: "q must contain 2–200 characters",
    });
  }
  try {
    const result = await geocodePlace(query, limit);
    return sendJson(response, 200, {
      places: result.places,
      count: result.places.length,
      fetchedAtIso: result.fetchedAtIso,
      cache: result.cache,
      attribution: "© OpenStreetMap contributors, ODbL · Nominatim",
    });
  } catch (error) {
    return sendJson(response, 502, {
      error: "Place search is temporarily unavailable",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

// Overpass mirrors are unreachable from some networks, so parcel detection
// reads the same OpenStreetMap data through the main OSM map API instead: a
// small bbox is enough for a field and the response arrives in about a second.
const OSM_MAP_API = "https://api.openstreetmap.org/api/0.6/map";

function ringAreaHa(vertices) {
  if (vertices.length < 3) return 0;
  const R = 6_371_008.8;
  let sum = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index];
    const b = vertices[(index + 1) % vertices.length];
    sum +=
      (((b.lon - a.lon) * Math.PI) / 180) *
      (2 +
        Math.sin((a.lat * Math.PI) / 180) +
        Math.sin((b.lat * Math.PI) / 180));
  }
  return Math.abs((sum * R * R) / 2) / 10_000;
}

function haversineMeters(a, b) {
  const R = 6_371_008.8;
  const rad = (value) => (value * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function ringCentroid(vertices) {
  return {
    lat: vertices.reduce((sum, vertex) => sum + vertex.lat, 0) / vertices.length,
    lon: vertices.reduce((sum, vertex) => sum + vertex.lon, 0) / vertices.length,
  };
}

function geometryVertices(geometry) {
  if (!Array.isArray(geometry)) return [];
  return geometry
    .filter(
      (point) =>
        point && Number.isFinite(point.lat) && Number.isFinite(point.lon),
    )
    .map((point) => ({ lat: point.lat, lon: point.lon }));
}

/** Convert Overpass ways/relations into candidate field outlines. */
function collectParcels(elements, origin, limit) {
  const parcels = [];
  for (const element of Array.isArray(elements) ? elements : []) {
    const tags = element.tags ?? {};
    let vertices = [];
    if (element.type === "way") {
      vertices = geometryVertices(element.geometry);
    } else if (element.type === "relation" && Array.isArray(element.members)) {
      const outers = element.members
        .filter(
          (member) =>
            member.type === "way" &&
            member.role !== "inner" &&
            Array.isArray(member.geometry),
        )
        .sort(
          (a, b) => (b.geometry?.length ?? 0) - (a.geometry?.length ?? 0),
        );
      if (outers[0]) vertices = geometryVertices(outers[0].geometry);
    }
    if (vertices.length < 3 || vertices.length > 800) continue;
    const areaHa = ringAreaHa(vertices);
    if (!(areaHa >= 0.02 && areaHa <= 2000)) continue;
    const centroid = ringCentroid(vertices);
    const landuse = tags.landuse ?? null;
    parcels.push({
      id: `${element.type}/${element.id}`,
      label:
        tags.name ||
        (landuse
          ? `${landuse[0].toUpperCase()}${landuse.slice(1)} outline`
          : "Mapped field outline"),
      areaHa: Number(areaHa.toFixed(3)),
      lat: Number(centroid.lat.toFixed(6)),
      lon: Number(centroid.lon.toFixed(6)),
      distanceM: Math.round(haversineMeters(origin, centroid)),
      landuse,
      vertices: vertices.map((vertex) => ({
        lat: Number(vertex.lat.toFixed(7)),
        lon: Number(vertex.lon.toFixed(7)),
      })),
    });
  }
  const seen = new Set();
  return parcels
    .filter((parcel) => {
      if (seen.has(parcel.id)) return false;
      seen.add(parcel.id);
      return true;
    })
    .sort(
      (a, b) => a.distanceM - b.distanceM || b.areaHa - a.areaHa,
    )
    .slice(0, limit);
}

function attrValue(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1] : null;
}

/** Parse the OSM map XML into the way records collectParcels understands. */
function parseOsmMapXml(xml) {
  const nodes = new Map();
  const nodePattern = /<node\b([^>]*?)\/?>/g;
  let match;
  while ((match = nodePattern.exec(xml))) {
    const id = attrValue(match[1], "id");
    const lat = Number(attrValue(match[1], "lat"));
    const lon = Number(attrValue(match[1], "lon"));
    if (id && Number.isFinite(lat) && Number.isFinite(lon)) {
      nodes.set(id, { lat, lon });
    }
  }

  const ways = [];
  const wayPattern = /<way\b([^>]*)>([\s\S]*?)<\/way>/g;
  while ((match = wayPattern.exec(xml))) {
    const body = match[2];
    const tags = {};
    const tagPattern = /<tag\b([^>]*?)\/?>/g;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(body))) {
      const key = attrValue(tagMatch[1], "k");
      if (key) tags[key] = attrValue(tagMatch[1], "v") ?? "";
    }
    if (!/^(farmland|field|orchard|vineyard|meadow)$/.test(tags.landuse ?? "")) {
      continue;
    }
    const geometry = [];
    const refPattern = /<nd\b([^>]*?)\/?>/g;
    let refMatch;
    while ((refMatch = refPattern.exec(body))) {
      const ref = attrValue(refMatch[1], "ref");
      const point = ref ? nodes.get(ref) : null;
      if (point) geometry.push(point);
    }
    if (geometry.length < 3) continue;
    ways.push({ type: "way", id: attrValue(match[1], "id"), tags, geometry });
  }
  return ways;
}

function parcelBbox(lat, lon, radiusM) {
  const dLat = radiusM / 111_320;
  const dLon =
    radiusM / (111_320 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  return {
    south: Math.max(-90, lat - dLat),
    north: Math.min(90, lat + dLat),
    west: Math.max(-180, lon - dLon),
    east: Math.min(180, lon + dLon),
  };
}

async function detectParcels(lat, lon, radiusM, limit) {
  const key = crypto
    .createHash("sha1")
    .update(`${lat.toFixed(4)}|${lon.toFixed(4)}|${radiusM}|${limit}`)
    .digest("hex")
    .slice(0, 20);
  const file = path.join(PARCEL_CACHE_DIR, `${key}.json`);
  const cached = await readJsonCache(file, PARCEL_TTL_MS);
  if (cached) return { ...cached, cache: "server_cache" };

  const bbox = parcelBbox(lat, lon, radiusM);
  const osmUrl = new URL(OSM_MAP_API);
  osmUrl.searchParams.set(
    "bbox",
    `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
  );
  const response = await fetch(osmUrl, {
    headers: {
      Accept: "application/xml",
      "User-Agent":
        "AgroRotateDSS/0.1 (local research prototype; parcel lookup is user-triggered)",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`OSM map API responded ${response.status}`);
  }
  const xml = await response.text();
  const parcels = collectParcels(parseOsmMapXml(xml), { lat, lon }, limit);
  const record = {
    parcels,
    radiusM,
    fetchedAtIso: new Date().toISOString(),
  };
  await fs.mkdir(PARCEL_CACHE_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(record), "utf8");
  return { ...record, cache: "live" };
}

async function handleParcels(request, response, url) {
  const rawLat = url.searchParams.get("lat");
  const rawLon = url.searchParams.get("lon");
  // Number(null) is 0, which would silently turn a missing coordinate into
  // the Gulf of Guinea. Require the parameters to be present and non-empty.
  const lat =
    rawLat === null || rawLat.trim() === "" ? Number.NaN : Number(rawLat);
  const lon =
    rawLon === null || rawLon.trim() === "" ? Number.NaN : Number(rawLon);
  const requestedRadius = Number(url.searchParams.get("radius") ?? 600);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 6);
  const radiusM = Number.isFinite(requestedRadius)
    ? Math.max(50, Math.min(1500, Math.round(requestedRadius)))
    : 600;
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(10, Math.round(requestedLimit)))
    : 6;
  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return sendJson(response, 400, {
      error: "lat and lon must be valid WGS84 coordinates",
    });
  }
  try {
    const result = await detectParcels(lat, lon, radiusM, limit);
    return sendJson(response, 200, {
      parcels: result.parcels,
      count: result.parcels.length,
      radiusM,
      fetchedAtIso: result.fetchedAtIso,
      cache: result.cache,
      source: "OpenStreetMap · OSM map API",
      attribution: "© OpenStreetMap contributors, ODbL · OSM API",
    });
  } catch (error) {
    return sendJson(response, 502, {
      error: "Parcel detection is temporarily unavailable",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getTerrain(analysis) {
  const { centroidLat, centroidLon, bbox, widthM, heightM } = analysis;
  // A 5 × 5 sample grid gives the slope plane, D8 flow directions and a local
  // TWI proxy something real to work with. It remains a screening grid, not a
  // survey-grade DEM map.
  const rows = 5;
  const cols = 5;
  const samplePoints = [];
  for (let row = 0; row < rows; row += 1) {
    const lat = bbox.north - (row / (rows - 1)) * (bbox.north - bbox.south);
    for (let col = 0; col < cols; col += 1) {
      const lon = bbox.west + (col / (cols - 1)) * (bbox.east - bbox.west);
      samplePoints.push({ lat, lon, row, col });
    }
  }
  const cellSizeXm = Math.max(widthM / (cols - 1), 1);
  const cellSizeYm = Math.max(heightM / (rows - 1), 1);
  const key = crypto
    .createHash("sha1")
    .update(
      [
        "terrain-v2",
        rows,
        cols,
        ...samplePoints.map(
          (point) => `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`,
        ),
      ].join(";"),
    )
    .digest("hex")
    .slice(0, 20);
  const file = path.join(TERRAIN_CACHE_DIR, `${key}.json`);
  const cached = await readJsonCache(file, TERRAIN_TTL_MS);
  if (cached) return { ...cached, cache: "server_cache" };

  try {
    const lat = samplePoints.map((point) => point.lat.toFixed(5)).join(",");
    const lon = samplePoints.map((point) => point.lon.toFixed(5)).join(",");
    const url = new URL("https://api.open-meteo.com/v1/elevation");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AgroRotateDSS/0.1",
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok)
      throw new Error(`Open-Meteo elevation responded ${response.status}`);
    const payload = await response.json();
    const rawElevations = Array.isArray(payload.elevation)
      ? payload.elevation
      : [];
    if (rawElevations.length === 0)
      throw new Error("Open-Meteo returned no elevations");
    const elevations = samplePoints.map((_, index) => {
      const value = Number(rawElevations[index]);
      return Number.isFinite(value) ? value : null;
    });
    const metrics = analyseDemGrid(elevations, {
      rows,
      cols,
      cellSizeXm,
      cellSizeYm,
    });
    const finite = elevations.filter((value) => value !== null);
    if (finite.length === 0) throw new Error("No finite elevations returned");
    const meanElevationM =
      metrics.meanElevationM ??
      finite.reduce((sum, value) => sum + value, 0) / finite.length;
    const reliefM =
      metrics.reliefM ?? Math.max(...finite) - Math.min(...finite);
    const record = {
      meanElevationM:
        metrics.meanElevationM ?? Number(meanElevationM.toFixed(1)),
      minElevationM:
        metrics.minElevationM ?? Number(Math.min(...finite).toFixed(1)),
      maxElevationM:
        metrics.maxElevationM ?? Number(Math.max(...finite).toFixed(1)),
      reliefM: metrics.reliefM ?? Number(reliefM.toFixed(1)),
      slopePercent: metrics.slopePercent ?? null,
      slopeDegrees: metrics.slopeDegrees ?? null,
      aspectDeg: metrics.aspectDeg ?? null,
      aspectLabel: metrics.aspectLabel ?? null,
      twi: metrics.twi ?? null,
      twiRange: metrics.twiRange ?? null,
      flowDirection: metrics.flowDirection ?? null,
      flowDirectionLabel: metrics.flowDirectionLabel ?? null,
      flowAccumulationMax: metrics.flowAccumulationMax ?? null,
      flowMetrics: metrics.flowMetrics ?? null,
      complete: metrics.complete ?? null,
      grid: {
        rows,
        cols,
        cellSizeXm: Number(cellSizeXm.toFixed(1)),
        cellSizeYm: Number(cellSizeYm.toFixed(1)),
        pointCount: samplePoints.length,
      },
      slopeMethod:
        metrics.error ??
        `${metrics.caveat} Source: Open-Meteo elevation (Copernicus DEM/SRTM-backed).`,
      samples: samplePoints.map((point, index) => ({
        ...point,
        elevationM: elevations[index],
      })),
      source: "Open-Meteo elevation (Copernicus DEM/SRTM-backed)",
      fetchedAtIso: new Date().toISOString(),
    };
    await fs.mkdir(TERRAIN_CACHE_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(record), "utf8");
    return { ...record, cache: "live" };
  } catch (error) {
    return {
      meanElevationM: null,
      minElevationM: null,
      maxElevationM: null,
      reliefM: null,
      slopePercent: null,
      slopeDegrees: null,
      aspectDeg: null,
      aspectLabel: null,
      twi: null,
      twiRange: null,
      flowDirection: null,
      flowDirectionLabel: null,
      flowAccumulationMax: null,
      flowMetrics: null,
      complete: false,
      grid: null,
      slopeMethod: null,
      samples: [],
      source: "Open-Meteo elevation",
      error: error instanceof Error ? error.message : String(error),
      fetchedAtIso: new Date().toISOString(),
      cache: "none",
    };
  }
}

function defaultWindow(years) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - years);
  start.setUTCDate(start.getUTCDate() + 1);
  const fmt = (date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
      date.getUTCDate(),
    ).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

async function handleFieldAnalyze(request, response) {
  const body = await readJson(request);
  const boundary = body.boundary;
  const badBoundary = validateBoundary(boundary);
  if (badBoundary) return sendJson(response, 400, { error: badBoundary });

  const geometry = analyseBoundary(boundary);
  const years = Math.max(1, Math.min(10, Number(body.years) || 5));
  const window =
    body.start && body.end
      ? { start: body.start, end: body.end }
      : defaultWindow(years);
  if (
    !isIsoDate(window.start) ||
    !isIsoDate(window.end) ||
    window.start >= window.end
  ) {
    return sendJson(response, 400, {
      error: "start and end must be YYYYMMDD with start before end",
    });
  }

  const terrain = await getTerrain(geometry);
  const elevationM =
    terrain.meanElevationM ??
    (typeof body.elevationM === "number" ? body.elevationM : null);
  let power;
  try {
    power = await getPowerRecord({
      latitude: geometry.centroidLat,
      longitude: geometry.centroidLon,
      start: window.start,
      end: window.end,
      force: body.force === true,
    });
  } catch (error) {
    return sendJson(
      response,
      error.status ?? 502,
      error.payload ?? {
        error: "NASA POWER request failed",
        detail: error instanceof Error ? error.message : String(error),
      },
    );
  }

  return sendJson(response, 200, {
    geometry,
    terrain: { ...terrain, elevationMUsed: elevationM },
    climate: {
      raw: power.raw,
      request: power.request,
      fetchedAtIso: power.fetchedAtIso,
      cache: power.cache,
      parameters: POWER_PARAMETERS,
      queryUrl: power.queryUrl,
    },
    request: {
      ...window,
      latitude: geometry.centroidLat,
      longitude: geometry.centroidLon,
      years,
    },
    provenance: [
      {
        feature: "areaHa, perimeterM, bbox",
        source: "WGS84 boundary supplied by the map",
        method: "spherical polygon area and great-circle perimeter",
      },
      {
        feature:
          "meanElevationM, reliefM, slopePercent, aspectDeg, twi, flowDirection",
        source: terrain.source,
        method: terrain.slopeMethod,
        grid: terrain.grid,
        cached: terrain.cache !== "none",
      },
      {
        feature: "POWER climate",
        source: "NASA POWER daily AG",
        method: "server proxy, cached raw response",
        cache: power.cache,
        requestUrl: power.queryUrl,
      },
    ],
    missing: terrain.error ? [`Terrain: ${terrain.error}`] : [],
  });
}

async function handleEo(request, response, url) {
  const body =
    request.method === "POST" ? await readJson(request) : {};
  const boundary = body.boundary;
  const rawLat =
    body.lat ?? (url ? url.searchParams.get("lat") : null);
  const rawLon =
    body.lon ?? (url ? url.searchParams.get("lon") : null);
  const force = body.force === true;
  const soilgridsMode =
    body.soilgrids === "await" ||
    (url ? url.searchParams.get("soilgrids") : null) === "await"
      ? "await"
      : "cache";

  let analysis = null;
  let terrain = null;
  if (Array.isArray(boundary) && boundary.length >= 3) {
    const badBoundary = validateBoundary(boundary);
    if (badBoundary) return sendJson(response, 400, { error: badBoundary });
    analysis = analyseBoundary(boundary);
    terrain = await getTerrain(analysis);
  } else {
    const lat =
      rawLat === null || rawLat === undefined || rawLat === ""
        ? Number.NaN
        : Number(rawLat);
    const lon =
      rawLon === null || rawLon === undefined || rawLon === ""
        ? Number.NaN
        : Number(rawLon);
    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      // No coordinates still returns the product registry, so the Method and
      // Sources pages can render honest statuses before a field is chosen.
      const snapshot = await buildEoSnapshot({ analysis: null, terrain: null });
      return sendJson(response, 200, {
        ...snapshot,
        request: { lat: null, lon: null, boundary: false },
      });
    }
    analysis = {
      centroidLat: Number(lat.toFixed(6)),
      centroidLon: Number(lon.toFixed(6)),
    };
  }

  const snapshot = await buildEoSnapshot({
    analysis,
    terrain,
    force,
    soilgridsMode,
  });
  return sendJson(response, 200, {
    ...snapshot,
    request: {
      lat: analysis?.centroidLat ?? null,
      lon: analysis?.centroidLon ?? null,
      boundary: Boolean(terrain),
    },
  });
}

async function handleEoSoilGrids(request, response, url) {
  const body = request.method === "POST" ? await readJson(request) : {};
  const rawLat = body.lat ?? (url ? url.searchParams.get("lat") : null);
  const rawLon = body.lon ?? (url ? url.searchParams.get("lon") : null);
  const force = body.force === true;

  let lat = Number.NaN;
  let lon = Number.NaN;
  if (Array.isArray(body.boundary) && body.boundary.length >= 3) {
    const badBoundary = validateBoundary(body.boundary);
    if (badBoundary) return sendJson(response, 400, { error: badBoundary });
    const analysis = analyseBoundary(body.boundary);
    lat = analysis.centroidLat;
    lon = analysis.centroidLon;
  } else {
    lat =
      rawLat === null || rawLat === undefined || rawLat === ""
        ? Number.NaN
        : Number(rawLat);
    lon =
      rawLon === null || rawLon === undefined || rawLon === ""
        ? Number.NaN
        : Number(rawLon);
  }

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return sendJson(response, 400, {
      error: "A finite latitude and longitude, or a boundary, is required",
    });
  }

  // Answer from cache immediately; otherwise start the upstream fetch and return
  // a pending marker the browser polls. ISRIC can take tens of seconds, and a
  // single held-open request used to abort in the browser first.
  const cached = force
    ? { status: "pending" }
    : await fetchSoilGrids({ lat, lon, force: false, cacheOnly: true });
  if (!force && (cached.status === "ready" || cached.status === "error")) {
    return sendJson(response, 200, { ...cached, request: { lat, lon } });
  }

  void fetchSoilGrids({ lat, lon, force }).catch(() => {});
  return sendJson(response, 200, {
    status: "pending",
    lat,
    lon,
    layers: [],
    derived: null,
    source: "ISRIC SoilGrids 250 m v2.0 · REST API",
    fetchedAtIso: null,
    cache: "none",
    retryAfterMs: 4000,
    note: "The mapped priors are being fetched. Poll again in a few seconds.",
    request: { lat, lon },
  });
}

function fieldKey(value) {
  const clean = String(value ?? "field-01")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return clean || "field-01";
}

async function handlePlanSync(request, response) {
  const body = await readJson(request);
  if (!body || typeof body !== "object" || !body.plan || !body.field) {
    return sendJson(response, 400, {
      error: "A full workspace object is required",
    });
  }

  const id = fieldKey(body.field.name || `field-${body.field.areaHa ?? "x"}`);
  const revisionId = crypto.randomUUID();
  const syncedAtIso = new Date().toISOString();
  const record = {
    fieldId: id,
    revisionId,
    syncedAtIso,
    state: body,
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `plan-${id}.json`),
    JSON.stringify(record, null, 2),
    "utf8",
  );

  return sendJson(response, 200, {
    synced: true,
    revisionId,
    syncedAtIso,
    fieldId: id,
    storage: "server",
    message: `Saved on this machine as plan-${id}.json (revision ${revisionId.slice(0, 8)}).`,
  });
}

async function handlePlanGet(response, fieldId) {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, `plan-${fieldKey(fieldId)}.json`),
      "utf8",
    );
    return sendJson(response, 200, JSON.parse(raw));
  } catch {
    return sendJson(response, 404, { error: "No saved plan for that field" });
  }
}

async function handleAiChoose(request, response) {
  const body = await readJson(request, 4 * 1024 * 1024);
  if (!body || typeof body !== "object") {
    return sendJson(response, 400, {
      error: "A structured workspace context is required",
    });
  }
  try {
    const result = await buildAiChooseResponse(body);
    return sendJson(response, 200, result);
  } catch (error) {
    return sendJson(response, 500, {
      error: "The AI choose endpoint could not read this context",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleOptimize(request, response) {
  const body = await readJson(request, 8 * 1024 * 1024);
  if (!body || typeof body !== "object") {
    return sendJson(response, 400, { error: "A valid workspace state is required" });
  }
  try {
    const workspace = body.workspace ?? body;
    const result = optimizeWorkspace(workspace);
    return sendJson(response, 200, result);
  } catch (error) {
    return sendJson(response, 500, {
      error: "Optimization failure",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

const server = http.createServer(async (request, response) => {
  setCors(request, response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/v1/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "agrorotate-local-api",
        version: "v5",
        ai: {
          mode: "grounded_rules",
          trainedRanker: false,
          modelPath: null,
        },
        time: new Date().toISOString(),
      });
    }
    if (request.method === "POST" && url.pathname === "/api/v1/context") {
      return await handleContext(request, response);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/geocode") {
      return await handleGeocode(request, response, url);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/parcels") {
      return await handleParcels(request, response, url);
    }
    if (request.method === "POST" && url.pathname === "/api/v1/field/analyze") {
      return await handleFieldAnalyze(request, response);
    }
    if (request.method === "POST" && url.pathname === "/api/v1/plans/sync") {
      return await handlePlanSync(request, response);
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/v1/plans/")) {
      return await handlePlanGet(response, url.pathname.split("/").pop());
    }
    if (request.method === "POST" && (url.pathname === "/api/v1/optimize" || url.pathname === "/api/v1/ai/optimize")) {
      return await handleOptimize(request, response);
    }
    if (request.method === "POST" && url.pathname === "/api/v1/ai/choose") {
      return await handleAiChoose(request, response);
    }
    if (
      (request.method === "GET" || request.method === "POST") &&
      url.pathname === "/api/v1/eo"
    ) {
      return await handleEo(request, response, url);
    }
    if (
      (request.method === "GET" || request.method === "POST") &&
      url.pathname === "/api/v1/eo/soilgrids"
    ) {
      return await handleEoSoilGrids(request, response, url);
    }
    return sendJson(response, 404, { error: "Unknown endpoint" });
  } catch (error) {
    return sendJson(response, 500, {
      error: "Unhandled server error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

await ensureDirs();
const PIPE = process.env.PIPE_NAME || process.env.SOCKET_PATH;
if (PIPE) {
  server.listen(PIPE, () => {
    console.log(`AgroRotate local API on pipe ${PIPE}`);
    console.log(`Data:  ${DATA_DIR}`);
    console.log(`Cache: ${CACHE_DIR}`);
  });
} else {
  server.listen(PORT, HOST, () => {
    console.log(`AgroRotate local API on http://${HOST}:${PORT}`);
    console.log(`Data:  ${DATA_DIR}`);
    console.log(`Cache: ${CACHE_DIR}`);
  });
}
