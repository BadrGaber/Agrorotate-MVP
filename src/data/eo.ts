export type EoStatus = "live" | "visual" | "token";
export type EoNumeric = "live" | "token";

export interface EoGibsLayer {
  id: string;
  matrix: string;
  maxNativeZoom: number;
  label: string;
}

export interface EoProductDefinition {
  id: "srtm" | "soilgrids";
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


export const EO_OVERLAYS: EoOverlay[] = [
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