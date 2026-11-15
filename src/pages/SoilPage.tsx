import { useMemo, useState } from "react";
import { useWorkspace } from "../state/workspace";
import { Card, Field, Note, PageHead, Seg, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { PROOFS, ProofChip } from "../ui/proof";
import { OBSERVATIONS } from "../data/observations";
import { OBSERVATION_COUNT, parseNum, textureClassFromFractions } from "../engine/agronomy";
import { SetupRail, StepNav } from "./shared";
import type { RouteKey } from "../app/router";
import { EMPTY_LAB, type LabSoil } from "../state/model";
import { SmartInput } from "../components/SmartInput";
import { validateSingleField } from "../engine/validation";
import { workspaceToAgronomicVector } from "../engine/estimate";
import { observationFallback, observationProxy } from "../data/observationProxy";

/**
 * Correct data label per input section, copied from the v5 evidence matrix.
 * Kept local so the evidence dataset stays in its lazy-loaded chunk instead of
 * being pulled into the initial Soil page bundle.
 */
const DATA_LABELS: Record<number, string> = {
  2: "Farmer observation / mapped estimate / lab measurement kept separate",
  3: "Measured bulk density / qualitative compaction flag",
  8: "Lab-measured / mapped estimate / visual clue",
  9: "Lab ECe or remote-sensing anomaly flag",
  12: "Lab or mapped estimate; separate properties",
};

type Tab = "observe" | "lab";

/** The only lab fields the plan actually reads. */
const LAB_GROUPS: {
  title: string;
  glyph: "layers" | "flask";
  hint: string;
  fields: {
    key: keyof LabSoil;
    label: string;
    unit: string;
    placeholder: string;
    section: number;
    /** Texture fractions stay number-only: no tactile class may become a %. */
    numberOnly?: boolean;
  }[];
}[] = [
  {
    title: "Texture & structure — the physical tests that drive the model",
    glyph: "layers",
    hint: "Enter the fractions from the lab report. The USDA class is derived from your numbers, not from a ribbon feeling.",
    fields: [
      { key: "sandPct", label: "Sand", unit: "%", placeholder: "e.g. 32", section: 2, numberOnly: true },
      { key: "siltPct", label: "Silt", unit: "%", placeholder: "e.g. 38", section: 2, numberOnly: true },
      { key: "clayPct", label: "Clay", unit: "%", placeholder: "e.g. 30", section: 2, numberOnly: true },
      { key: "bulkDensity", label: "Bulk density", unit: "g/cm³", placeholder: "e.g. 1.38", section: 3 },
    ],
  },
  {
    title: "Chemistry the model or a rule actually reads",
    glyph: "flask",
    hint: "pH, organic carbon and CEC are model inputs. ECe is the salinity-rule input and must come from a saturated paste.",
    fields: [
      { key: "ph", label: "pH (H₂O)", unit: "pH", placeholder: "e.g. 7.9", section: 8 },
      { key: "eceDsm", label: "ECe saturated paste", unit: "dS/m", placeholder: "e.g. 2.4", section: 9 },
      { key: "socPct", label: "Organic carbon (SOC)", unit: "%", placeholder: "e.g. 0.9", section: 12 },
      { key: "cec", label: "CEC", unit: "cmol/kg", placeholder: "e.g. 22", section: 12 },
    ],
  },
];

const LAB_META: Record<string, { label: string; unit: string; placeholder: string }> = {
  sandPct: { label: "Sand", unit: "%", placeholder: "e.g. 32" },
  siltPct: { label: "Silt", unit: "%", placeholder: "e.g. 38" },
  clayPct: { label: "Clay", unit: "%", placeholder: "e.g. 30" },
  bulkDensity: { label: "Bulk density", unit: "g/cm³", placeholder: "e.g. 1.38" },
  ph: { label: "pH (H₂O)", unit: "pH", placeholder: "e.g. 7.9" },
  eceDsm: { label: "ECe", unit: "dS/m", placeholder: "e.g. 2.4" },
  socPct: { label: "Organic carbon", unit: "%", placeholder: "e.g. 0.9" },
  cec: { label: "CEC", unit: "cmol/kg", placeholder: "e.g. 22" },
};

function InlineLabInput({
  labKey,
  value,
  onChange,
}: {
  labKey: keyof LabSoil;
  value: string;
  onChange: (value: string) => void;
}) {
  const meta = LAB_META[labKey];
  const issue = validateSingleField(labKey, value);
  if (!meta) return null;
  return (
    <div className="field" style={{ margin: 0 }}>
      <span
        className="label"
        style={{ fontSize: "0.78rem", marginBottom: 3, display: "flex", gap: 6, alignItems: "center" }}
      >
        Lab {meta.label}
        {value.trim() !== "" && (
          <span className="badge badge--soft badge--meas">MEAS</span>
        )}
      </span>
      <div className="input-group">
        <input
          className={`input ${issue ? "input--error" : ""}`}
          inputMode="decimal"
          placeholder={meta.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="input-group__suffix">{meta.unit}</span>
      </div>
      {issue && (
        <span className="hint" style={{ color: "var(--danger)" }}>
          {issue.title}
        </span>
      )}
    </div>
  );
}

export function SoilPage({ navigate }: { navigate: (route: RouteKey) => void }) {
  const { state, setLab, setObservation } = useWorkspace();
  const [tab, setTab] = useState<Tab>("observe");
  const lab = state.soil.lab;

  const sand = parseNum(lab.sandPct);
  const silt = parseNum(lab.siltPct);
  const clay = parseNum(lab.clayPct);
  const fractionsComplete = sand !== null && silt !== null && clay !== null;
  const textureClass = fractionsComplete
    ? textureClassFromFractions(sand as number, silt as number, clay as number)
    : null;

  const observationsRecorded = OBSERVATIONS.filter((observation) =>
    Boolean(state.soil.observations[observation.key]),
  ).length;
  const labValues = [
    "sandPct",
    "siltPct",
    "clayPct",
    "bulkDensity",
    "ph",
    "eceDsm",
    "socPct",
    "cec",
  ].filter((key) => String(lab[key as keyof LabSoil] ?? "").trim() !== "").length;

  const vector = useMemo(() => workspaceToAgronomicVector(state), [state]);
  const effectiveTexture = textureClassFromFractions(
    vector.soilPhysical.sandPercent,
    vector.soilPhysical.siltPercent,
    vector.soilPhysical.clayPercent,
  );
  const provenanceLabel = (key: string) => {
    const source = vector.provenance[key]?.source;
    if (source === "MEAS") return "MEAS · lab";
    if (source === "EST") return "EST · field/derived";
    if (source === "EO_PRIOR") return "prior/default";
    return "engine default";
  };

  /** What the engine actually uses when a lab box is empty. */
  const engineFallback = (key: keyof LabSoil): string => {
    switch (key) {
      case "sandPct":
        return `engine default ${vector.soilPhysical.sandPercent.toFixed(0)}% (EST)`;
      case "siltPct":
        return `engine default ${vector.soilPhysical.siltPercent.toFixed(0)}% (EST)`;
      case "clayPct":
        return `engine default ${vector.soilPhysical.clayPercent.toFixed(0)}% (EST)`;
      case "bulkDensity":
        return `≈ ${vector.soilPhysical.bulkDensityGCm3.toFixed(2)} g/cm³ (EST, derived)`;
      case "ph":
        return `≈ ${vector.soilChemical.phH2o.toFixed(1)} (prior/default)`;
      case "eceDsm":
        return `≈ ${vector.soilChemical.eceDsm.toFixed(2)} dS/m (prior/default)`;
      case "socPct":
        return `≈ ${vector.soilChemical.socPercent.toFixed(2)}% (EST, derived)`;
      case "cec":
        return `≈ ${vector.soilChemical.cecCmolKg.toFixed(1)} cmol/kg (EST, derived)`;
      default:
        return "engine default (EST)";
    }
  };
  const labFallback = (key: keyof LabSoil) =>
    observationFallback(key, state) ?? engineFallback(key);

  return (
    <main className="page">
      <PageHead
        eyebrow="Step 02 · Soil"
        glyph="layers"
        title={
          <>
            Observe freely. <em>Measure</em> before you decide.
          </>
        }
        lede="A field answer stays an estimate; a lab number replaces it. Every value says which one it is, and what the engine actually used."
        actions={
          <div className="row">
            <span className="badge badge--soft badge--est">
              {observationsRecorded}/{OBSERVATION_COUNT} observations
            </span>
            <span className="badge badge--soft badge--meas">{labValues} lab values</span>
          </div>
        }
      />

      <SetupRail current="soil" navigate={navigate} />

      <div className="split">
        <div className="stack">
          <Card
            glyph="book"
            title="The soil notebook"
            hint="Answer what you can actually see. The number the engine substitutes is shown beside every answer."
            aside={
              <Seg<Tab>
                ariaLabel="Soil sections"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "observe", label: "Observations" },
                  { value: "lab", label: "Lab results" },
                ]}
              />
            }
          >
            {tab === "observe" && (
              <div
                className="grid grid--2"
                style={{ gap: 12 }}
                data-gate="soil-observation"
                tabIndex={-1}
              >
                {OBSERVATIONS.map((observation) => {
                  const selected = state.soil.observations[observation.key];
                  const proxy = observationProxy(observation.key, selected, state);
                  return (
                    <div
                      key={observation.key}
                      className="card card--flat"
                      style={{ padding: 16, background: "var(--paper-deep)" }}
                    >
                      <div className="row row--between" style={{ alignItems: "flex-start", gap: 8 }}>
                        <div style={{ display: "flex", gap: 8, minWidth: 0, flex: 1 }}>
                          <span style={{ flexShrink: 0, marginTop: 2, display: "inline-flex" }}>
                            <Glyph name={observation.glyph} size={16} />
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 650, fontSize: 13.5, lineHeight: 1.35, wordBreak: "break-word" }}>
                              {observation.question}
                            </div>
                            <div className="hint" style={{ marginTop: 3, wordBreak: "break-word" }}>
                              {observation.hint}
                            </div>
                          </div>
                        </div>
                        <span className="mono" style={{ color: "var(--ink-faint)", flexShrink: 0, marginLeft: "auto" }}>
                          §{observation.section}
                        </span>
                      </div>

                      <div className="row" style={{ gap: 6, marginTop: 10 }}>
                        {observation.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="chip-toggle"
                            aria-pressed={selected === option.value}
                            title={observationProxy(observation.key, option.value, state)?.value ?? "No number substituted"}
                            onClick={() =>
                              setObservation(
                                observation.key,
                                selected === option.value ? null : option.value,
                              )
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {selected ? (
                        proxy ? (
                          <div className="estimate-card" style={{ marginTop: 10 }}>
                            <div className="row row--between" style={{ alignItems: "center" }}>
                              <span className="badge badge--soft badge--est">EST proxy</span>
                              <span className="small">
                                {proxy.role === "rule" ? "Physics rule · not AI" : "AI input"}
                              </span>
                            </div>
                            <div className="small" style={{ marginTop: 4 }}>
                              <strong>{proxy.value}</strong>
                            </div>
                            <div className="small" style={{ marginTop: 2, color: "var(--ink-faint)" }}>
                              {proxy.detail}
                            </div>
                            {proxy.overridden && (
                              <div className="small" style={{ marginTop: 4, color: "var(--harvest)" }}>
                                A lab value is filled in, so the engine ignores this answer.
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="hint" style={{ marginTop: 10 }}>
                            No number is substituted for this answer.
                          </p>
                        )
                      ) : (
                        <p className="hint" style={{ marginTop: 10 }}>
                          Pick an answer to see the number the engine substitutes.
                        </p>
                      )}

                      {proxy && proxy.labKeys.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div className="small" style={{ marginBottom: 4 }}>
                            Have the lab number? Type it here.
                          </div>
                          <div className="grid-fields" style={{ gap: 8 }}>
                            {proxy.labKeys.map((labKey) => (
                              <InlineLabInput
                                key={labKey}
                                labKey={labKey}
                                value={lab[labKey]}
                                onChange={(next) => setLab({ [labKey]: next } as Partial<LabSoil>)}
                              />
                            ))}
                          </div>
                          <p className="hint" style={{ marginTop: 4 }}>
                            {observation.key === "textureRibbon"
                              ? "A typed lab number is a measurement. All three fractions are needed before they replace the ribbon estimate."
                              : "A typed lab number is a measurement and replaces the field estimate."}
                          </p>
                        </div>
                      )}

                      {selected && proxy && proxy.labKeys.length === 0 && (
                        <p className="hint" style={{ marginTop: 10 }}>
                          No laboratory number replaces this answer in this build. It stays a field estimate.
                        </p>
                      )}

                      <details style={{ marginTop: 10 }}>
                        <summary className="hint" style={{ cursor: "pointer" }}>
                          What each answer becomes
                        </summary>
                        <div className="stack" style={{ gap: 4, marginTop: 6 }}>
                          {observation.options.map((option) => {
                            const optionProxy = observationProxy(observation.key, option.value, state);
                            return (
                              <div key={option.value} className="small" style={{ color: "var(--ink-soft)" }}>
                                <strong>{option.label}</strong> →{" "}
                                {optionProxy ? optionProxy.value : "no number substituted"}
                              </div>
                            );
                          })}
                          <div className="small" style={{ color: "var(--ink-faint)", marginTop: 4 }}>
                            {observation.removedInference}. A lab test replaces it: {observation.replacesWith}.
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "lab" && (
              <div className="stack" style={{ gap: 22 }}>
                <Note tone="forest" glyph="flask">
                  Type the number from the report. A typed value is recorded as a measurement
                  (MEAS). A complete pH, ECe, organic-carbon or bulk-density value replaces its
                  field estimate; texture needs all three fractions before it replaces the
                  ribbon answer. Leave a box empty if you do not have the test — the engine
                  will use the estimate named under that field.
                </Note>

                <Note tone="sky" glyph="info">
                  <strong>Why only these fields.</strong> The trained model reads texture
                  (sand/silt/clay), bulk density, pH, organic carbon, CEC, drainage, annual
                  ETo and slope. The formal salinity check reads measured ECe; the rotation
                  simulator can use the EST proxy when ECe is blank. The water rule reads
                  measured ECw and the seasonal allocation. ESP, CaCO₃, N/P/K, the terrain
                  wetness index (TWI) and the ponding/rooting/fizz/dispersion answers do not
                  change the plan, so they are no longer asked for here.
                </Note>

                {LAB_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="row" style={{ marginBottom: 8 }}>
                      <Glyph name={group.glyph} size={16} />
                      <h3 className="h3" style={{ fontSize: 16 }}>
                        {group.title}
                      </h3>
                    </div>
                    <p className="hint" style={{ marginBottom: 12 }}>
                      {group.hint}
                    </p>
                    <div className="grid-fields">
                      {group.fields.map((field) => {
                        const fallback = labFallback(field.key);
                        const valIssue = validateSingleField(field.key, lab[field.key]);
                        return field.numberOnly ? (
                          <Field
                            key={field.key}
                            label={
                              <span className="row" style={{ gap: 6 }}>
                                {field.label}
                                {String(lab[field.key]).trim() !== "" && (
                                  <span className="badge badge--soft badge--meas">MEAS</span>
                                )}
                              </span>
                            }
                            proof={<ProofChip proof={PROOFS.labMeasurement(field.label)} compact />}
                          >
                            <div className="input-group">
                              <input
                                className={`input ${valIssue ? "input--error" : ""}`}
                                inputMode="decimal"
                                placeholder={field.placeholder}
                                value={lab[field.key]}
                                onChange={(event) => setLab({ [field.key]: event.target.value })}
                              />
                              <span className="input-group__suffix">{field.unit}</span>
                            </div>
                            {valIssue && (
                              <div
                                className="note note--danger"
                                style={{ marginTop: 6, padding: "4px 8px", fontSize: "0.80rem" }}
                              >
                                <Glyph name="alert" size={13} className="note__icon" />
                                <div>
                                  <strong>{valIssue.title}:</strong> {valIssue.message}
                                </div>
                              </div>
                            )}
                            {!String(lab[field.key]).trim() && fallback && (
                              <span className="hint">If blank: {fallback}</span>
                            )}
                            <span className="hint">Data label: {DATA_LABELS[field.section]}</span>
                          </Field>
                        ) : (
                          <SmartInput
                            key={field.key}
                            fieldKey={field.key}
                            label={field.label}
                            unit={field.unit}
                            placeholder={field.placeholder}
                            value={lab[field.key]}
                            dataLabel={DATA_LABELS[field.section]}
                            gate={field.key === "eceDsm" ? "soil-ece" : undefined}
                            fallback={fallback}
                            onValue={(next) => setLab({ [field.key]: next })}
                          />
                        );
                      })}
                    </div>
                    {group.title.startsWith("Texture") && (
                      <div className="note note--sky" style={{ marginTop: 12 }}>
                        <Glyph name="info" size={16} className="note__icon" />
                        <div>
                          {!fractionsComplete && (
                            <>
                              Texture fractions are a laboratory analysis in this matrix;
                              they are not inferred from how the soil feels. Enter the three
                              report numbers directly above.{" "}
                              {(sand !== null || silt !== null || clay !== null) && (
                                <>
                                  You have entered part of the analysis; the engine keeps
                                  the ribbon estimate until all three fractions are present.{" "}
                                </>
                              )}
                            </>
                          )}
                          {textureClass ? (
                            <>
                              Your measured fractions classify as{" "}
                              <strong>{textureClass}</strong> (nearest USDA class).
                              {Math.abs(((sand as number) + (silt as number) + (clay as number)) - 100) > 3 && (
                                <> The three fractions sum to{" "}
                                {((sand as number) + (silt as number) + (clay as number)).toFixed(1)}%,
                                not 100% — check the report.</>
                              )}
                            </>
                          ) : (
                            <>All three fractions are needed to replace the ribbon estimate. This is a classification of your measured fractions, not a pedotransfer estimate.</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="row">
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => setLab({ ...EMPTY_LAB })}
                  >
                    Clear all lab values
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card glyph="flask" title="What the engine will use" wash>
            <div className="grid grid--2" style={{ gap: 10 }}>
              <Stat
                value={effectiveTexture}
                label="Texture"
                foot={provenanceLabel("soilTexture")}
                tone={vector.provenance.soilTexture?.source === "MEAS" ? "forest" : "harvest"}
              />
              <Stat
                value={`${vector.soilChemical.eceDsm.toFixed(2)} dS/m`}
                label="ECe"
                foot={provenanceLabel("eceDsm")}
                tone={vector.provenance.eceDsm?.source === "MEAS" ? "forest" : "harvest"}
              />
              <Stat
                value={vector.soilChemical.phH2o.toFixed(1)}
                label="pH"
                foot={provenanceLabel("phH2o")}
              />
              <Stat
                value={`${vector.soilChemical.socPercent.toFixed(2)}%`}
                label="Organic carbon"
                foot={provenanceLabel("somPercent")}
              />
              <Stat
                value={`${vector.soilPhysical.bulkDensityGCm3.toFixed(2)} g/cm³`}
                label="Bulk density"
                foot={provenanceLabel("bulkDensityGCm3")}
              />
              <Stat
                value={`${vector.soilChemical.cecCmolKg.toFixed(1)} cmol/kg`}
                label="CEC"
                foot={provenanceLabel("cecCmolKg")}
              />
            </div>

            {tab === "observe" && (
              <div style={{ marginTop: 14 }}>
                <div className="small" style={{ marginBottom: 4 }}>
                  Have the lab CEC? Type it here.
                </div>
                <InlineLabInput
                  labKey="cec"
                  value={lab.cec}
                  onChange={(next) => setLab({ cec: next })}
                />
                {String(lab.cec).trim() === "" && (
                  <span className="hint">If blank: {labFallback("cec")}</span>
                )}
              </div>
            )}

            <p className="hint" style={{ marginTop: 14 }}>
              MEAS is a typed lab number. EST is a field-answer proxy. The engine uses
              the lab value first and falls back to the proxy only while the lab field is
              empty. ECe is kept because the salinity rule reads it: the formal crop
              check accepts only a measured saturated-paste ECe, while the six-season
              simulator uses the EST proxy when no lab ECe is present. The trained model
              itself is salinity-blind.
            </p>
          </Card>

          <Card glyph="info" title="A note on precision">
            <p className="small" style={{ lineHeight: 1.65 }}>
              An observation never becomes a laboratory measurement. Choosing an answer
              writes an EST proxy; typing a lab number writes MEAS. The board shows both,
              so you can see which one the engine actually used.
            </p>
            <p className="hand" style={{ marginTop: 12 }}>
              Measured beats inferred — every time.
            </p>
          </Card>
        </div>
      </div>

      <StepNav
        step="soil"
        back="field"
        next="water"
        navigate={navigate}
        hint="Next: climate context from NASA, water chemistry from your lab."
      />
    </main>
  );
}
