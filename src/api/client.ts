import type {
  ClimateDay,
  ClimateSummary,
  WorkspaceState,
} from "../state/model";
import type { BoundingBox, PolygonMetrics } from "../components/FieldMap";
// Static import: a dynamic import here produced "Failed to fetch dynamically
// imported module" on some reloads and silently dropped every climate value.
import { summarisePower } from "../engine/climate";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

export interface ClimateResult {
  summary: ClimateSummary;
  sample: ClimateDay[];
  fetchedAtIso: string;
  cache: "server_cache" | "live";
  origin: "backend" | "nasa_direct";
  request: { start: string; end: string; latitude: number; longitude: number };
}

export interface PlaceResult {
  label: string;
  lat: number;
  lon: number;
  type?: string | null;
  category?: string | null;
  importance?: number | null;
  bbox?: number[] | null;
  source?: "backend" | "browser_fallback" | "browser_geolocation";
}

export interface TerrainResult {
  meanElevationM: number | null;
  reliefM: number | null;
  slopePercent: number | null;
  slopeMethod: string | null;
  samples: { lat: number; lon: number; elevationM: number | null }[];
  source: string;
  error?: string;
  fetchedAtIso: string;
  cache: "server_cache" | "live" | "none";
  elevationMUsed?: number | null;
}

export interface FieldAnalysis {
  geometry: PolygonMetrics & { bbox: BoundingBox };
  terrain: TerrainResult;
  climate: {
    raw: unknown;
    request: {
      start: string;
      end: string;
      latitude: number;
      longitude: number;
      parameters: string[];
    };
    fetchedAtIso: string;
    cache: "server_cache" | "live";
    queryUrl: string;
  };
  request: {
    start: string;
    end: string;
    latitude: number;
    longitude: number;
    years: number;
  };
  provenance: unknown[];
  missing: string[];
}

export interface EoSoilDepth {
  label: string;
  topDepth: number;
  bottomDepth: number;
  mean: number | null;
  uncertainty: number | null;
}

export interface EoSoilLayer {
  key: string;
  label: string;
  unit: string;
  mappedUnit: string | null;
  targetUnit: string | null;
  depths: EoSoilDepth[];
  topsoil030: number | null;
  rootZone0100: number | null;
  topsoilUncertainty: number | null;
}

export interface EoSoilDerived {
  textureClass: string | null;
  fieldCapacityPct: number | null;
  wiltingPointPct: number | null;
  availableWaterPct: number | null;
  ph: number | null;
  organicCarbonPct: number | null;
  cecCmolKg: number | null;
  bulkDensityGCm3: number | null;
  coarseFragmentsPct: number | null;
}

export interface EoSoilGrids {
  status?: "ready" | "pending" | "error";
  error?: string;
  note?: string;
  type?: string;
  lat: number | null;
  lon: number | null;
  queryUrl: string | null;
  fetchedAtIso: string | null;
  layers: EoSoilLayer[];
  derived: EoSoilDerived | null;
  caveat?: string;
  source?: string;
  cache?: "server_cache" | "live" | "none";
  /** Present while a background fetch is running; how long to wait before polling. */
  retryAfterMs?: number;
}

export interface EoTerrain {
  meanElevationM: number | null;
  minElevationM: number | null;
  maxElevationM: number | null;
  reliefM: number | null;
  slopePercent: number | null;
  slopeDegrees: number | null;
  aspectDeg: number | null;
  aspectLabel: string | null;
  twi: number | null;
  twiRange: [number, number] | null;
  flowDirection: number | null;
  flowDirectionLabel: string | null;
  flowAccumulationMax: number | null;
  flowMetrics: {
    method: string;
    cellAreaM2: number | null;
    contourWidthM: number | null;
  } | null;
  complete: boolean | null;
  grid: {
    rows: number;
    cols: number;
    cellSizeXm: number;
    cellSizeYm: number;
    pointCount: number;
  } | null;
  source: string | null;
  slopeMethod: string | null;
  cache: "server_cache" | "live" | "none" | null;
  fetchedAtIso: string | null;
}

export interface EoProduct {
  id: string;
  name: string;
  provider: string;
  resolution: string;
  cadence: string;
  role: string;
  caveat: string;
  status: "live" | "visual" | "token";
  numeric: "live" | "token";
  numericStatus: "live" | "token_required" | "token_configured";
  gibs: {
    id: string;
    matrix: string;
    maxNativeZoom: number;
    label: string;
  }[];
  docsUrl: string;
  detail: string;
  values: {
    meanElevationM: number | null;
    reliefM: number | null;
    slopePercent: number | null;
    slopeDegrees: number | null;
    aspectDeg: number | null;
    aspectLabel: string | null;
    twi: number | null;
    twiRange: [number, number] | null;
    flowDirection: number | null;
    flowDirectionLabel: string | null;
  } | null;
}

