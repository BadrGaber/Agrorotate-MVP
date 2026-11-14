/**
 * The earth-observation register shown in the Method page, the field map and
 * the field/soil panels. Keep this list aligned with server/eo.mjs: the server
 * is the authority for live values and token status, while this file gives the
 * UI an honest offline fallback.
 */

export type EoStatus = "live" | "visual" | "token";
export type EoNumeric = "live" | "token";

export interface EoGibsLayer {
  id: string;
  matrix: string;
  maxNativeZoom: number;
  label: string;
}

export interface EoProductDefinition {
  id:
    | "hls"
    | "smap"
    | "gpm"
    | "srtm"
    | "modis"
    | "ecostress"
    | "soilgrids";
  name: string;
  provider: string;
  resolution: string;
  cadence: string;
  role: string;
  caveat: string;
  status: EoStatus;
  numeric: EoNumeric;
  gibs: EoGibsLayer[];
  docsUrl: string;
  methodNote: string;
}

export const EO_PRODUCTS: EoProductDefinition[] = [
  {
    id: "hls",
    name: "HLS / Landsat",
    provider: "NASA LP DAAC · Harmonized Landsat Sentinel-2 v2.0",
    resolution: "30 m",
    cadence: "2–3 days (Landsat 8/9 + Sentinel-2)",
    role: "Reflectance and NDVI history — crop condition, residue and cover.",
    caveat:
      "GIBS reflectance tiles are visual context only. Numeric NDVI/EVI2 needs granules, QA masks and an Earthdata token.",
    status: "visual",
    numeric: "token",
    gibs: [
      {
        id: "HLS_S30_Nadir_BRDF_Adjusted_Reflectance",
        matrix: "GoogleMapsCompatible_Level12",
        maxNativeZoom: 12,
        label: "HLS S30 · Sentinel-2",
      },
      {
        id: "HLS_L30_Nadir_BRDF_Adjusted_Reflectance",
        matrix: "GoogleMapsCompatible_Level12",
        maxNativeZoom: 12,
        label: "HLS L30 · Landsat",
      },
    ],
    docsUrl: "https://www.earthdata.nasa.gov/data/projects/hls",
    methodNote:
      "30 m reflectance tiles on the map; numeric NDVI history needs an Earthdata token.",
  },
  {
    id: "smap",
    name: "SMAP L4",
    provider: "NASA NSIDC DAAC · SPL4SMGP v008",
    resolution: "9 km EASE-Grid 2.0",
    cadence: "3-hourly / daily",
    role: "Surface and root-zone moisture context — never a field probe.",
    caveat:
      "A 9 km pixel averages many fields. The layer is context; numeric wetness percentiles need an Earthdata token.",
    status: "visual",
    numeric: "token",
    gibs: [
      {
        id: "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        matrix: "GoogleMapsCompatible_Level6",
        maxNativeZoom: 6,
        label: "SMAP L4 · root zone",
      },
      {
        id: "SMAP_L4_Analyzed_Surface_Soil_Moisture",
        matrix: "GoogleMapsCompatible_Level6",
        maxNativeZoom: 6,
        label: "SMAP L4 · surface",
      },
    ],
    docsUrl: "https://nsidc.org/data/spl4smgp/versions/8",
    methodNote:
      "9 km root-zone and surface tiles on the map; numeric values are token-gated.",
  },
  {
    id: "gpm",
    name: "GPM IMERG",
    provider: "NASA GES DISC · GPM_3IMERGDF / GPM_3IMERGHH",
    resolution: "0.1° (~10 km)",
    cadence: "30 min / daily",
    role: "Satellite rainfall estimates — not irrigation delivery.",
    caveat:
      "IMERG is a satellite estimate with latency. It complements POWER rainfall but does not measure water applied at the field.",
    status: "visual",
    numeric: "token",
    gibs: [
      {
        id: "IMERG_Precipitation_Rate",
        matrix: "GoogleMapsCompatible_Level6",
        maxNativeZoom: 6,
        label: "GPM IMERG · precipitation rate",
      },
    ],
    docsUrl:
      "https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdf-07",
    methodNote:
      "IMERG precipitation-rate tiles on the map; numeric totals need an Earthdata token.",
  },
  {
    id: "srtm",
    name: "SRTM DEM",
    provider: "NASA SRTM GL1 · sampled through Open-Meteo elevation",
    resolution: "~30 m source; sampled across the parcel bbox",
    cadence: "static",
    role: "Elevation context and the slope the trained model reads.",
    caveat:
      "The metrics come from a small sample grid, not a survey-grade DEM map. Slope is used as a model input; elevation is context for the climate request.",
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
    methodNote:
      "Elevation and plane-fit slope from a 5×5 DEM sample grid. Slope is a model input; elevation is climate context.",
  },
  {
    id: "modis",
    name: "MODIS MOD13Q1",
    provider: "NASA LP DAAC · MOD13Q1 v061",
    resolution: "250 m",
    cadence: "16-day composite",
    role: "Vegetation-index context and seasonal anomaly.",
    caveat:
      "The 16-day composite is context, not a yield measurement. GIBS shows the rendered index; numeric values need granules and an Earthdata token.",
    status: "visual",
    numeric: "token",
    gibs: [
      {
        id: "MODIS_Terra_L3_NDVI_16Day",
        matrix: "GoogleMapsCompatible_Level9",
        maxNativeZoom: 9,
        label: "MODIS · NDVI 16-day",
      },
    ],
    docsUrl:
      "https://www.earthdata.nasa.gov/data/catalog/lpcloud-mod13q1-061",
    methodNote:
      "250 m / 16-day NDVI tiles on the map; numeric index values are token-gated.",
  },
  {
    id: "ecostress",
    name: "ECOSTRESS / MOD16",
    provider: "NASA LP DAAC · ECO_L3T_ET_ALEXI / MOD16A2",
    resolution: "70 m (ECOSTRESS) / 500 m (MOD16)",
    cadence: "irregular ISS overpass / 8-day",
    role: "Actual ET and evaporative-stress research layers.",
    caveat:
      "There is no public GIBS layer for ECOSTRESS ET. Numeric retrieval is irregular, cloud-sensitive and needs an Earthdata token.",
    status: "token",
    numeric: "token",
    gibs: [],
    docsUrl:
      "https://www.earthdata.nasa.gov/data/catalog/lpcloud-eco-l3t-et-alexi-002",
    methodNote:
      "No public visual layer; numeric ET requires an Earthdata token and granule processing.",
  },
  {
    id: "soilgrids",
    name: "SoilGrids (ISRIC)",
    provider: "ISRIC World Soil Information · SoilGrids 250 m v2.0",
    resolution: "250 m mapped prediction",
    cadence: "static (v2.0)",
    role: "Global soil baseline & AI training prior — texture, pH, SOC, CEC, and bulk density.",
    caveat:
      "Global 250 m benchmark used in neural surrogate training and conformal uncertainty calibration. Active field parameters rely on measured lab data and direct observations.",
    status: "live",
    numeric: "live",
    gibs: [],
    docsUrl: "https://soilgrids.org/",
    methodNote:
      "Global reference layer for AI training and calibration; parcel-level decisions use direct farmer soil reports.",
  },
];

