import crypto from "node:crypto";

const EARTH_RADIUS_M = 6_371_008.8;
const METERS_PER_DEG_LAT = 110_574;

const toRadians = (value) => (value * Math.PI) / 180;

export function haversineMeters(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sphericalAreaM2(points) {
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

function centroid(points) {
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

export function analyseBoundary(rawPoints) {
  // Drop a duplicated closing vertex on a copy — never mutate the caller's input.
  const first = rawPoints[0];
  const last = rawPoints[rawPoints.length - 1];
  const points =
    rawPoints.length > 3 && first.lat === last.lat && first.lon === last.lon
      ? rawPoints.slice(0, -1)
      : rawPoints;
  const centre = centroid(points);
  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lons);
  const east = Math.max(...lons);
  let perimeterM = 0;
  for (let index = 0; index < points.length; index += 1) {
    perimeterM += haversineMeters(
      points[index],
      points[(index + 1) % points.length],
    );
  }
  const areaM2 = sphericalAreaM2(points);
  return {
    areaHa: Number((areaM2 / 10_000).toFixed(3)),
    areaM2: Number(areaM2.toFixed(1)),
    perimeterM: Number(perimeterM.toFixed(1)),
    centroidLat: Number(centre.lat.toFixed(6)),
    centroidLon: Number(centre.lon.toFixed(6)),
    bbox: {
      south: Number(south.toFixed(6)),
      west: Number(west.toFixed(6)),
      north: Number(north.toFixed(6)),
      east: Number(east.toFixed(6)),
    },
    widthM: Number(
      haversineMeters(
        { lat: centre.lat, lon: west },
        { lat: centre.lat, lon: east },
      ).toFixed(1),
    ),
    heightM: Number(
      haversineMeters(
        { lat: south, lon: centre.lon },
        { lat: north, lon: centre.lon },
      ).toFixed(1),
    ),
    vertexCount: points.length,
  };
}

export function boundaryHash(points) {
  return crypto
    .createHash("sha1")
    .update(
      points
        .map((point) => `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`)
        .sort()
        .join(";"),
    )
    .digest("hex")
    .slice(0, 20);
}

export function validateBoundary(value) {
  if (!Array.isArray(value) || value.length < 3 || value.length > 1_000) {
    return "boundary must contain between 3 and 1000 points";
  }
  for (const point of value) {
    if (
      !point ||
      typeof point !== "object" ||
      typeof point.lat !== "number" ||
      typeof point.lon !== "number" ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lon) ||
      point.lat < -60 ||
      point.lat > 60 ||
      point.lon < -180 ||
      point.lon > 180
    ) {
      return "every boundary point needs a finite lat (-60..60) and lon (-180..180)";
    }
  }
  // A duplicated closing vertex is tolerated; analyseBoundary drops it on a
  // copy. The caller's input is never mutated here.
  return value.length >= 3
    ? null
    : "boundary needs at least three distinct corners";
}