export interface EoSnapshot {
  asOfIso: string;
  gibsBase: string;
  earthdata: {
    configured: boolean;
    mode: "bearer_token" | "basic_auth" | "netrc" | "none";
    source: string;
    note: string;
  };
  products: EoProduct[];
  soilgrids: EoSoilGrids | null;
  terrain: EoTerrain | null;
  limitations: string[];
  request?: {
    lat: number | null;
    lon: number | null;
    boundary: boolean;
  };
}

/**
 * One field's EO context: live SoilGrids priors, SRTM terrain metrics, the
 * GIBS product registry and the server's Earthdata-token status. The response
 * never contains a credential.
 */
export async function fetchEoContext(options: {
  boundary?: { lat: number; lon: number }[];
  lat?: number | null;
  lon?: number | null;
  force?: boolean;
} = {}): Promise<EoSnapshot> {
  const response = await fetch(`${API_BASE}/eo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      boundary: options.boundary?.length ? options.boundary : undefined,
      lat: options.lat ?? undefined,
      lon: options.lon ?? undefined,
      force: Boolean(options.force),
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Earth-observation API responded ${response.status}${
        detail ? `: ${detail.slice(0, 160)}` : ""
      }`,
    );
  }
  return (await response.json()) as EoSnapshot;
}

/**
 * SoilGrids is the slowest public call (ISRIC can take ~30 s on the first
 * full-property query). The unified snapshot returns it from cache when it can
 * and leaves a `pending` marker otherwise, so this separate route can finish
 * without holding up terrain or the product registry.
 */