export interface EoOverlay {
  id: string;
  label: string;
  layer: string;
  matrix: string;
  extension: "png";
  maxNativeZoom: number;
  attribution: string;
  note: string;
}

/** Verified against the GIBS WMTS capabilities on 12 Nov 2026. */
export const EO_OVERLAYS: EoOverlay[] = [
  {
    id: "modis16",
    label: "MODIS NDVI · 16-day",
    layer: "MODIS_Terra_L3_NDVI_16Day",
    matrix: "GoogleMapsCompatible_Level9",
    extension: "png",
    maxNativeZoom: 9,
    attribution: "NASA GIBS / EOSDIS · MODIS NDVI (16-day)",
    note: "250 m · 16-day composite",
  },
  {
    id: "smapRoot",
    label: "SMAP L4 · root zone",
    layer: "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
    matrix: "GoogleMapsCompatible_Level6",
    extension: "png",
    maxNativeZoom: 6,
    attribution: "NASA GIBS / EOSDIS · SMAP L4 root-zone moisture",
    note: "9 km · root-zone context",
  },
  {
    id: "smapSurface",
    label: "SMAP L4 · surface",
    layer: "SMAP_L4_Analyzed_Surface_Soil_Moisture",
    matrix: "GoogleMapsCompatible_Level6",
    extension: "png",
    maxNativeZoom: 6,
    attribution: "NASA GIBS / EOSDIS · SMAP L4 surface moisture",
    note: "9 km · surface context",
  },
  {
    id: "imerg",
    label: "GPM IMERG · rain rate",
    layer: "IMERG_Precipitation_Rate",
    matrix: "GoogleMapsCompatible_Level6",
    extension: "png",
    maxNativeZoom: 6,
    attribution: "NASA GIBS / EOSDIS · GPM IMERG precipitation",
    note: "~10 km · rainfall context",
  },
  {
    id: "hlsS30",
    label: "HLS S30 · Sentinel-2",
    layer: "HLS_S30_Nadir_BRDF_Adjusted_Reflectance",
    matrix: "GoogleMapsCompatible_Level12",
    extension: "png",
    maxNativeZoom: 12,
    attribution: "NASA GIBS / EOSDIS · HLS S30 reflectance",
    note: "30 m · Sentinel-2 HLS",
  },
  {
    id: "hlsL30",
    label: "HLS L30 · Landsat",
    layer: "HLS_L30_Nadir_BRDF_Adjusted_Reflectance",
    matrix: "GoogleMapsCompatible_Level12",
    extension: "png",
    maxNativeZoom: 12,
    attribution: "NASA GIBS / EOSDIS · HLS L30 reflectance",
    note: "30 m · Landsat HLS",
  },
  {
    id: "srtm",
    label: "SRTM · colour relief",
    layer: "SRTM_Color_Index",
    matrix: "GoogleMapsCompatible_Level12",
    extension: "png",
    maxNativeZoom: 12,
    attribution: "NASA GIBS / EOSDIS · SRTM colour index",
    note: "~30 m source · static relief",
  },
  {
    id: "modis8",
    label: "MODIS NDVI · 8-day",
    layer: "MODIS_Terra_NDVI_8Day",
    matrix: "GoogleMapsCompatible_Level9",
    extension: "png",
    maxNativeZoom: 9,
    attribution: "NASA GIBS / EOSDIS · MODIS NDVI (8-day)",
    note: "250 m · rolling 8-day",
  },
];

export interface EoStatusRow {
  name: string;
  status: "Live" | "Computed" | "Visual" | "Token";
  note: string;
}

export const EO_STATUS_ROWS: EoStatusRow[] = [
  {
    name: "NASA POWER daily (AG)",
    status: "Live",
    note: "Temperature, humidity, wind, solar radiation, precipitation; cached with request metadata.",
  },
  {
    name: "FAO-56 Penman–Monteith",
    status: "Computed",
    note: "ETo from the POWER inputs above, daily, then annualised.",
  },
  ...EO_PRODUCTS.map((product) => ({
    name: product.name,
    status:
      product.status === "live"
        ? ("Live" as const)
        : product.status === "visual"
          ? ("Visual" as const)
          : ("Token" as const),
    note: product.methodNote,
  })),
];