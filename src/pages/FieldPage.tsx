import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "../state/workspace";
import { Card, Field, Note, PageHead, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { PROOFS, ProofChip } from "../ui/proof";
import { FieldMap, polygonMetrics } from "../components/FieldMap";
import { SetupRail, StepNav } from "./shared";
import {
  analyzeField,
  fetchClimateContext,
  type FieldAnalysis,
} from "../api/client";
import { summarisePower } from "../engine/climate";
import { MonthlyClimateChart, SeasonFingerprint } from "../ui/charts";
import type { RouteKey } from "../app/router";
import type { BoundaryPoint, SlopeClass } from "../state/model";
import { SproutLoader } from "../ui/SproutLoader";



function slopeClassFromPercent(percent: number): SlopeClass {
  if (percent < 2) return "flat";
  if (percent < 5) return "gentle";
  return "steep";
}


function boundarySignature(points: BoundaryPoint[]): string {
  return points
    .map((point) => `${point.lat.toFixed(5)},${point.lon.toFixed(5)}`)
    .join(";");
}

const SLOPE_OPTIONS: { value: SlopeClass; label: string; note: string }[] = [
  {
    value: "flat",
    label: "Level",
    note: "Under 2% — ponding is the bigger risk",
  },
  {
    value: "gentle",
    label: "Gently sloping",
    note: "2–5% — watch furrow erosion",
  },
  {
    value: "steep",
    label: "Steep",
    note: "Over 5% — drainage and erosion first",
  },
  {
    value: "unknown",
    label: "Not checked",
    note: "Kept empty rather than guessed",
  },
];

export function FieldPage({
  navigate,
}: {
  navigate: (route: RouteKey) => void;
}) {
  const { state, setField, setClimate } = useWorkspace();
  const metrics = useMemo(
    () => polygonMetrics(state.field.boundary),
    [state.field.boundary],
  );
  const [analysis, setAnalysis] = useState<FieldAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const schemaRefresh = useRef(false);
  const lastAnalysedRef = useRef<string>("");


  const drawnArea = metrics.areaHa;
  const areaUsed = drawnArea;
  const climate = state.climate;

  const loadClimate = async (lat: number, lon: number, force = false) => {
    setClimate({ status: "loading", error: null });
    try {
      const result = await fetchClimateContext(lat, lon, {
        years: 5,
        elevationM: state.field.elevationM,
        force,
      });
      setClimate({
        status: "ready",
        source: "NASA_POWER",
        summary: result.summary,
        daySample: result.sample,
        fetchedAtIso: result.fetchedAtIso,
        cache: result.cache,
        error: null,
      });
    } catch (error) {
      setClimate({
        status: "error",
        error:
          error instanceof Error ? error.message : "NASA POWER request failed",
      });
    }
  };

  const analyseCurrentField = async (
    boundary = state.field.boundary,
    force = false,
  ) => {
    if (boundary.length < 3) return;
    const signature = boundarySignature(boundary);
    if (!force && lastAnalysedRef.current === signature) return;
    lastAnalysedRef.current = signature;
    setAnalyzing(true);
    setClimate({ status: "loading", error: null });



    const localMetrics = polygonMetrics(boundary);
    setField({
      boundary,
      areaHa: Number(localMetrics.areaHa.toFixed(2)),
      areaSource: "drawn",
      centroidLat: Number(localMetrics.centroidLat.toFixed(5)),
      centroidLon: Number(localMetrics.centroidLon.toFixed(5)),
    });

    try {
      const result = await analyzeField(boundary, {
        years: 5,
        force,
        elevationM: state.field.elevationM,
      });
      const elevation =
        result.terrain.elevationMUsed ?? result.terrain.meanElevationM;
      const normalised = summarisePower(
        result.climate.raw,
        result.geometry.centroidLat,
        result.geometry.centroidLon,
        elevation,
      );
      if (!normalised)
        throw new Error("POWER returned no usable daily records");
      setAnalysis(result);
      const terrainSlope = result.terrain.slopePercent;
      setField({
        areaHa: result.geometry.areaHa,
        areaSource: "drawn",
        elevationM: elevation,
        elevationSource:
          elevation !== null ? "dem" : state.field.elevationSource,
        centroidLat: result.geometry.centroidLat,
        centroidLon: result.geometry.centroidLon,
        ...(state.field.slopeSource !== "observation" && terrainSlope !== null
          ? {
              slopeClass: slopeClassFromPercent(terrainSlope),
              slopeSource: "dem" as const,
            }
          : {}),
      });
      setClimate({
        status: "ready",
        source: "NASA_POWER",
        summary: normalised.summary,
        daySample: normalised.sample,
        fetchedAtIso: result.climate.fetchedAtIso,
        cache: result.climate.cache,
        error: null,
      });
    } catch (error) {


      const metrics = polygonMetrics(boundary);
      setField({
        boundary,
        areaHa: Number(metrics.areaHa.toFixed(2)),
        areaSource: "drawn",
        centroidLat: Number(metrics.centroidLat.toFixed(5)),
        centroidLon: Number(metrics.centroidLon.toFixed(5)),
      });
      try {
        const fallback = await fetchClimateContext(
          metrics.centroidLat,
          metrics.centroidLon,
          {
            years: 5,
            elevationM: state.field.elevationM,
          },
        );
        setClimate({
          status: "ready",
          source: "NASA_POWER",
          summary: fallback.summary,
          daySample: fallback.sample,
          fetchedAtIso: fallback.fetchedAtIso,
          cache: fallback.cache,
          error: null,
        });
      } catch (fallbackError) {
        setClimate({
          status: "error",
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "Field context request failed",
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };



  useEffect(() => {
    if (schemaRefresh.current) return;
    if (!climate.summary || climate.summary.monthly) return;
    schemaRefresh.current = true;
    void loadClimate(metrics.centroidLat, metrics.centroidLon, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climate.summary]);




  useEffect(() => {
    if (state.field.boundary.length < 3) return;
    if (lastAnalysedRef.current === boundarySignature(state.field.boundary))
      return;
    void analyseCurrentField(state.field.boundary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.field.boundary]);



  const climateAutoRef = useRef(false);
  useEffect(() => {
    if (climateAutoRef.current) return;
    if (climate.status !== "idle") return;
    if (state.field.centroidLat === null || state.field.centroidLon === null)
      return;
    climateAutoRef.current = true;
    void loadClimate(state.field.centroidLat, state.field.centroidLon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climate.status, state.field.centroidLat, state.field.centroidLon]);

  return (
    <main className="page">
      <PageHead
        eyebrow="Step 01 · Field & terrain"
        glyph="map"
        title={
          <>
            Put the field on the <em>map</em>.
          </>
        }
        lede="Search a real place, drag the parcel corners, and load NASA POWER for those coordinates. The climate panel appears only after a location is chosen."
      />

      <SetupRail current="field" navigate={navigate} />

      <div className="stack" style={{ gap: 18 }}>
        <div data-gate="field-boundary">
          <Card
            glyph="map"
            title="Parcel & satellite context"
            hint="Search a place, then draw and edit the real parcel. The area and bounding-box dimensions come from the WGS84 outline; POWER is the climate source."
            aside={
              <span className="badge badge--soft badge--model">
                <Glyph name="cloud" size={12} /> NASA GIBS · NASA POWER
              </span>
            }
          >
            <FieldMap
              points={state.field.boundary}
              onChange={(boundary) => {
                const m = polygonMetrics(boundary);
                setField({
                  boundary,
                  areaHa: boundary.length >= 3 ? Number(m.areaHa.toFixed(2)) : null,
                  areaSource: boundary.length >= 3 ? "drawn" : null,
                  centroidLat: boundary.length >= 3 ? Number(m.centroidLat.toFixed(5)) : null,
                  centroidLon: boundary.length >= 3 ? Number(m.centroidLon.toFixed(5)) : null,
                });
              }}
              onBoundaryCommitted={(boundary) =>
                void analyseCurrentField(boundary)
              }
              onPlaceSelected={(place) => {


                setField({
                  placeLabel: place.label,

                  name: place.label,
                  boundary: [],
                  centroidLat: place.lat,
                  centroidLon: place.lon,
                });
                setAnalysis(null);
                void loadClimate(place.lat, place.lon);
              }}
              onRequestAnalysis={() =>
                void analyseCurrentField(state.field.boundary, true)
              }
              climateLoading={climate.status === "loading" || analyzing}
              hasClimate={Boolean(climate.summary)}
            />
          </Card>
        </div>

        {analysis && (
          <Card
            glyph="compass"
            title="Field record from the map"
            hint="One analysis call returns geometry, terrain and the cached NASA POWER window."
            aside={
              <span className="badge badge--soft badge--model">
                <Glyph name="cloud" size={12} />{" "}
                {analysis.climate.cache === "server_cache"
                  ? "server cache"
                  : "on-demand"}
              </span>
            }
          >
            <div className="grid grid--4" style={{ gap: 8 }}>
              <Stat
                value={`${analysis.geometry.areaHa.toFixed(2)} ha`}
                label="Area"
                foot="spherical WGS84"
                tone="forest"
              />
              <Stat
                value={`${Math.round(analysis.geometry.widthM)} × ${Math.round(analysis.geometry.heightM)} m`}
                label="Bounding box"
                foot="west–east × south–north"
              />
              <Stat
                value={
                  analysis.terrain.meanElevationM !== null
                    ? `${analysis.terrain.meanElevationM} m`
                    : "—"
                }
                label="Mean elevation"
                foot="SRTM-backed samples"
              />
              <Stat
                value={
                  analysis.terrain.slopePercent !== null
                    ? `${analysis.terrain.slopePercent}%`
                    : "—"
                }
                label="Relief slope"
                foot="model input"
                tone="harvest"
              />
            </div>
            <div
              className="row"
              style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}
            >
              <span className="badge badge--soft badge--none">
                {analysis.geometry.vertexCount} corners
              </span>
              <span className="badge badge--soft badge--none">
                {analysis.geometry.perimeterM.toFixed(0)} m perimeter
              </span>
              <span className="badge badge--soft badge--est">
                {analysis.terrain.source}
              </span>
              {analysis.terrain.reliefM !== null && (
                <span className="badge badge--soft badge--none">
                  relief {analysis.terrain.reliefM} m
                </span>
              )}
            </div>
            {analysis.terrain.error && (
              <Note tone="harvest" glyph="alert" style={{ marginTop: 10 }}>
                Terrain is missing: {analysis.terrain.error}. Area and POWER
                remain valid.
              </Note>
            )}
          </Card>
        )}

        {climate.status === "loading" && (
          <Card flat>
            <div className="row" style={{ gap: 10 }}>
              <SproutLoader size="sm" label="Growing the field context" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong>Loading NASA POWER for this field…</strong>
                <div className="small">
                  Daily T2M_MAX, T2M_MIN, RH2M, WS2M, all-sky shortwave and
                  precipitation for the last five years. The app will not invent
                  a value while it waits.
                </div>
              </div>
            </div>
          </Card>
        )}

        {climate.status === "error" && (
          <Note tone="clay" glyph="alert">
            <strong>NASA POWER request failed.</strong> {climate.error}. The map
            and the rest of the setup still work; no climate values are filled
            in.
          </Note>
        )}

        {climate.summary && (
          <div className="grid grid--2">
            <Card
              glyph="sun"
              title="Climate of this location"
              hint={`NASA POWER daily AG · ${climate.summary.days} days · ${climate.summary.startDate} → ${climate.summary.endDate}`}
              aside={
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() =>
                    void loadClimate(
                      metrics.centroidLat,
                      metrics.centroidLon,
                      true,
                    )
                  }
                >
                  Refresh
                </button>
              }
            >
              <div className="grid grid--4" style={{ gap: 8 }}>
                <Stat
                  value={`${climate.summary.meanTmaxC}°`}
                  label="Mean T max"
                  foot="daily maxima"
                />
                <Stat
                  value={`${climate.summary.meanTminC}°`}
                  label="Mean T min"
                  foot="daily minima"
                />
                <Stat
                  value={climate.summary.annualPrecipMm}
                  label="Rain / year"
                  foot="POWER mm"
                  tone="forest"
                />
                <Stat
                  value={climate.summary.etoAnnualMm ?? "—"}
                  label="ETo / year"
                  foot="FAO-56 PM"
                  tone="harvest"
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <MonthlyClimateChart summary={climate.summary} />
              </div>
              <p className="small" style={{ marginTop: 8 }}>
                The line is reference evapotranspiration, not crop water demand.
                Summer and winter means are long-term context, not a forecast.
              </p>
            </Card>

            <Card
              glyph="calendar"
              title="Seasonal fingerprint"
              hint="What a summer and a winter look like at these coordinates."
            >
              <SeasonFingerprint summary={climate.summary} />
              <div className="grid grid--3" style={{ gap: 8, marginTop: 14 }}>
                <Stat
                  value={climate.summary.heatDays35}
                  label="Days ≥ 35°C"
                  foot="over the full window"
                  tone="clay"
                />
                <Stat
                  value={climate.summary.dryDays}
                  label="Dry days"
                  foot="rain < 1 mm"
                  tone="harvest"
                />
                <Stat
                  value={climate.summary.frostDays}
                  label="Frost days"
                  foot="T min ≤ 0°C"
                  tone="forest"
                />
              </div>
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <ProofChip
                  proof={PROOFS.nasaPowerLive(
                    `NASA POWER daily AG at ${climate.summary.latitude}, ${climate.summary.longitude}; ${climate.summary.parameters.join(", ")}; ${climate.summary.days} records.`,
                  )}
                />
                <span className="badge badge--soft badge--est">
                  {climate.cache === "server_cache" ? "server cache" : "on-demand"}
                </span>
              </div>
            </Card>
          </div>
        )}

        <div className="split">
          <div className="stack">
            <Card glyph="sprout" title="Farm details">
              <div className="stack" style={{ gap: 14 }}>
                <Field
                  label="Location label"
                  hint="Filled from the map search above; edit or type your own. It is the field's identity in the plan."
                >
                  <input
                    className="input"
                    value={state.field.placeLabel}
                    placeholder="Search a place on the map…"
                    onChange={(event) =>
                      setField({
                        placeLabel: event.target.value,
                        name: event.target.value,
                      })
                    }
                  />
                </Field>

                <Field
                  label="Area"
                  hint="Computed from the drawn polygon."
                  proof={
                    <ProofChip proof={PROOFS.userInput("Polygon geometry")} />
                  }
                >
                  <div className="input-group">
                    <input
                      className="input"
                      readOnly
                      value={drawnArea > 0 ? drawnArea.toFixed(2) : ""}
                      placeholder="—"
                    />
                    <span className="input-group__suffix">ha</span>
                  </div>
                </Field>

                {drawnArea <= 0 && (
                  <Note tone="harvest" glyph="alert">
                    The plan needs a boundary. Draw the parcel on the map above
                    — the area, centroid and climate all come from it.
                  </Note>
                )}

                <Field
                  label="Elevation"
                  hint="Optional. The DEM fills it after analysis; a value you type is kept as your own."
                  proof={<ProofChip proof={PROOFS.userInput("Elevation")} />}
                >
                  <div className="input-group">
                    <input
                      className="input"
                      inputMode="decimal"
                      value={state.field.elevationM ?? ""}
                      placeholder="—"
                      onChange={(event) =>
                        setField({
                          elevationM:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          elevationSource:
                            event.target.value === "" ? null : "user",
                        })
                      }
                    />
                    <span className="input-group__suffix">m a.s.l.</span>
                  </div>
                </Field>

                <div className="field">
                  <span className="label">
                    How does the ground lie?
                    <ProofChip proof={PROOFS.observation("Slope class")} />
                  </span>
                  <div className="choice-grid">
                    {SLOPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="choice"
                        aria-pressed={
                          state.field.slopeClass === option.value &&
                          state.field.slopeSource === "observation"
                        }
                        onClick={() =>
                          setField({
                            slopeClass: option.value,
                            slopeSource: "observation",
                          })
                        }
                      >
                        <span className="choice__title">{option.label}</span>
                        <span className="choice__note">{option.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="stack">
            <Card
              glyph="layers"
              title="Terrain — elevation and slope"
              hint="Elevation and slope come from different sources. The plan only fills the ones you actually provide."
            >
              <div className="table-wrap" style={{ border: 0 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      <th>Value on record</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Elevation</td>
                      <td>
                        {state.field.elevationM !== null
                          ? `${state.field.elevationM} m`
                          : "not entered"}
                      </td>
                      <td>
                        <ProofChip
                          proof={
                            state.field.elevationM === null
                              ? PROOFS.nasaNotFetched("SRTM DEM")
                              : state.field.elevationSource === "dem"
                                ? PROOFS.demTerrain("Elevation")
                                : PROOFS.userInput("Elevation")
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>Slope</td>
                      <td>
                        {state.field.slopeClass === "unknown"
                          ? "not checked"
                          : SLOPE_OPTIONS.find(
                              (option) =>
                                option.value === state.field.slopeClass,
                            )?.label}
                      </td>
                      <td>
                        <ProofChip
                          proof={
                            state.field.slopeSource === "observation"
                              ? PROOFS.observation("Slope class")
                              : state.field.slopeSource === "dem"
                                ? PROOFS.demTerrain("Slope class")
                                : PROOFS.nasaNotFetched("SRTM DEM slope")
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Note tone="sky" glyph="info" style={{ marginTop: 14 }}>
                Elevation is read from the DEM as soon as the parcel closes.
                Slope is the DEM relief unless you record your own observation,
                which always wins. The terrain sample grid (5×5, D8 flow) is a
                screening metric, not a survey-grade DEM map, and is never
                auto-filled into the plan.
              </Note>
            </Card>

            <Card
              glyph="compass"
              title="What the plan will use"
              wash
              aside={<span className="mono">6 seasons · 3 years</span>}
            >
              <div className="grid grid--3" style={{ gap: 10 }}>
                <Stat
                  value={`${areaUsed > 0 ? areaUsed.toFixed(2) : "—"}`}
                  label="Hectares used"
                  foot="from polygon"
                  tone="forest"
                />
                <Stat
                  value={
                    state.field.slopeClass === "unknown"
                      ? "—"
                      : state.field.slopeClass
                  }
                  label="Slope class"
                  foot={
                    state.field.slopeClass === "unknown"
                      ? "not observed"
                      : state.field.slopeSource === "dem"
                        ? "DEM relief"
                        : "your observation"
                  }
                />
                <Stat
                  value={climate.summary ? "ready" : "waiting"}
                  label="Climate"
                  foot={
                    climate.summary ? "POWER loaded" : "choose a place first"
                  }
                  tone={climate.summary ? "forest" : undefined}
                />
              </div>
              <p className="hand" style={{ marginTop: 14 }}>
                A drawn boundary is not a cadastral record.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <StepNav
        step="field"
        next="soil"
        navigate={navigate}
        hint="Next: describe the soil, one observation and one lab value at a time."
      />
    </main>
  );
}
