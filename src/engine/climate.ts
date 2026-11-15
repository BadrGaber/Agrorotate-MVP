import type { ClimateDay, ClimateSummary } from "../state/model";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));


export function extraterrestrialRadiation(
  dayOfYear: number,
  latitudeDeg: number,
): number {
  const GSC = 0.082;
  const phi = (latitudeDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const declination = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const sunsetAngle = Math.acos(
    clamp(-Math.tan(phi) * Math.tan(declination), -1, 1),
  );
  return (
    ((24 * 60) / Math.PI) *
    GSC *
    dr *
    (sunsetAngle * Math.sin(phi) * Math.sin(declination) +
      Math.cos(phi) * Math.cos(declination) * Math.sin(sunsetAngle))
  );
}

export function dayOfYear(isoDate: string): number {
  const date = new Date(isoDate);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function saturationVapourPressure(temperatureC: number): number {
  return 0.6108 * Math.exp((17.27 * temperatureC) / (temperatureC + 237.3));
}

export interface PmInputs {
  tmax: number;
  tmin: number;
  rhMean: number;
  wind2m: number;
  solarRadiation: number;
  isoDate: string;
  latitude: number;
  elevationM?: number;
}

















export function fao56PenmanMonteith(input: PmInputs): number | null {
  const { tmax, tmin, rhMean, wind2m, solarRadiation, isoDate, latitude } = input;
  if (
    !Number.isFinite(tmax) ||
    !Number.isFinite(tmin) ||
    !Number.isFinite(rhMean) ||
    !Number.isFinite(wind2m) ||
    !Number.isFinite(solarRadiation)
  ) {
    return null;
  }
  if (tmax < tmin) return null;

  const elevation = Number.isFinite(input.elevationM ?? NaN)
    ? (input.elevationM as number)
    : 0;
  const tmean = (tmax + tmin) / 2;
  const es = (saturationVapourPressure(tmax) + saturationVapourPressure(tmin)) / 2;
  const ea = clamp(rhMean, 5, 100) / 100 * es;
  const delta = (4098 * saturationVapourPressure(tmean)) / (tmean + 237.3) ** 2;
  const pressure = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26;
  const gamma = 0.000665 * pressure;

  const ra = extraterrestrialRadiation(dayOfYear(isoDate), latitude);
  const rso = (0.75 + 2e-5 * elevation) * ra;
  if (rso <= 0) return null;

  const rns = 0.77 * solarRadiation;
  const tmaxK = tmax + 273.16;
  const tminK = tmin + 273.16;
  const rnl =
    4.903e-9 *
    ((tmaxK ** 4 + tminK ** 4) / 2) *
    (0.34 - 0.14 * Math.sqrt(ea)) *
    (1.35 * clamp(solarRadiation / rso, 0.3, 1) - 0.35);
  const rn = rns - rnl;

  const numerator =
    0.408 * delta * rn +
    gamma * (900 / (tmean + 273)) * wind2m * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * wind2m);
  if (denominator === 0) return null;
  return Math.max(0, numerator / denominator);
}

export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export interface DailyRecord {
  date: string;
  t2mMax: number | null;
  t2mMin: number | null;
  t2m: number | null;
  precipMm: number | null;
  rh2m: number | null;
  ws2m: number | null;
  srad: number | null;
}





export function summarisePower(
  payload: unknown,
  latitude: number,
  longitude: number,
  elevationM: number | null = null,
): { summary: ClimateSummary; sample: ClimateDay[] } | null {
  const properties = (payload as { properties?: { parameter?: unknown } })
    ?.properties;
  const parameter = properties?.parameter as
    | Record<string, Record<string, number>>
    | undefined;
  if (!parameter) return null;

  const dates = Object.keys(parameter.T2M_MAX ?? parameter.T2M ?? {});
  if (dates.length === 0) return null;

  const records: DailyRecord[] = dates
    .sort()
    .map((rawDate) => {

      const date = /^\d{8}$/.test(rawDate)
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;
      const pick = (key: string) => {
        const raw = parameter[key]?.[rawDate];
        return typeof raw === "number" && raw > -900 ? raw : null;
      };
      return {
        date,
        t2mMax: pick("T2M_MAX"),
        t2mMin: pick("T2M_MIN"),
        t2m: pick("T2M"),
        precipMm: pick("PRECTOTCORR"),
        rh2m: pick("RH2M"),
        ws2m: pick("WS2M"),
        srad: pick("ALLSKY_SFC_SW_DWN"),
      };
    });

  const valid = records.filter(
    (record) => record.t2mMax !== null && record.t2mMin !== null,
  );
  if (valid.length === 0) return null;

  const mean = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const meanTmaxC = mean(valid.map((record) => record.t2mMax as number));
  const meanTminC = mean(valid.map((record) => record.t2mMin as number));

  let precipitation = 0;
  let etoTotal = 0;
  let etoDays = 0;
  const etoByDate = new Map<string, number>();
  for (const record of records) {
    if (record.precipMm !== null) precipitation += record.precipMm;
    if (
      record.t2mMax !== null &&
      record.t2mMin !== null &&
      record.rh2m !== null &&
      record.ws2m !== null &&
      record.srad !== null
    ) {
      const eto = fao56PenmanMonteith({
        tmax: record.t2mMax,
        tmin: record.t2mMin,
        rhMean: record.rh2m,
        wind2m: record.ws2m,
        solarRadiation: record.srad,
        isoDate: record.date,
        latitude,
        elevationM: elevationM ?? 0,
      });
      if (eto !== null) {
        etoTotal += eto;
        etoDays += 1;
        etoByDate.set(record.date, eto);
      }
    }
  }

  const monthStats = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    tmax: 0,
    tmin: 0,
    tempDays: 0,
    rain: 0,
    eto: 0,
    etoDays: 0,
  }));
  for (const record of records) {
    const month = Number(record.date.slice(5, 7));
    const bucket = monthStats[month - 1];
    if (!bucket) continue;
    if (record.t2mMax !== null && record.t2mMin !== null) {
      bucket.tmax += record.t2mMax;
      bucket.tmin += record.t2mMin;
      bucket.tempDays += 1;
    }
    if (record.precipMm !== null) bucket.rain += record.precipMm;
    const eto = etoByDate.get(record.date);
    if (eto !== undefined) {
      bucket.eto += eto;
      bucket.etoDays += 1;
    }
  }

  const spanDays = Math.max(
    1,
    (new Date(records[records.length - 1].date).getTime() -
      new Date(records[0].date).getTime()) /
      86_400_000 +
      1,
  );
  const spanYears = Math.max(0.1, spanDays / 365.25);

  const monthly = monthStats.map((bucket) => ({
    month: bucket.month,
    tmaxC: Number((bucket.tempDays ? bucket.tmax / bucket.tempDays : 0).toFixed(1)),
    tminC: Number((bucket.tempDays ? bucket.tmin / bucket.tempDays : 0).toFixed(1)),
    rainMm: Number((bucket.rain / spanYears).toFixed(0)),
    etoMm: bucket.etoDays
      ? Number((bucket.eto / spanYears).toFixed(0))
      : null,
  }));

  const seasonMonths = (months: number[]) => {
    const rows = records.filter((record) =>
      months.includes(Number(record.date.slice(5, 7))),
    );
    const validRows = rows.filter(
      (record) => record.t2mMax !== null && record.t2mMin !== null,
    );
    const seasonEto = rows.reduce((sum, row) => sum + (etoByDate.get(row.date) ?? 0), 0);
    const seasonEtoDays = rows.filter((row) => etoByDate.has(row.date)).length;
    const seasonRain = rows.reduce((sum, row) => sum + (row.precipMm ?? 0), 0);
    return {
      tmaxC: Number(
        (validRows.reduce((sum, row) => sum + (row.t2mMax ?? 0), 0) /
          Math.max(1, validRows.length)).toFixed(1),
      ),
      tminC: Number(
        (validRows.reduce((sum, row) => sum + (row.t2mMin ?? 0), 0) /
          Math.max(1, validRows.length)).toFixed(1),
      ),
      rainMm: Number((seasonRain / spanYears).toFixed(0)),
      etoMm: seasonEtoDays
        ? Number((seasonEto / spanYears).toFixed(0))
        : null,
      days: validRows.length,
    };
  };

  const sample = records.slice(-10).map<ClimateDay>((record) => ({
    date: record.date,
    t2mMax: record.t2mMax,
    t2mMin: record.t2mMin,
    t2m: record.t2m,
    precipMm: record.precipMm,
    rh2m: record.rh2m,
    ws2m: record.ws2m,
    srad: record.srad,
  }));

  const etoStatus: ClimateSummary["etoStatus"] =
    etoDays === 0 ? "unavailable" : etoDays >= records.length ? "complete" : "partial";

  return {
    summary: {
      days: records.length,
      startDate: records[0].date,
      endDate: records[records.length - 1].date,
      meanTmaxC: Number(meanTmaxC.toFixed(1)),
      meanTminC: Number(meanTminC.toFixed(1)),
      annualPrecipMm: Number(
        ((precipitation / spanDays) * 365.25).toFixed(0),
      ),
      etoAnnualMm:
        etoDays > 0 ? Number(((etoTotal / spanDays) * 365.25).toFixed(0)) : null,
      etoMethod: "fao56_pm",
      etoDaysComputed: etoDays,
      etoDaysTotal: records.length,
      etoStatus,
      etoRequiredInputs: [
        "T2M_MAX",
        "T2M_MIN",
        "RH2M",
        "WS2M",
        "ALLSKY_SFC_SW_DWN",
        "elevationM",
        "latitude",
        "date",
      ],
      latitude,
      longitude,
      elevationM: elevationM ?? 0,
      parameters: [
        "T2M_MAX",
        "T2M_MIN",
        "RH2M",
        "WS2M",
        "ALLSKY_SFC_SW_DWN",
        "PRECTOTCORR",
      ],
      timeStandard: "UTC (NASA POWER daily)",
      summer: seasonMonths([6, 7, 8]),
      winter: seasonMonths([12, 1, 2]),
      monthly,
      heatDays35: valid.filter(
        (record) => record.t2mMax !== null && record.t2mMax >= 35,
      ).length,
      dryDays: records.filter(
        (record) => record.precipMm !== null && record.precipMm < 1,
      ).length,
      frostDays: valid.filter(
        (record) => record.t2mMin !== null && record.t2mMin <= 0,
      ).length,
    },
    sample,
  };
}
