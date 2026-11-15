import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "../state/workspace";
import { Card, Empty, Field, PageHead, Seg, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { CROP_CATALOG, cropById } from "../data/catalog";
import {
  alternativeCrops,
  cropFitScore,
  evaluateSlot,
  planCoverage,
  type Alternative,
} from "../engine/agronomy";
import { SLOT_META } from "../state/model";
import { CropSelect } from "./shared";
import { buildYearOneFill, buildFullPlanOptimization } from "../engine/autofill";
import { buildAiInputContractFromWorkspace } from "../engine/estimate";
import { loadSurrogateWeights, slotFitModel } from "../engine/fitModel";
import type { SurrogateWeights } from "../engine/optimizer";
import { SproutLoader } from "../ui/SproutLoader";
import { RotationCompare } from "../components/RotationCompare";
import type { RouteKey } from "../app/router";

function plainReasons(alternative: Alternative): string[] {
  const reasons: string[] = [];
  if (alternative.breaksFamily) reasons.push("Changes the crop family");
  if (alternative.seasonMatch) reasons.push("Fits this season");
  if (alternative.salinity.state === "below") reasons.push("Handles your salinity");
  if (alternative.crop.family === "Fabaceae") reasons.push("Adds a legume");
  if (alternative.crop.isCoverCrop) reasons.push("Cover / forage option");
  return reasons;
}

function plainTradeoffs(alternative: Alternative): string[] {
  const tradeoffs: string[] = [];
  if (!alternative.seasonMatch) tradeoffs.push("Outside this season's window");
  if (alternative.breaksFamily === false) tradeoffs.push("Repeats the previous family");
  if (alternative.salinity.state === "above") tradeoffs.push("Salinity is above its tolerance");
  if (alternative.crop.isCoverCrop) tradeoffs.push("Cover option, not a cash harvest");
  return tradeoffs;
}

export function PlanPage({ navigate }: { navigate: (route: RouteKey) => void }) {
  const { state, setSlotCrop, setPlan, resetWorkspace } = useWorkspace();
  const [selected, setSelected] = useState<number | null>(null);
  const [cropPickerOpen, setCropPickerOpen] = useState(false);
  const [view, setView] = useState<"board" | "compare">("board");
  const [confirmReset, setConfirmReset] = useState(false);
  const [weights, setWeights] = useState<SurrogateWeights | null | undefined>(undefined);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillNote, setAutofillNote] = useState<string | null>(null);
  // idle → running → done. StrictMode mounts effects twice in development, so
  // the guard is cleared when an interrupted run is cleaned up instead of
  // staying "started" forever (the old ref bug left Year 1 empty in dev).
  const autofillStatus = useRef<"idle" | "running" | "done">("idle");

  useEffect(() => {
    let alive = true;
    loadSurrogateWeights().then((loaded) => {
      if (alive) setWeights(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Opening the board asks the AI to optimize all 3 years: all 6 warm and cool
  // seasons are filled sequentially from the AI-First neural engine with
  // biophysical safety guardrails, so the farmer starts from a fully realized
  // 3-year rotation instead of six empty slots. The first run also selects
  // Season 1 so the "Best 3" card appears immediately.
  useEffect(() => {
    if (weights === undefined) return;
    if (autofillStatus.current === "done" || autofillStatus.current === "running") return;

    const emptySlots = [0, 1, 2, 3, 4, 5].filter((index) => !state.plan.slots[index]?.cropId);
    if (emptySlots.length === 0) {
      autofillStatus.current = "done";
      setAutofilling(false);
      return;
    }

    autofillStatus.current = "running";
    setAutofilling(true);
    setAutofillNote(null);
    let cancelled = false;

    // A short, visible pause lets the loader paint before the synchronous model
    // forward pass; the pass itself is milliseconds on this 40→64→32→4 network.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const fill = buildFullPlanOptimization(state, weights ?? null);
      if (fill.picks.length > 0) {
        setPlan({ slots: fill.slots });
        setAutofillNote(
          "All 3 years optimized by the AI-First neural engine with biophysical safety guardrails.",
        );
      }
      if (selected === null) setSelected(0);
      autofillStatus.current = "done";
      setAutofilling(false);
    }, 550);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (autofillStatus.current === "running") autofillStatus.current = "idle";
    };
  }, [weights, state, setPlan, selected]);

  useEffect(() => {
    if (!cropPickerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCropPickerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cropPickerOpen]);

  const coverage = planCoverage(state);
  const meta = selected !== null ? SLOT_META[selected] : null;
  const slot = selected !== null ? state.plan.slots[selected] : null;
  const crop = cropById(slot?.cropId ?? null);
  const evaluation = selected !== null && crop ? evaluateSlot(state, selected) : null;
  const fit = useMemo(
    () => (selected !== null ? slotFitModel(state, selected, weights ?? null) : null),
    [state, selected, weights],
  );
  const alternatives =
    selected !== null ? alternativeCrops(state, selected, 3, fit) : [];
  const cropScore = selected !== null ? cropFitScore(state, selected, fit) : null;
  const best = alternatives[0];
  const previousCrop = cropById(state.priorities.previousCropId);

  const findings = evaluation?.findings ?? [];
  const advantages = findings.filter((finding) => finding.severity === "info");
  const concerns = findings.filter((finding) => finding.severity !== "info");

  const aiInputContract = useMemo(() => buildAiInputContractFromWorkspace(state), [state]);

  const exportJson = useMemo(
    () => () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        field: state.field,
        priorities: state.priorities,
        plan: state.plan,
        coverage,
        aiInputContract,
        normalizedAgronomicVector32: aiInputContract.normalizedVector32,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `agrorotate-plan-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [state, coverage, aiInputContract],
  );

  return (
    <main className="page">
      <PageHead
        eyebrow="The plan · 3 years · 6 seasons"
        glyph="calendar"
        title={
          <>
            Your <em>best three</em>, season by season.
          </>
        }
        lede="Select a season to see its pen and the strongest fits."
        actions={
          <div className="row">
            <Seg<"board" | "compare">
              ariaLabel="Plan view"
              value={view}
              onChange={setView}
              options={[
                { value: "board", label: "Board" },
                { value: "compare", label: "Compare 4 (AI)" },
              ]}
            />
            <button type="button" className="btn btn--small" onClick={exportJson}>
              <Glyph name="download" size={14} />
              Export JSON
            </button>
          </div>
        }
      />

      <div className="plan-work">
        <div className="stack">
          {view === "compare" && (
            <Card
              glyph="scales"
              title="Compare Pareto Rotations"
              hint="Evaluate the 4 Pareto-optimal AI trajectories (Baseline, Max Profit, Water Saving, Soil Regeneration) side by side."
            >
              <RotationCompare
                state={state}
                onApply={(slots, label) => {
                  setPlan({
                    title: `${label} · three years`,
                    slots: state.plan.slots.map((item, index) => ({
                      ...item,
                      cropId: slots[index] ?? null,
                    })),
                  });
                  setSelected(null);
                  setView("board");
                }}
              />
            </Card>
          )}

          <Card
            id="plan-board"
            glyph="layers"
            title="The board"
            style={view === "compare" ? { display: "none" } : undefined}
            hint="Click a season to select it. Cool and warm seasons alternate."
            aside={
              <div className="row card__actions" style={{ gap: 8 }}>
                {weights === undefined && (
                  <span className="badge badge--soft badge--info">
                    <SproutLoader size="xs" label="Loading the AI model" />
                    Loading AI model…
                  </span>
                )}
                {autofilling && (
                  <span className="badge badge--soft badge--info">
                    <SproutLoader size="xs" label="Optimizing all 3 years" />
                    AI optimizing all 3 years…
                  </span>
                )}
                <span className="badge badge--soft badge--none">
                  {coverage.filled}/6 filled
                </span>
                <span className="badge badge--soft badge--sky" title="Ready for Multi-Season AI Optimization Contract">
                  <Glyph name="sparkle" size={12} /> AI Inference Ready
                </span>
                <button
                  type="button"
                  className="btn btn--small btn--primary"
                  title="Automatically optimize all 6 seasons using the top AI recommendations"
                  onClick={() => {
                    const full = buildFullPlanOptimization(state, weights ?? null);
                    setPlan({ slots: full.slots });
                    setAutofillNote(
                      "All 3 years optimized by the AI-First neural engine with biophysical safety guardrails.",
                    );
                    setSelected(0);
                  }}
                >
                  <Glyph name="sparkle" size={12} />
                  AI Auto-Fill Plan
                </button>
                {coverage.filled > 0 && (
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() =>
                      setPlan({
                        slots: state.plan.slots.map((item) => ({ ...item, cropId: null })),
                      })
                    }
                  >
                    Clear board
                  </button>
                )}
              </div>
            }
          >
            {(autofilling || autofillNote) && (
              <div className="ai-fill" role="status" aria-live="polite">
                {autofilling ? (
                  <>
                    <SproutLoader size="sm" label="AI optimizing all 3 years" />
                    <div>
                      <strong>AI is optimizing all 3 years…</strong>
                      <span>
                        Reading the trained yield-gap head and your four priorities, then
                        evaluating the 6-season sequence against biophysical guardrails.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="ai-fill__tick" aria-hidden="true">✓</span>
                    <div>
                      <strong>All 3 years are ready.</strong>
                      <span>{autofillNote}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="board">
              {[1, 2, 3].map((year) => (
                <div className="year-col" key={year}>
                  <div className="year-col__head">
                    <span className="year-col__title">Year {year}</span>
                    <span className="small">
                      {year === 1 ? "opening year" : year === 3 ? "closing year" : "middle year"}
                    </span>
                  </div>
                  {[0, 1].map((half) => {
                    const index = (year - 1) * 2 + half;
                    const itemMeta = SLOT_META[index];
                    const itemCrop = cropById(state.plan.slots[index]?.cropId ?? null);
                    const itemEvaluation = itemCrop ? evaluateSlot(state, index) : null;
                    return (
                      <button
                        key={index}
                        type="button"
                        className={`season-card${selected === index ? " is-selected" : ""}`}
                        onClick={() => setSelected(index)}
                        aria-pressed={selected === index}
                      >
                        <div className="season-card__top">
                          <span className="season-card__season">
                            {itemMeta.season === "cool" ? "Cool" : "Warm"} · {itemMeta.months}
                          </span>
                          {itemCrop && (
                            <span className="season-card__dots" aria-hidden="true">
                              <span
                                className={`dot dot--${
                                  itemEvaluation?.verdict === "conflict"
                                    ? "bad"
                                    : itemEvaluation?.verdict === "caution"
                                      ? "warn"
                                      : "ok"
                                }`}
                              />
                            </span>
                          )}
                        </div>
                        <span className={`season-card__crop${itemCrop ? "" : " is-empty"}`}>
                          {itemCrop?.name ?? "Empty season"}
                        </span>
                        <span className="season-card__meta">
                          {itemCrop ? itemCrop.family : "Select to edit →"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          {view === "board" && (
            <Card
              glyph={crop ? "sprout" : "pen"}
              title={meta ? `${meta.label}${crop ? ` · ${crop.name}` : " · empty"}` : "Select a season"}
              hint={
                meta
                  ? "The pen opens the crop picker. AI suggestions are read-only — use the pen to change the season yourself."
                  : "Pick a season on the board first; its pen will appear here."
              }
              aside={
                meta ? (
                  <div className="row" style={{ gap: 12 }}>
                    {cropScore !== null && (
                      <span
                        className="best-pick__score season-score"
                        title="Hybrid fit score for this crop (0–100): model/floor yield term blended with your priorities — same basis as the suggestions below"
                      >
                        <strong>{cropScore}</strong>
                        <small>/100</small>
                      </span>
                    )}
                    <button
                      type="button"
                      className="edit-pen"
                      onClick={() => setCropPickerOpen(true)}
                      aria-label="Edit the crop in this season"
                      title="Edit this season"
                    >
                      <Glyph name="pen" size={15} />
                    </button>
                  </div>
                ) : undefined
              }
            >
              {!meta ? (
                <Empty title="No season selected" glyph="layers">
                  Click any season on the board. A pen will appear here for editing.
                </Empty>
              ) : !crop ? (
                <div className="stack" style={{ gap: 10 }}>
                  <p className="small" style={{ margin: 0 }}>
                    This season is empty. Use the pen to choose a crop manually.
                  </p>
                  <button
                    type="button"
                    className="btn btn--small btn--primary"
                    onClick={() => setCropPickerOpen(true)}
                  >
                    <Glyph name="pen" size={13} />
                    Choose a crop
                  </button>
                </div>
              ) : (
                <details className="season-details">
                  <summary>Advantages and trade-offs</summary>
                  <div className="season-details__body">
                    <div>
                      <h4>Works for you</h4>
                      {advantages.length > 0 ? (
                        <ul>
                          {advantages.map((finding) => (
                            <li key={finding.id}>
                              <span className="dot dot--ok" />
                              {finding.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small">No advantage was flagged for this season.</p>
                      )}
                    </div>
                    <div>
                      <h4>Trade-offs</h4>
                      {concerns.length > 0 ? (
                        <ul>
                          {concerns.map((finding) => (
                            <li key={finding.id}>
                              <span className="dot dot--warn" />
                              {finding.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small">No trade-off was flagged for this season.</p>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </Card>
          )}

          {view === "board" && meta && (
            <Card
              id="plan-best"
              glyph="sparkle"
              title={`Best 3 for ${meta.label}`}
              hint="Hybrid fit: real-v1's trained yield-gap head plus the biophysical floor, blended with your four priorities. Read-only — use the pen to change the season yourself."
              aside={
                <span
                  className="badge badge--soft badge--none"
                  title={
                    fit?.modelBacked
                      ? "At least one candidate was scored by the trained yield-gap head"
                      : "No trained row for these candidates: the biophysical floor alone answers"
                  }
                >
                  {fit?.modelBacked ? "trained yield head" : "physics floor"}
                </span>
              }
            >
              {alternatives.length === 0 ? (
                <Empty title="No candidates left" glyph="sprout">
                  Every crop is excluded in your priorities. Loosen an exclusion to see choices.
                </Empty>
              ) : (
                <div className="best-three">
                  {alternatives.map((alternative, index) => {
                    const tradeoffs = plainTradeoffs(alternative);
                    return (
                      <article
                        key={alternative.crop.id}
                        className={`best-pick${index === 0 ? " is-top" : ""}`}
                      >
                        <div className="best-pick__head">
                          <span className="best-pick__rank">#{index + 1}</span>
                          <span className="best-pick__body">
                            <strong>{alternative.crop.name}</strong>
                            <small>{plainReasons(alternative).join(" · ")}</small>
                          </span>
                          <span
                            className="best-pick__score"
                            title={
                              alternative.yieldSource === "model"
                                ? "Yield term: trained yield-gap head (agrorotate.surrogate_weights/real-v1), capped by the biophysical floor; blended with your four priority weights."
                                : alternative.yieldSource === "floor"
                                  ? "Yield term: biophysical floor (no trained row for this crop); blended with your four priority weights."
                                  : "No yield term for this crop; the sourced water, soil and risk rules answer."
                            }
                          >
                            <strong>{alternative.fitScore}</strong>
                            <small>/100</small>
                          </span>
                        </div>
                        <details className="best-pick__more">
                          <summary>Why this fits</summary>
                          <div className="best-pick__more-body">
                            <div className="row" style={{ gap: 6, marginBottom: 8 }}>
                              <span
                                className={`badge badge--soft ${
                                  alternative.yieldSource === "model"
                                    ? "badge--sky"
                                    : "badge--none"
                                }`}
                              >
                                <Glyph name="sparkle" size={11} />
                                {alternative.yieldSource === "model"
                                  ? "Trained yield head"
                                  : alternative.yieldSource === "floor"
                                    ? "Physics floor"
                                    : "No yield row"}
                              </span>
                              {alternative.yieldLossPct !== null && (
                                <span className="small">
                                  Yield term: −{alternative.yieldLossPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <ul>
                              {plainReasons(alternative).map((reason) => (
                                <li key={reason}>
                                  <span className="dot dot--ok" />
                                  {reason}
                                </li>
                              ))}
                              {tradeoffs.map((tradeoff) => (
                                <li key={tradeoff}>
                                  <span className="dot dot--warn" />
                                  {tradeoff}
                                </li>
                              ))}
                            </ul>
                            <span className="small">
                              {alternative.crop.family} · suggestion only
                            </span>
                          </div>
                        </details>
                      </article>
                    );
                  })}
                </div>
              )}
              <p className="small" style={{ marginTop: 12 }}>
                This score is a hybrid, not a hand-tuned rank. The yield term is{" "}
                <strong>agrorotate.surrogate_weights/real-v1</strong> — the trained
                MLP&nbsp;40→64→32→4 yield-gap head for 22 crops — or the biophysical
                floor where the crop has no training row; whichever is more conservative
                wins, and the badge on each card says which one ran. The water, soil and
                risk terms are sourced rules, and your four priority weights decide how
                much each term counts. It orders choices; it is not a yield promise.
              </p>
            </Card>
          )}
        </div>

        <div className="stack plan-summary-stack">
          <Card
            className="plan-summary"
            glyph="book"
            title="Your plan"
            hint="The whole six-season picture, in one panel."
            wash
          >
            <div className="plan-stats">
              <Stat
                value={`${coverage.filled}/6`}
                label="Seasons filled"
                foot={coverage.filled === 6 ? "board complete" : "build the rest"}
              />
              <Stat
                value={best ? best.fitScore : "—"}
                label="Top fit"
                foot={best?.crop.name ?? "Pick a season"}
                tone="forest"
              />
              <Stat
                value={alternatives.length}
                label="Choices ready"
                foot={meta ? `for ${meta.label}` : "select a season"}
              />
              <Stat
                value={coverage.conflicts}
                label="Conflicts"
                foot={coverage.conflicts > 0 ? "hard checks to fix" : "none flagged"}
                tone={coverage.conflicts > 0 ? "clay" : undefined}
              />
              <Stat
                value={coverage.cautions}
                label="Cautions"
                foot={coverage.cautions > 0 ? "read before planting" : "none flagged"}
                tone={coverage.cautions > 0 ? "harvest" : undefined}
              />
            </div>

            <div className="plan-summary__divide" />

            <div className="plan-summary__rows">
              <div className="kv">
                <span className="kv__k">Previous season</span>
                <span className="kv__v">{previousCrop?.name ?? "not recorded"}</span>
              </div>
              <div className="kv">
                <span className="kv__k">Field observations</span>
                <span className="kv__v">{coverage.observationsRecorded} recorded</span>
              </div>
              <div className="kv">
                <span className="kv__k">Lab values</span>
                <span className="kv__v">{coverage.labFieldsRecorded} recorded</span>
              </div>
              <div className="kv">
                <span className="kv__k">Plan window</span>
                <span className="kv__v">3 years · 6 seasons</span>
              </div>
            </div>

            <p className="hand plan-summary__foot">
              Scores order the choices; they are not a yield promise.
            </p>
          </Card>

          <section className="plan-reset plan-reset--rail">
            <div>
              <span className="eyebrow">Reset the plan</span>
              <h3>Clear everything and start from the field.</h3>
              <p className="small">
                This clears the field, soil, water, priorities, climate and plan, returns
                you to the first page, and locks every later step until you complete
                setup again.
              </p>
            </div>
            {confirmReset ? (
              <div className="row">
                <button
                  type="button"
                  className="btn btn--primary"
                  data-sound="resolve"
                  onClick={() => {
                    setConfirmReset(false);
                    resetWorkspace();
                    navigate("field");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Yes, reset everything
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="btn" onClick={() => setConfirmReset(true)}>
                <Glyph name="rotate" size={14} />
                Reset plan
              </button>
            )}
          </section>
        </div>
      </div>

      {cropPickerOpen && selected !== null && (
        <div
          className="choice-popup"
          role="dialog"
          aria-modal="true"
          aria-label="Choose the crop for this season"
          onClick={() => setCropPickerOpen(false)}
        >
          <div className="choice-popup__card" onClick={(event) => event.stopPropagation()}>
            <div className="choice-popup__head">
              <div>
                <span className="eyebrow">{SLOT_META[selected].label}</span>
                <h3>Choose a crop</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setCropPickerOpen(false)}
                aria-label="Close crop picker"
              >
                <Glyph name="close" size={15} />
              </button>
            </div>

            <Field label="Crop in this season">
              <CropSelect
                crops={CROP_CATALOG}
                value={slot?.cropId ?? null}
                onChange={(cropId) => setSlotCrop(selected, cropId)}
                placeholder="Choose a crop…"
              />
            </Field>

            <div className="row row--between">
              <button
                type="button"
                className="btn btn--small btn--ghost"
                disabled={!slot?.cropId}
                onClick={() => setSlotCrop(selected, null)}
              >
                Clear this season
              </button>
              <button
                type="button"
                className="btn btn--small btn--primary"
                onClick={() => setCropPickerOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
