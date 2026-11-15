import { useWorkspace } from "../state/workspace";
import { Card, Field, Note, PageHead, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { PROOFS, ProofChip } from "../ui/proof";
import { MonthlyClimateChart, SeasonFingerprint } from "../ui/charts";
import { fetchClimateContext } from "../api/client";
import { SetupRail, StepNav } from "./shared";
import type { RouteKey } from "../app/router";
import type {
  IrrigationSystem,
  WaterRegime,
  WaterSource,
} from "../state/model";
import { polygonMetrics } from "../components/FieldMap";
import { SproutLoader } from "../ui/SproutLoader";
import { SmartInput } from "../components/SmartInput";
import { WATER_SOURCE_BY_UI, WATER_SOURCE_DEFAULTS } from "../engine/estimate";

const REGIMES: { value: WaterRegime; label: string; note: string }[] = [
  { value: "full_irrigation", label: "Full irrigation", note: "All crop water is delivered" },
  { value: "deficit_allocation", label: "Deficit quota", note: "A fixed allocation, often below demand" },
  { value: "supplementary", label: "Supplementary", note: "Rain-fed with top-up irrigation" },
  { value: "rainfed", label: "Rain-fed", note: "No irrigation supply" },
];

const SYSTEMS: { value: IrrigationSystem; label: string; note: string }[] = [
  { value: "drip", label: "Drip", note: "Localised, partial wetted fraction" },
  { value: "sprinkler", label: "Sprinkler", note: "Wets canopy — leaf disease matters" },
  { value: "surface", label: "Surface / furrow", note: "Gravity flow, lower uniformity" },
  { value: "pivot", label: "Pivot", note: "Overhead, large fields" },
  { value: "none", label: "None", note: "Rain-fed only" },
];

const SOURCES: { value: WaterSource; label: string; note: string }[] = [
  { value: "river_canal", label: "River / canal", note: "Nile system or irrigation canal" },
  { value: "groundwater", label: "Groundwater", note: "Well or borehole" },
  { value: "reclaimed", label: "Reclaimed", note: "Treated wastewater" },
  { value: "rain", label: "Rain", note: "Direct rainfall only" },
  { value: "mixed", label: "Mixed", note: "More than one source" },
];

const NASA_PRODUCTS: [string, string, string, "wired" | "visual" | "next"][] = [
  ["POWER daily AG", "temperature, rain, humidity, wind, solar, ETo", "S03", "wired"],
  ["MODIS NDVI", "8-day vegetation greenness via NASA GIBS", "S08", "visual"],
  ["SMAP surface moisture", "L3 passive day soil moisture via NASA GIBS", "S09", "visual"],
  ["SMAP L4 root zone", "0–100 cm modelled profile moisture", "S09", "next"],
  ["GPM IMERG", "~10 km satellite rainfall estimates", "S10", "next"],
  ["ECOSTRESS / MOD16", "evapotranspiration and water-stress layers", "S11–S12", "next"],
];

export function WaterPage({ navigate }: { navigate: (route: RouteKey) => void }) {
  const { state, setWater, setClimate } = useWorkspace();
  const metrics = polygonMetrics(state.field.boundary);
  const latitude = metrics.centroidLat || state.field.centroidLat;
  const longitude = metrics.centroidLon || state.field.centroidLon;
  const hasPoint = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const climate = state.climate;

  const sourceType = state.water.source
    ? WATER_SOURCE_BY_UI[state.water.source]
    : undefined;
  const sourceDefaultEcw = sourceType
    ? WATER_SOURCE_DEFAULTS[sourceType].ecw
    : WATER_SOURCE_DEFAULTS.FRESH_RIVER_CANAL.ecw;
  const ecwFallback =
    state.water.regime === "rainfed" || state.water.source === "rain"
      ? "rain-fed: no irrigation ECw is applied"
      : state.water.source
        ? `source default for the selected water source: ${sourceDefaultEcw.toFixed(2)} dS/m (EST)`
        : `no water source selected: ${sourceDefaultEcw.toFixed(2)} dS/m default (EST)`;

  const fetchClimate = async (force = false) => {
    if (latitude === null || longitude === null) return;
    setClimate({ status: "loading", error: null });
    try {
      const result = await fetchClimateContext(latitude, longitude, {
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
        error: error instanceof Error ? error.message : "NASA POWER request failed",
      });
    }
  };

  return (
    <main className="page">
      <PageHead
        eyebrow="Step 03 · Water & climate"
        glyph="drop"
        title={
          <>
            Rain is not irrigation. <em>Heat</em> is not water.
          </>
        }
        lede="One live NASA request supplies climate context. Water quality and allocation come from you, because no satellite measures the water coming out of your pump."
        actions={
          <div className="row">
            <span className="badge badge--soft badge--model">
              <Glyph name="cloud" size={13} />
              NASA POWER · daily AG
            </span>
            {climate.summary && (
              <span className="badge badge--soft badge--none">
                {climate.summary.days} days
              </span>
            )}
          </div>
        }
      />

      <SetupRail current="water" navigate={navigate} />

      <div className="split">
        <div className="stack">
          <Card
            glyph="sun"
            title="Climate context"
            hint="A single live request for this field's coordinates, cached by the local API when it is running."
            aside={
              <div className="row" style={{ gap: 6 }}>
                {climate.summary && (
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => fetchClimate(true)}
                    disabled={climate.status === "loading"}
                  >
                    Refresh
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--small btn--primary"
                  onClick={() => fetchClimate(false)}
                  disabled={climate.status === "loading" || !hasPoint}
                >
                  {climate.status === "loading" && <SproutLoader size="xs" label="Loading NASA POWER" />}
                  {climate.summary ? "Re-fetch" : "Fetch NASA POWER"}
                </button>
              </div>
            }
          >
            {climate.status === "idle" && (
              <div className="empty">
                <Glyph name="cloud" size={26} />
                <div className="empty__title">No climate data loaded yet</div>
                <div className="small" style={{ maxWidth: "48ch" }}>
                  Fetching pulls T2M, T2M_MAX, T2M_MIN, RH2M, WS2M, all-sky shortwave and
                  precipitation for the last five years at{" "}
                  {hasPoint ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "a field point you have not chosen yet"}.
                  Nothing is shown until a response actually arrives.
                </div>
              </div>
            )}

            {climate.status === "error" && (
              <Note tone="clay" glyph="alert">
                <strong>NASA POWER request failed.</strong> {climate.error}. The rest of the
                app keeps working; no climate values are invented to fill the gap.
              </Note>
            )}

            {climate.summary && (
              <div className="stack">
                <div className="grid grid--4">
                  <Stat
                    value={`${climate.summary.meanTmaxC}°`}
                    label="Mean T max"
                    foot="daily mean of maxima"
                  />
                  <Stat
                    value={`${climate.summary.meanTminC}°`}
                    label="Mean T min"
                    foot="daily mean of minima"
                  />
                  <Stat
                    value={`${climate.summary.annualPrecipMm}`}
                    label="Rain / year"
                    foot="POWER estimate, mm"
                    tone="forest"
                  />
                  <Stat
                    value={climate.summary.etoAnnualMm ?? "—"}
                    label="ETo / year"
                    foot="FAO-56 Penman–Monteith"
                    tone="harvest"
                  />
                </div>

                <SeasonFingerprint summary={climate.summary} />

                <MonthlyClimateChart summary={climate.summary} height={170} />

                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono">T2M_MAX</td>
                        <td>{climate.summary.meanTmaxC} °C</td>
                        <td>Daily maximum, averaged over the window</td>
                      </tr>
                      <tr>
                        <td className="mono">PRECTOTCORR</td>
                        <td>{climate.summary.annualPrecipMm} mm/yr</td>
                        <td>Estimated rainfall — not irrigation delivery</td>
                      </tr>
                      <tr>
                        <td className="mono">ETo</td>
                        <td>{climate.summary.etoAnnualMm ?? "—"} mm/yr</td>
                        <td>
                          FAO-56 Penman–Monteith, computed from the POWER inputs above
                        </td>
                      </tr>
                      <tr>
                        <td className="mono">ET₀ input coverage</td>
                        <td>
                          {climate.summary.etoStatus === "complete"
                            ? "Every required POWER variable present on every day"
                            : climate.summary.etoStatus === "partial"
                              ? "Some days miss a required POWER variable and are excluded"
                              : "No day had all required variables"}
                        </td>
                        <td>
                          {climate.summary.etoDaysComputed}/{climate.summary.etoDaysTotal} days
                        </td>
                      </tr>
                      <tr>
                        <td className="mono">Window</td>
                        <td>
                          {climate.summary.startDate} → {climate.summary.endDate}
                        </td>
                        <td>{climate.summary.days} daily records</td>
                      </tr>
                      <tr>
                        <td className="mono">Fetched</td>
                        <td>{new Date(climate.fetchedAtIso ?? "").toLocaleString()}</td>
                        <td>
                          {climate.cache === "server_cache"
                            ? "served from local cache — may be older than the field"
                            : "live request"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {climate.summary.etoStatus !== "complete" && (
                  <Note tone="harvest" glyph="info">
                    <strong>ET₀ is estimated from partial records.</strong> Only{" "}
                    {climate.summary.etoDaysComputed} of {climate.summary.etoDaysTotal} daily
                    records had every FAO-56 input ({climate.summary.etoRequiredInputs.join(", ")}).
                    Missing days are excluded; this is not presented as a complete FAO-56
                    series, and an unavailable ETo stays unavailable rather than being
                    replaced by a measured-looking number.
                  </Note>
                )}

                <div className="row" style={{ gap: 8 }}>
                  <ProofChip
                    proof={PROOFS.nasaPowerLive(
                      `NASA POWER daily AG endpoint for ${metrics.centroidLat.toFixed(
                        4,
                      )}, ${metrics.centroidLon.toFixed(4)}. Parameters: ${climate.summary.parameters.join(
                        ", ",
                      )}; time standard ${climate.summary.timeStandard}; ${climate.summary.days} daily records.`,
                    )}
                  />
                  <span className="badge badge--soft badge--est">
                    <Glyph name="info" size={12} />
                    ETo: FAO-56 Penman–Monteith from POWER inputs
                  </span>
                </div>

                <details>
                  <summary className="small" style={{ cursor: "pointer" }}>
                    Show the last 10 daily records
                  </summary>
                  <div className="table-wrap" style={{ marginTop: 10 }}>
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Tmax</th>
                          <th>Tmin</th>
                          <th>Rain</th>
                          <th>RH</th>
                          <th>Wind</th>
                          <th>Solar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {climate.daySample.map((day) => (
                          <tr key={day.date}>
                            <td className="mono">{day.date}</td>
                            <td>{day.t2mMax ?? "—"}</td>
                            <td>{day.t2mMin ?? "—"}</td>
                            <td>{day.precipMm ?? "—"}</td>
                            <td>{day.rh2m ?? "—"}</td>
                            <td>{day.ws2m ?? "—"}</td>
                            <td>{day.srad ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                <Note tone="sky" glyph="info">
                  POWER is gridded agroclimatology, not a station in your field. Native
                  resolution differs by parameter, and the daily series lags real time.
                  Nothing here proves water savings or entitlement.
                </Note>
              </div>
            )}
          </Card>

          <Card
            glyph="drop"
            title="Water supply & system"
            hint="These are management facts only you can supply. They set the context; they do not become efficiency scores."
          >
            <div className="field" style={{ marginBottom: 16 }} data-gate="water-regime">
              <span className="label">
                Supply regime
                <ProofChip proof={PROOFS.userInput("Supply regime")} />
              </span>
              <div className="choice-grid">
                {REGIMES.map((regime) => (
                  <button
                    key={regime.value}
                    type="button"
                    className="choice"
                    aria-pressed={state.water.regime === regime.value}
                    onClick={() => setWater({ regime: regime.value })}
                  >
                    <span className="choice__title">{regime.label}</span>
                    <span className="choice__note">{regime.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <span className="label">Delivery method</span>
              <div className="choice-grid">
                {SYSTEMS.map((system) => (
                  <button
                    key={system.value}
                    type="button"
                    className="choice"
                    aria-pressed={state.water.system === system.value}
                    onClick={() => setWater({ system: system.value })}
                  >
                    <span className="choice__title">{system.label}</span>
                    <span className="choice__note">{system.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="label">Source</span>
              <div className="choice-grid">
                {SOURCES.map((source) => (
                  <button
                    key={source.value}
                    type="button"
                    className="choice"
                    aria-pressed={state.water.source === source.value}
                    onClick={() => setWater({ source: source.value })}
                  >
                    <span className="choice__title">{source.label}</span>
                    <span className="choice__note">{source.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-fields" style={{ marginTop: 16 }}>
              <Field
                label="Seasonal allocation"
                hint="From the irrigation authority or your pump records. Leave empty if unknown."
              >
                <div className="input-group">
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="—"
                    value={state.water.quotaMm}
                    onChange={(event) => setWater({ quotaMm: event.target.value })}
                  />
                  <span className="input-group__suffix">mm / season</span>
                </div>
              </Field>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card
            glyph="flask"
            title="Water quality"
            hint="No satellite measures the EC in your canal. Type the measured number from your water report; leave it empty to use the source default."
          >
            <div className="stack" style={{ gap: 14 }}>
              <SmartInput
                fieldKey="ecwDsm"
                label="ECw"
                unit="dS/m"
                value={state.water.ecwDsm}
                proof={<ProofChip proof={PROOFS.labMeasurement("ECw")} compact />}
                gate="water-ecw"
                hint="Irrigation-water electrical conductivity. It sets the salinity floor of the field."
                fallback={ecwFallback}
                onValue={(next) => setWater({ ecwDsm: next })}
              />
              <Note tone="harvest" glyph="alert">
                The salt balance uses a typed ECw as MEAS; when the box is blank it falls
                back to the source default (EST), or to no irrigation ECw under rain-fed.
                The sodium-adsorption ratio (SARw) field was removed because it only fed
                the infiltration estimate, which the plan does not read.
              </Note>
            </div>
          </Card>

          <Card glyph="cloud" title="NASA data pipeline">
            <div className="stack" style={{ gap: 2 }}>
              {NASA_PRODUCTS.map(([name, use, _id, status]) => (
                <div key={name} className="kv">
                  <span className="kv__k">
                    <strong style={{ color: "var(--ink)" }}>{name}</strong>
                    <br />
                    <span className="small">{use}</span>
                  </span>
                  <span className="kv__v">
                    {status === "wired" ? (
                      <span className="badge badge--open">wired</span>
                    ) : status === "visual" ? (
                      <span className="badge badge--info">map layer</span>
                    ) : (
                      <span className="badge badge--none">next</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="small" style={{ marginTop: 10 }}>
              POWER is the only climate layer that enters a calculation today. GIBS
              layers are visual only; SMAP L4, GPM IMERG and ECOSTRESS are the next
              data joins for the AI feature store.
            </p>
          </Card>
        </div>
      </div>

      <StepNav
        step="water"
        back="soil"
        next="priorities"
        navigate={navigate}
        hint="Next: tell the advisor what matters to you."
      />
    </main>
  );
}
