import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "leaflet/dist/leaflet.css";
import type { BoundaryPoint } from "../state/model";
import {
  searchParcels,
  searchPlaces,
  type DetectedParcel,
  type PlaceResult,
} from "../api/client";
import { SproutLoader } from "../ui/SproutLoader";
import { EO_OVERLAYS } from "../data/eo";

const EARTH_RADIUS_M = 6_371_008.8;
const METERS_PER_DEG_LAT = 110_574;

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface PolygonMetrics {
  areaHa: number;
  areaM2: number;
  perimeterM: number;
  centroidLat: number;
  centroidLon: number;
  bbox: BoundingBox | null;
  widthM: number;
  heightM: number;
  vertexCount: number;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Great-circle distance between two WGS84 points, in metres. */
export function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Spherical polygon area on a sphere, not a percentage of a screen rectangle.
 * This is accurate at field scale and does not require a heavy GIS dependency.
 */
export function sphericalAreaM2(points: BoundaryPoint[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const lat1 = toRadians(current.lat);
    const lat2 = toRadians(next.lat);
    const dLon = toRadians(next.lon - current.lon);
    sum += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Area-weighted centroid in local metres, then converted back to WGS84. */
function polygonCentroid(points: BoundaryPoint[]): { lat: number; lon: number } {
  if (points.length === 0) return { lat: 0, lon: 0 };
  if (points.length < 3) {
    return {
      lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
      lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
    };
  }
  const meanLat =
    points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const meanLon =
    points.reduce((sum, point) => sum + point.lon, 0) / points.length;
  const metersPerDegLon = 111_320 * Math.cos(toRadians(meanLat));
  let twiceArea = 0;
  let xMoment = 0;
  let yMoment = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const x1 = (current.lon - meanLon) * metersPerDegLon;
    const y1 = (current.lat - meanLat) * METERS_PER_DEG_LAT;
    const x2 = (next.lon - meanLon) * metersPerDegLon;
    const y2 = (next.lat - meanLat) * METERS_PER_DEG_LAT;
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    xMoment += (x1 + x2) * cross;
    yMoment += (y1 + y2) * cross;
  }
  if (Math.abs(twiceArea) < 1e-9) return { lat: meanLat, lon: meanLon };
  return {
    lat: meanLat + yMoment / (3 * twiceArea) / METERS_PER_DEG_LAT,
    lon: meanLon + xMoment / (3 * twiceArea) / metersPerDegLon,
  };
}

export function polygonMetrics(points: BoundaryPoint[]): PolygonMetrics {
  if (points.length === 0) {
    return {
      areaHa: 0,
      areaM2: 0,
      perimeterM: 0,
      centroidLat: 0,
      centroidLon: 0,
      bbox: null,
      widthM: 0,
      heightM: 0,
      vertexCount: 0,
    };
  }
  const centroid = polygonCentroid(points);
  let perimeter = 0;
  for (let index = 0; index < points.length; index += 1) {
    perimeter += haversineMeters(points[index], points[(index + 1) % points.length]);
  }
  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lons);
  const east = Math.max(...lons);
  const widthM = haversineMeters(
    { lat: centroid.lat, lon: west },
    { lat: centroid.lat, lon: east },
  );
  const heightM = haversineMeters(
    { lat: south, lon: centroid.lon },
    { lat: north, lon: centroid.lon },
  );
  const areaM2 = sphericalAreaM2(points);
  return {
    areaHa: areaM2 / 10_000,
    areaM2,
    perimeterM: perimeter,
    centroidLat: centroid.lat,
    centroidLon: centroid.lon,
    bbox: { south, west, north, east },
    widthM,
    heightM,
    vertexCount: points.length,
  };
}

const GIBS_WMTS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";

/** Clear base maps under the NASA GIBS overlay. */
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * GIBS WMTS tiles are pre-rendered in the same Web Mercator grid Leaflet
 * uses. Requesting them as WMS instead re-projects every 256 px request on
 * the server, and the per-request bbox rounding draws a visible grid over
 * the imagery. The WMTS matrix has no seams.
 */
function gibsTileUrl(layer: string, matrix: string, extension: string, time: string) {
  return `${GIBS_WMTS}/${layer}/default/${time}/${matrix}/{z}/{y}/{x}.${extension}`;
}

/**
 * One GIBS product is visible at a time. The layers are rendered imagery, not
 * numbers the engine can read: switching products changes the context picture
 * and nothing in the decision model.
 */

/**
 * The map opens on Dina Farms (Beheira, Cairo–Alexandria desert road), a
 * well-known Egyptian farm, purely as a place to start looking. Nothing is
 * selected: no marker, no polygon and no field record until the visitor
 * searches or draws.
 */
const DEFAULT_VIEW = {
  lat: 30.2828488,
  lon: 30.6079612,
  label: "Dina Farms, Beheira",
};

function ringToPoints(ring: L.LatLng[]): BoundaryPoint[] {
  return ring.map((latlng, index) => ({
    id: `v-${index}-${latlng.lat.toFixed(6)}-${latlng.lng.toFixed(6)}`,
    lat: Number(latlng.lat.toFixed(6)),
    lon: Number(latlng.lng.toFixed(6)),
    xPct: 0,
    yPct: 0,
  }));
}

export function FieldMap({
  points,
  onChange,
  onPlaceSelected,
  onBoundaryCommitted,
  onRequestAnalysis,
  climateLoading = false,
  hasClimate = false,
}: {
  points: BoundaryPoint[];
  onChange: (points: BoundaryPoint[]) => void;
  onPlaceSelected?: (place: PlaceResult) => void;
  onBoundaryCommitted?: (points: BoundaryPoint[]) => void;
  onRequestAnalysis?: () => void;
  climateLoading?: boolean;
  hasClimate?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const satelliteRef = useRef<L.TileLayer | null>(null);
  const streetRef = useRef<L.TileLayer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const pointsRef = useRef(points);
  const onChangeRef = useRef(onChange);
  const onPlaceRef = useRef(onPlaceSelected);
  const onBoundaryRef = useRef(onBoundaryCommitted);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState(14);
  const [baseKind, setBaseKind] = useState<"satellite" | "street">("satellite");
  const [overlayId, setOverlayId] = useState<string>("modis16");
  const [overlayOpacity, setOverlayOpacity] = useState(45);
  const [mapGeneration, setMapGeneration] = useState(0);
  const [detectingParcels, setDetectingParcels] = useState(false);
  const [parcelNotice, setParcelNotice] = useState<string | null>(null);
  const [parcels, setParcels] = useState<DetectedParcel[]>([]);
  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);
  const [center, setCenter] = useState(() => {
    const metrics = polygonMetrics(points);
    return {
      lat: metrics.centroidLat || DEFAULT_VIEW.lat,
      lon: metrics.centroidLon || DEFAULT_VIEW.lon,
    };
  });

  pointsRef.current = points;
  onChangeRef.current = onChange;
  onPlaceRef.current = onPlaceSelected;
  onBoundaryRef.current = onBoundaryCommitted;

  const commitLayer = (layer: L.Polygon) => {
    const raw = layer.getLatLngs();
    const ring = (Array.isArray(raw[0]) ? raw[0] : raw) as L.LatLng[];
    const next = ringToPoints(ring);
    onChangeRef.current(next);
    onBoundaryRef.current?.(next);
  };

  // Create the map once. Leaflet owns the DOM after mount; React only supplies
  // data and callbacks.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initial = polygonMetrics(pointsRef.current);
    const map = L.map(containerRef.current, {
      center: [initial.centroidLat || DEFAULT_VIEW.lat, initial.centroidLon || DEFAULT_VIEW.lon],
      // Open close enough to read fields and roads, like a normal map app.
      // The GIBS overlay sits above the base as a soft, switchable product.
      zoom: initial.centroidLat ? 15 : 14,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      // Instant zoom avoids a stuck Leaflet zoom animation swallowing every
      // later zoomIn/zoomOut after fitBounds runs during mount.
      zoomAnimation: false,
    });
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    // Zoom is supplied by the overlay control below: it calls map.zoomIn/out
    // directly and keeps the z readout in the same place the visitor clicks.
    L.control.scale({ position: "bottomleft", imperial: false, maxWidth: 150 }).addTo(map);
    setZoom(map.getZoom());

    satelliteRef.current = L.tileLayer(SATELLITE_TILE_URL, {
      maxNativeZoom: 19,
      maxZoom: 19,
      zIndex: 1,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    }).addTo(map);

    streetRef.current = L.tileLayer(STREET_TILE_URL, {
      maxNativeZoom: 19,
      maxZoom: 19,
      zIndex: 1,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    map.pm.setGlobalOptions({
      snappable: false,
      allowSelfIntersection: false,
      finishOn: "dblclick",
      templineStyle: { color: "#7dffb2", weight: 2 },
      hintlineStyle: { color: "#7dffb2", dashArray: "4 5", weight: 1 },
      pathOptions: {
        color: "#7dffb2",
        weight: 2,
        fillColor: "#7dffb2",
        fillOpacity: 0.12,
      },
    });

    const attachLayer = (layer: L.Polygon) => {
      layer.on("pm:update pm:edit pm:markerdragend", () => {
        commitLayer(layer);
      });
      layer.on("pm:remove", () => {
        if (polygonRef.current === layer) polygonRef.current = null;
        onChangeRef.current([]);
        onBoundaryRef.current?.([]);
      });
    };

    map.on("pm:create", (event) => {
      const layer = event.layer as L.Polygon;
      if (polygonRef.current && polygonRef.current !== layer) {
        map.removeLayer(polygonRef.current);
      }
      polygonRef.current = layer;
      attachLayer(layer);
      layer.bringToFront();
      setDrawing(false);
      // A drawn outline replaces any suggestion from the map data.
      setParcels([]);
      setParcelNotice(null);
      setActiveParcelId(null);
      commitLayer(layer);
    });

    map.on("pm:drawstart", () => {
      drawingRef.current = true;
      setDrawing(true);
    });
    map.on("pm:drawend", () => {
      drawingRef.current = false;
      setDrawing(false);
    });
    // Clicking the first vertex closes the ring. `finishDraw` only completes a
    // valid geometry, so it is safe to call on any vertex click during drawing.
    map.on("pm:vertexclick", () => {
      if (!drawingRef.current) return;
      map.pm.finishDraw();
    });
    map.on("pm:globaleditmodetoggled", (event) => setEditing(Boolean(event.enabled)));
    map.on("moveend", () => {
      const currentCenter = map.getCenter();
      setCenter({ lat: currentCenter.lat, lon: currentCenter.lng });
    });
    map.on("zoomend", () => setZoom(map.getZoom()));

    if (pointsRef.current.length >= 3) {
      const layer = L.polygon(
        pointsRef.current.map((point) => [point.lat, point.lon] as [number, number]),
        { color: "#7dffb2", weight: 2, fillColor: "#7dffb2", fillOpacity: 0.12 },
      ).addTo(map);
      polygonRef.current = layer;
      attachLayer(layer);
      layer.bringToFront();
      const bounds = L.latLngBounds(
        pointsRef.current.map((point) => [point.lat, point.lon] as [number, number]),
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.35), { maxZoom: 18, animate: false });
      }
    }
    // StrictMode mounts, cleans up and mounts again. The generation counter
    // makes the overlay effect run against the new Leaflet instance.
    setMapGeneration((value) => value + 1);

    return () => {
      map.remove();
      mapRef.current = null;
      polygonRef.current = null;
      satelliteRef.current = null;
      streetRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // Base map choice is switched without rebuilding the map, so the drawn
  // polygon and its edit handles stay untouched.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const satellite = satelliteRef.current;
    const street = streetRef.current;
    if (!satellite || !street) return;
    if (baseKind === "satellite") {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [baseKind]);

  // One GIBS overlay at a time. It is rendered imagery, never a numeric layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }
    if (overlayId === "none") return;
    const overlay = EO_OVERLAYS.find((candidate) => candidate.id === overlayId);
    if (!overlay) return;
    const layer = L.tileLayer(
      gibsTileUrl(overlay.layer, overlay.matrix, overlay.extension, "default"),
      {
        maxNativeZoom: overlay.maxNativeZoom,
        maxZoom: 19,
        zIndex: 2,
        opacity: overlayOpacity / 100,
        crossOrigin: true,
        attribution: overlay.attribution,
      },
    ).addTo(map);
    overlayRef.current = layer;
    polygonRef.current?.bringToFront();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayId, mapGeneration]);

  useEffect(() => {
    overlayRef.current?.setOpacity(overlayOpacity / 100);
  }, [overlayOpacity]);

  // Synchronise workspace geometry into Leaflet when a saved plan, reset or
  // saved plan or field data changes the map geometry.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (points.length < 3) {
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      return;
    }
    const latlngs = points.map((point) => [point.lat, point.lon] as [number, number]);
    if (!polygonRef.current) {
      const layer = L.polygon(latlngs, {
        color: "#7dffb2",
        weight: 2,
        fillColor: "#7dffb2",
        fillOpacity: 0.12,
      }).addTo(map);
      layer.on("pm:update pm:edit pm:markerdragend", () => commitLayer(layer));
      layer.on("pm:remove", () => {
        if (polygonRef.current === layer) polygonRef.current = null;
        onChangeRef.current([]);
        onBoundaryRef.current?.([]);
      });
      polygonRef.current = layer;
      layer.bringToFront();
    } else {
      polygonRef.current.setLatLngs(latlngs);
      polygonRef.current.bringToFront();
    }
  }, [points]);

  const applyParcel = (parcel: DetectedParcel) => {
    const next = parcel.vertices.map((vertex, index) => ({
      id: `osm-${parcel.id.replace(/[^a-z0-9]+/gi, "-")}-${index}`,
      lat: Number(vertex.lat.toFixed(6)),
      lon: Number(vertex.lon.toFixed(6)),
      xPct: 0,
      yPct: 0,
    }));
    onChangeRef.current(next);
    setActiveParcelId(parcel.id);
    const map = mapRef.current;
    if (map) {
      const bounds = L.latLngBounds(
        next.map((point) => [point.lat, point.lon] as [number, number]),
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.35), { maxZoom: 18, animate: false });
      }
    }
  };

  const detectParcels = async (place: PlaceResult) => {
    setDetectingParcels(true);
    setParcelNotice(null);
    setParcels([]);
    setActiveParcelId(null);
    try {
      const found = await searchParcels(place.lat, place.lon, 6, 600);
      setParcels(found);
      if (found.length > 0) {
        applyParcel(found[0]);
        setParcelNotice(
          `${found.length} mapped field outline${
            found.length === 1 ? "" : "s"
          } near this place (OpenStreetMap). Using the closest, ${
            found[0].areaHa.toFixed(2)
          } ha — check the corners before saving.`,
        );
      } else {
        setParcelNotice(
          "No mapped field outline here. Draw the parcel or type its area — nothing is guessed.",
        );
      }
    } catch {
      setParcelNotice(
        "Parcel detection is unavailable right now. Draw the parcel or type its area — nothing is guessed.",
      );
    } finally {
      setDetectingParcels(false);
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const places = await searchPlaces(query.trim(), 5);
      if (places.length === 0) {
        setSearchError("No place found. Try a village, district or landmark.");
      } else {
        setResults(places);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Place search failed");
    } finally {
      setSearching(false);
    }
  };

  const commitPlace = (place: PlaceResult) => {
    setCenter({ lat: place.lat, lon: place.lon });
    setResults([]);
    setQuery(place.label);
    const map = mapRef.current;
    if (map) map.setView([place.lat, place.lon], 16, { animate: false });
    onPlaceRef.current?.(place);
    void detectParcels(place);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("This browser does not expose a location provider.");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        commitPlace({
          label: "My current location",
          lat: Number(position.coords.latitude.toFixed(6)),
          lon: Number(position.coords.longitude.toFixed(6)),
          source: "browser_geolocation",
        });
        setSearching(false);
      },
      () => {
        setSearchError("Location permission was refused.");
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const startDrawing = () => {
    const map = mapRef.current;
    if (!map) return;
    map.pm.enableDraw("Polygon", {
      snappable: false,
      allowSelfIntersection: false,
      finishOn: "dblclick",
      continueDrawing: false,
    });
  };

  const toggleEdit = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!polygonRef.current) {
      setSearchError("Draw a parcel first, then edit its corners.");
      return;
    }
    if (map.pm.globalEditModeEnabled()) {
      map.pm.disableGlobalEditMode();
    } else {
      map.pm.enableGlobalEditMode();
    }
  };

  const clearBoundary = () => {
    const map = mapRef.current;
    if (polygonRef.current && map) map.removeLayer(polygonRef.current);
    polygonRef.current = null;
    setParcels([]);
    setParcelNotice(null);
    setActiveParcelId(null);
    onChange([]);
    onBoundaryRef.current?.([]);
  };

  const metrics = polygonMetrics(points);
  const hasBoundary = points.length >= 3 && metrics.areaHa > 0;
  const activeOverlay =
    EO_OVERLAYS.find((overlay) => overlay.id === overlayId) ?? null;

  return (
    <div className="field-map">
      <div className="field-map__toolbar">
        <div className="field-map__search">
          <input
            className="input"
            value={query}
            placeholder="Search a village, district or landmark…"
            onChange={(event) => {
              setQuery(event.target.value);
              setResults([]);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch();
            }}
            aria-label="Search for a place"
            autoComplete="off"
          />
          <button
            type="button"
            className="btn btn--small btn--primary"
            onClick={() => void runSearch()}
            disabled={searching}
          >
            {searching ? <SproutLoader size="xs" label="Searching" /> : "Find"}
          </button>
          <button type="button" className="btn btn--small btn--ghost" onClick={useMyLocation}>
            My location
          </button>
        </div>

        <div className="field-map__layers" role="group" aria-label="Map layers">
          <span className="field-map__layer-label">Base</span>
          <button
            type="button"
            className={baseKind === "satellite" ? "is-active" : ""}
            onClick={() => setBaseKind("satellite")}
            aria-pressed={baseKind === "satellite"}
          >
            Satellite
          </button>
          <button
            type="button"
            className={baseKind === "street" ? "is-active" : ""}
            onClick={() => setBaseKind("street")}
            aria-pressed={baseKind === "street"}
          >
            Map
          </button>
          <span className="field-map__sep" />
          <span className="field-map__layer-label">Overlay</span>
          <select
            className="field-map__select"
            value={overlayId}
            onChange={(event) => setOverlayId(event.target.value)}
            aria-label="NASA GIBS overlay"
            title="NASA GIBS rendered imagery — visual context, never a number"
          >
            <option value="none">None</option>
            {EO_OVERLAYS.map((overlay) => (
              <option key={overlay.id} value={overlay.id}>
                {overlay.label}
              </option>
            ))}
          </select>
          {activeOverlay && (
            <label className="field-map__opacity" title="Overlay opacity">
              <input
                type="range"
                min="15"
                max="90"
                value={overlayOpacity}
                onChange={(event) =>
                  setOverlayOpacity(Number(event.target.value))
                }
                aria-label="GIBS overlay opacity"
              />
            </label>
          )}
        </div>
      </div>

      {searchError && <div className="field-map__error">{searchError}</div>}
      {detectingParcels && (
        <div className="field-map__detect">
          <SproutLoader size="xs" label="Detecting parcels" />
          Looking for mapped field outlines near this place…
        </div>
      )}
      {parcelNotice && !detectingParcels && (
        <div className="field-map__notice" role="status">
          <span>{parcelNotice}</span>
          {parcels.length > 1 && (
            <div className="field-map__parcels" aria-label="Detected parcel outlines">
              {parcels.map((parcel) => (
                <button
                  key={parcel.id}
                  type="button"
                  className={parcel.id === activeParcelId ? "is-active" : ""}
                  onClick={() => applyParcel(parcel)}
                  title={`${parcel.label} · ${parcel.distanceM} m from the searched point`}
                >
                  {parcel.areaHa.toFixed(2)} ha · {parcel.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {results.length > 0 && (
        <div className="field-map__results" role="listbox" aria-label="Place results">
          {results.map((place) => (
            <button
              key={`${place.lat}-${place.lon}-${place.label}`}
              type="button"
              role="option"
              onClick={() => commitPlace(place)}
            >
              <GlyphPin />
              <span>{place.label}</span>
              <small>
                {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
              </small>
            </button>
          ))}
        </div>
      )}

      <div className="field-map__canvas-wrap">
        <div ref={containerRef} className="field-map__canvas" />

        <div className="field-map__draw-tools" role="group" aria-label="Parcel drawing">
          <button
            type="button"
            className={`btn btn--small${drawing ? " btn--primary" : ""}`}
            onClick={startDrawing}
          >
            {drawing ? <SproutLoader size="xs" label="Drawing" /> : <GlyphPin />}
            {drawing ? "Click corners…" : "Draw field"}
          </button>
          <button
            type="button"
            className={`btn btn--small${editing ? " btn--primary" : ""}`}
            onClick={toggleEdit}
            disabled={!hasBoundary}
          >
            {editing ? "Done editing" : "Edit corners"}
          </button>
          {hasBoundary && (
            <button type="button" className="btn btn--small btn--ghost" onClick={clearBoundary}>
              Clear
            </button>
          )}
        </div>

        {!hasBoundary && !drawing && (
          <div className="field-map__readout">
            <span>
              <strong>No area yet</strong>
            </span>
          </div>
        )}

        {hasBoundary && (
          <div className="field-map__readout">
            <span>
              <strong>{metrics.areaHa.toFixed(2)} ha</strong>
            </span>
            <span>{metrics.perimeterM.toFixed(0)} m perimeter</span>
            <span>
              {Math.round(metrics.widthM)} × {Math.round(metrics.heightM)} m bbox
            </span>
            <span>{metrics.vertexCount} corners</span>
          </div>
        )}

        <div className="field-map__legend">
          <span>
            {baseKind === "satellite" ? "Satellite base" : "OpenStreetMap"}
            {activeOverlay
              ? ` · ${activeOverlay.label}`
              : " · no NASA overlay"}
          </span>
        </div>

        <div className="field-map__zoom" aria-live="polite">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <strong>z{zoom}</strong>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <span>
            {activeOverlay
              ? zoom <= activeOverlay.maxNativeZoom
                ? `${activeOverlay.note} · native`
                : `${activeOverlay.label} soft at this zoom · base map sharp to z19`
              : "No NASA overlay · base map sharp to z19"}
          </span>
        </div>
      </div>

      <div className="field-map__footer">
        <div>
          <div className="field-map__place">
            {center.lat.toFixed(4)}, {center.lon.toFixed(4)} · z{zoom}
          </div>
          <div className="hint">
            {!hasBoundary && (
              <>
                Opening on {DEFAULT_VIEW.label} — nothing selected.{" "}
              </>
            )}
            Scroll or use +/− to zoom: the satellite or street base stays sharp to
            z19. The NASA GIBS overlay is rendered imagery, so it softens past its
            native zoom while the drawn corners and spherical area stay exact.
            Switch the base or the overlay in the toolbar.
          </div>
        </div>
        <button
          type="button"
          className="btn btn--small btn--primary"
          onClick={onRequestAnalysis}
          disabled={climateLoading || !hasBoundary || !onRequestAnalysis}
          title="Saves this place and its polygon on the field record, then loads NASA POWER climate for these exact coordinates"
        >
          {climateLoading ? <SproutLoader size="xs" label="Loading climate" /> : null}
          {climateLoading
            ? "Saving place · loading climate…"
            : hasClimate
              ? "Refresh NASA POWER"
              : "Save place & load NASA POWER"}
        </button>
      </div>
    </div>
  );
}

/** Local pin glyph keeps the map independent of the page icon set. */
function GlyphPin() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="9" r="2.4" fill="currentColor" />
    </svg>
  );
}