export async function fetchEoSoilGrids(options: {
  lat?: number | null;
  lon?: number | null;
  boundary?: { lat: number; lon: number }[];
  force?: boolean;
} = {}): Promise<EoSoilGrids> {
  const body = JSON.stringify({
    boundary: options.boundary?.length ? options.boundary : undefined,
    lat: options.lat ?? undefined,
    lon: options.lon ?? undefined,
    force: Boolean(options.force),
  });
  const ask = async (): Promise<EoSoilGrids> => {
    const response = await fetch(`${API_BASE}/eo/soilgrids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `SoilGrids request failed: ${response.status}${
          detail ? ` — ${detail.slice(0, 200)}` : ""
        }`,
      );
    }
    return (await response.json()) as EoSoilGrids;
  };

  // The server answers from cache or with a `pending` marker and keeps fetching
  // upstream, so poll briefly instead of holding one long request open.
  const deadline = Date.now() + 30_000;
  let result = await ask();
  while (result.status === "pending" && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, result.retryAfterMs ?? 4000));
    result = await ask();
  }
  return result;
}

async function geocodeFallback(
  query: string,
  limit: number,
): Promise<PlaceResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("q", query);
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Place search responded ${response.status}`);
  const rows = (await response.json()) as {
    display_name?: string;
    lat?: string;
    lon?: string;
    type?: string;
    class?: string;
    importance?: number;
    boundingbox?: string[];
  }[];
  return rows
    .filter((row) => row.lat && row.lon)
    .map((row) => ({
      label: row.display_name ?? query,
      lat: Number(row.lat),
      lon: Number(row.lon),
      type: row.type ?? null,
      category: row.class ?? null,
      importance: row.importance ?? null,
      bbox: row.boundingbox?.map(Number) ?? null,
      source: "browser_fallback" as const,
    }));
}

/** Explicit, user-triggered search. No autocomplete: the public policy forbids it. */
export async function searchPlaces(
  query: string,
  limit = 5,
): Promise<PlaceResult[]> {
  try {
    const response = await fetch(
      `${API_BASE}/geocode?q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: { Accept: "application/json" } },
    );
    if (response.ok) {
      const data = (await response.json()) as { places: PlaceResult[] };
      return (data.places ?? []).map((place) => ({
        ...place,
        source: "backend" as const,
      }));
    }
    throw new Error(`Geocode API responded ${response.status}`);
  } catch {
    // Offline fallback. The backend remains the normal path and keeps the
    // User-Agent + cache policy there.
    return geocodeFallback(query, limit);
  }
}

export interface DetectedParcel {
  id: string;
  label: string;
  areaHa: number;
  lat: number;
  lon: number;
  distanceM: number;
  landuse: string | null;
  vertices: { lat: number; lon: number }[];
  source: "backend" | "browser_fallback";
}

interface OverpassElement {
  type?: string;
  id?: number;
  tags?: Record<string, string | undefined>;
  geometry?: { lat: number; lon: number }[];
  members?: {
    type?: string;
    role?: string;
    geometry?: { lat: number; lon: number }[];
  }[];
}

function parcelAreaHa(vertices: { lat: number; lon: number }[]): number {
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

function parcelDistanceM(
  origin: { lat: number; lon: number },
  target: { lat: number; lon: number },
): number {
  const R = 6_371_008.8;
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(target.lat - origin.lat);
  const dLon = rad(target.lon - origin.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(origin.lat)) *
      Math.cos(rad(target.lat)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function mapOverpassParcels(
  elements: OverpassElement[] | undefined,
  lat: number,
  lon: number,
  limit: number,
): DetectedParcel[] {
  const origin = { lat, lon };
  const parcels: DetectedParcel[] = [];
  for (const element of Array.isArray(elements) ? elements : []) {
    const tags = element.tags ?? {};
    let vertices: { lat: number; lon: number }[] = [];
    if (element.type === "way" && Array.isArray(element.geometry)) {
      vertices = element.geometry;
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
      if (outers[0]?.geometry) vertices = outers[0].geometry;
    }
    if (vertices.length < 3 || vertices.length > 800) continue;
    const areaHa = parcelAreaHa(vertices);
    if (!(areaHa >= 0.02 && areaHa <= 2000)) continue;
    const centroid = {
      lat: vertices.reduce((sum, vertex) => sum + vertex.lat, 0) / vertices.length,
      lon: vertices.reduce((sum, vertex) => sum + vertex.lon, 0) / vertices.length,
    };
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
      distanceM: Math.round(parcelDistanceM(origin, centroid)),
      landuse,
      vertices: vertices.map((vertex) => ({
        lat: Number(vertex.lat.toFixed(7)),
        lon: Number(vertex.lon.toFixed(7)),
      })),
      source: "browser_fallback",
    });
  }
  const seen = new Set<string>();
  return parcels
    .filter((parcel) => {
      if (seen.has(parcel.id)) return false;
      seen.add(parcel.id);
      return true;
    })
    .sort((a, b) => a.distanceM - b.distanceM || b.areaHa - a.areaHa)
    .slice(0, limit);
}

async function parcelsFallback(
  lat: number,
  lon: number,
  limit: number,
  radiusM: number,
): Promise<DetectedParcel[]> {
  const dLat = radiusM / 111_320;
  const dLon =
    radiusM / (111_320 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  const response = await fetch(
    `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`,
    {
      headers: { Accept: "application/xml" },
      signal: AbortSignal.timeout(25_000),
    },
  );
  if (!response.ok) {
    throw new Error(`OSM map API responded ${response.status}`);
  }
  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const nodes = new Map<string, { lat: number; lon: number }>();
  doc.querySelectorAll("node").forEach((node) => {
    const id = node.getAttribute("id");
    const nodeLat = Number(node.getAttribute("lat"));
    const nodeLon = Number(node.getAttribute("lon"));
    if (id && Number.isFinite(nodeLat) && Number.isFinite(nodeLon)) {
      nodes.set(id, { lat: nodeLat, lon: nodeLon });
    }
  });

  const elements: OverpassElement[] = [];
  doc.querySelectorAll("way").forEach((way) => {
    const tags: Record<string, string> = {};
    way.querySelectorAll("tag").forEach((tag) => {
      const key = tag.getAttribute("k");
      const value = tag.getAttribute("v");
      if (key && value !== null) tags[key] = value;
    });
    if (!/^(farmland|field|orchard|vineyard|meadow)$/.test(tags.landuse ?? "")) {
      return;
    }
    const geometry: { lat: number; lon: number }[] = [];
    way.querySelectorAll("nd").forEach((nd) => {
      const point = nodes.get(nd.getAttribute("ref") ?? "");
      if (point) geometry.push(point);
    });
    if (geometry.length < 3) return;
    elements.push({
      type: "way",
      id: Number(way.getAttribute("id")),
      tags,
      geometry,
    });
  });
  return mapOverpassParcels(elements, lat, lon, limit);
}

/**
 * Candidate field outlines mapped in OpenStreetMap near a place. This is a
 * suggestion from public map data, never a surveyed boundary: the corners stay
 * editable and the UI says where they came from.
 */
export async function searchParcels(
  lat: number,
  lon: number,
  limit = 6,
  radiusM = 600,
): Promise<DetectedParcel[]> {
  try {
    const response = await fetch(
      `${API_BASE}/parcels?lat=${lat}&lon=${lon}&radius=${radiusM}&limit=${limit}`,
      { headers: { Accept: "application/json" } },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        parcels?: Omit<DetectedParcel, "source">[];
      };
      return (data.parcels ?? []).map((parcel) => ({
        ...parcel,
        source: "backend" as const,
      }));
    }
    throw new Error(`Parcel API responded ${response.status}`);
  } catch {
    return parcelsFallback(lat, lon, limit, radiusM);
  }
}

/** One call returns geometry, terrain and the cached POWER payload. */
export async function analyzeField(
  boundary: { lat: number; lon: number }[],
  options: { years?: number; force?: boolean; elevationM?: number | null } = {},
): Promise<FieldAnalysis> {
  const response = await fetch(`${API_BASE}/field/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      boundary,
      years: options.years ?? 5,
      elevationM: options.elevationM ?? null,
      force: Boolean(options.force),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Field analysis responded ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`,
    );
  }
  return (await response.json()) as FieldAnalysis;
}

function yyyymmdd(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function defaultClimateWindow(years = 3): {
  start: string;
  end: string;
} {
  const end = new Date();
  end.setDate(end.getDate() - 3); // POWER daily data lag
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - years);
  start.setDate(start.getDate() + 1);
  return { start: yyyymmdd(start), end: yyyymmdd(end) };
}

async function fetchDirectFromPower(
  latitude: number,
  longitude: number,
  start: string,
  end: string,
): Promise<unknown> {
  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.searchParams.set(
    "parameters",
    "T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR",
  );
  url.searchParams.set("community", "AG");
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("format", "JSON");
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NASA POWER responded ${response.status}`);
  }
  return response.json();
}

/**
 * Requests the live agro-climatology window for a field. Uses the local API
 * (cached + reproducible metadata) and falls back to a direct POWER request so
 * the app keeps working with no backend.
 */
export async function fetchClimateContext(
  latitude: number,
  longitude: number,
  options: { years?: number; force?: boolean; elevationM?: number | null } = {},
): Promise<ClimateResult> {
  const window = defaultClimateWindow(options.years ?? 3);
  const body = {
    latitude,
    longitude,
    start: window.start,
    end: window.end,
    elevationM: options.elevationM ?? null,
    force: Boolean(options.force),
  };

  try {
    const response = await fetch(`${API_BASE}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok)
      throw new Error(`Context API responded ${response.status}`);
    const data = (await response.json()) as {
      raw: unknown;
      fetchedAtIso: string;
      cache: "server_cache" | "live";
      request: {
        start: string;
        end: string;
        latitude: number;
        longitude: number;
      };
    };
    // The API caches the raw POWER payload; the single climate implementation
    // lives in the front-end engine so both paths produce identical numbers.
    const normalised = summarisePower(
      data.raw,
      latitude,
      longitude,
      options.elevationM ?? null,
    );
    if (!normalised)
      throw new Error("NASA POWER returned no usable daily records");
    return {
      summary: normalised.summary,
      sample: normalised.sample,
      fetchedAtIso: data.fetchedAtIso,
      cache: data.cache,
      origin: "backend",
      request: data.request,
    };
  } catch {
    // Offline / no backend: call POWER directly from the browser.
  }

  const raw = await fetchDirectFromPower(
    latitude,
    longitude,
    window.start,
    window.end,
  );
  const normalised = summarisePower(
    raw,
    latitude,
    longitude,
    options.elevationM ?? null,
  );
  if (!normalised)
    throw new Error("NASA POWER returned no usable daily records");
  return {
    summary: normalised.summary,
    sample: normalised.sample,
    fetchedAtIso: new Date().toISOString(),
    cache: "live",
    origin: "nasa_direct",
    request: { start: window.start, end: window.end, latitude, longitude },
  };
}

export interface SyncResult {
  synced: boolean;
  revisionId: string;
  syncedAtIso: string;
  storage: "server" | "local";
  message: string;
}

export async function syncPlan(state: WorkspaceState): Promise<SyncResult> {
  try {
    const response = await fetch(`${API_BASE}/plans/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error(`Sync responded ${response.status}`);
    const data = (await response.json()) as SyncResult;
    return { ...data, storage: "server" };
  } catch {
    return {
      synced: false,
      revisionId: `local-${Date.now()}`,
      syncedAtIso: new Date().toISOString(),
      storage: "local",
      message:
        "The local API is not reachable, so the plan stays saved in this browser only.",
    };
  }
}

export async function checkBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}
