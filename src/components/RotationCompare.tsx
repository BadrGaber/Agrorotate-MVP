import { useState, useEffect } from "react";
import { cropById } from "../data/catalog";
import { evaluateSlot, previousCropForSlot } from "../engine/agronomy";
import { runBatchedOptimization } from "../engine/optimizer";
import type { PlanState, WorkspaceState, AiParetoSolution, AiOutputContract } from "../state/model";
import { SLOT_META } from "../state/model";
import { Glyph } from "../ui/icons";

function withRotation(state: WorkspaceState, slots: string[]): WorkspaceState {
  const plan: PlanState = {
    ...state.plan,
    slots: state.plan.slots.map((slot, index) => ({
      ...slot,
      cropId: slots[index] ?? null,
    })),
  };
  return { ...state, plan };
}

function rotationMetrics(state: WorkspaceState, slots: string[]) {
  const patched = withRotation(state, slots);
  let conflicts = 0;
  let cautions = 0;
  let familyRepeats = 0;
  let familyBreaks = 0;
  let legumeSeasons = 0;
  let coverSeasons = 0;
  let salinityAssessed = 0;

  slots.forEach((cropId, index) => {
    const crop = cropById(cropId);
    if (!crop) return;
    if (crop.family === "Fabaceae") legumeSeasons += 1;
    if (crop.isCoverCrop) coverSeasons += 1;
    const evaluation = evaluateSlot(patched, index);
    if (!evaluation) return;
    if (evaluation.verdict === "conflict") conflicts += 1;
    if (evaluation.verdict === "caution") cautions += 1;
    if (evaluation.salinity.state === "below" || evaluation.salinity.state === "above") {
      salinityAssessed += 1;
    }
    if (evaluation.findings.some((finding) => finding.id === "family-repeat")) {
      familyRepeats += 1;
    }
    const previous = previousCropForSlot(patched, index);
    if (previous && previous.family !== crop.family) familyBreaks += 1;
  });

  return {
    conflicts,
    cautions,
    familyRepeats,
    familyBreaks,
    legumeSeasons,
    coverSeasons,
    salinityAssessed,
  };
}

export function RotationCompare({
  state,
  onApply,
}: {
  state: WorkspaceState;
  onApply: (slots: string[], label: string) => void;
}) {
  const [optimization, setOptimization] = useState<AiOutputContract | null>(() => {
    try {
      return runBatchedOptimization(state);
    } catch {
      return null;
    }
  });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsCalculating(true);

    if (typeof Worker !== "undefined") {
      try {
        const worker = new Worker(
          new URL("../workers/aiOptimizer.worker.ts", import.meta.url),
          { type: "module" }
        );

        worker.onmessage = (event: MessageEvent) => {
          if (!isCancelled && event.data?.type === "OPTIMIZE_SUCCESS") {
            setOptimization(event.data.contract);
            setIsCalculating(false);
          }
          worker.terminate();
        };

        worker.onerror = () => {
          if (!isCancelled) {
            try {
              setOptimization(runBatchedOptimization(state));
            } catch {
              // fallback
            }
            setIsCalculating(false);
          }
          worker.terminate();
        };

        worker.postMessage({ type: "OPTIMIZE_REQUEST", workspace: state });

        return () => {
          isCancelled = true;
          worker.terminate();
        };
      } catch {
        // Fallback to synchronous execution
      }
    }

    try {
      setOptimization(runBatchedOptimization(state));
    } catch {
      // fallback
    }
    setIsCalculating(false);
  }, [state]);

  const solutions: AiParetoSolution[] = optimization?.paretoSolutions ?? [];

  return (
    <div className="compare">
      <div className="compare__head">
        <div>
          <h2 className="h2">AI Multi-Objective Pareto Rotations</h2>
          <p className="small">
            Evaluated by the NASA Biophysical Floor + Multi-Objective MCTS engine with Saxton–Rawls state dynamics. Four
            divergent Pareto-optimal pathways: baseline vs economic return vs water
            conservation vs soil regeneration.
          </p>
        </div>
        <span className="badge badge--soft badge--sky">
          <Glyph name="sparkle" size={12} /> {isCalculating ? "Optimizing..." : "NASA MCTS Optimized"}
        </span>
      </div>

      <div className="compare__grid">
        {solutions.map((solution) => {
          const slotCropIds = solution.slots.map((s) => s.cropId);
          const metrics = rotationMetrics(state, slotCropIds);
          const isBaseline = solution.isBaseline;

          return (
            <article
              className={`compare-card${isBaseline ? " compare-card--current" : ""}`}
              key={solution.id}
            >
              <header>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <span className="eyebrow">
                    {isBaseline ? "Current Practice" : "Pareto Frontier"}
                  </span>
                  <span className="badge badge--soft badge--meas" title="Empirical Conformal Coverage">
                    {solution.confidenceBandPercent}% Conf
                  </span>
                </div>
                <h3 style={{ marginTop: 4 }}>{solution.label}</h3>
                <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="badge badge--soft badge--harvest">
                    Profit: {solution.projectedNetReturnScore}/100
                  </span>
                  <span className="badge badge--soft badge--sky">
                    Water: {solution.waterSavingScore}/100
                  </span>
                  <span className="badge badge--soft badge--forest">
                    Soil: {solution.soilHealthScore}/100
                  </span>
                </div>
              </header>

              <div className="compare-sequence" style={{ marginTop: 12 }}>
                {solution.slots.map((slot, index) => {
                  const crop = cropById(slot.cropId);
                  return (
                    <div className="compare-season" key={index} title={slot.causalRationale}>
                      <span className="compare-season__label">
                        Y{SLOT_META[index]?.year ?? "?"} ·{" "}
                        {SLOT_META[index]?.season === "cool" ? "cool" : "warm"}
                      </span>
                      <span className="compare-season__crop">
                        {slot.cropName}
                      </span>
                      <div className="row" style={{ justifyContent: "space-between", fontSize: "0.75rem", opacity: 0.85 }}>
                        <span>{crop?.family ?? slot.family}</span>
                        <span>{slot.bareFieldDaysAfterHarvest}d bare</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="compare-metrics" style={{ marginTop: 12 }}>
                <div>
                  <strong>{solution.bareFieldDaysTotal}d</strong>
                  <span>bare field</span>
                </div>
                <div>
                  <strong>{metrics.familyBreaks}</strong>
                  <span>family breaks</span>
                </div>
                <div>
                  <strong>{metrics.legumeSeasons}</strong>
                  <span>legumes</span>
                </div>
                <div>
                  <strong>{metrics.coverSeasons}</strong>
                  <span>covers</span>
                </div>
              </div>

              {solution.vulnerabilityHotspots.length > 0 && (
                <div style={{ marginTop: 8, padding: "6px 8px", background: "var(--surface-sunken)", borderRadius: 6 }}>
                  <span className="small" style={{ fontWeight: 600, color: "var(--amber-dim, #b45309)" }}>
                    Vulnerability Hotspots:
                  </span>
                  <p className="small" style={{ margin: "2px 0 0 0", fontSize: "0.78rem" }}>
                    {solution.vulnerabilityHotspots[0].description}
                  </p>
                </div>
              )}

              {solution.localReviewRisks.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <span className="small" style={{ opacity: 0.75 }}>
                    Local Review: {solution.localReviewRisks[0]}
                  </span>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn--small btn--primary"
                  style={{ width: "100%" }}
                  onClick={() => onApply(slotCropIds, solution.label)}
                >
                  Apply this rotation to board
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="small compare__foot" style={{ marginTop: 16 }}>
        All four Pareto pathways combine the trained yield-gap prior with sourced
        biophysical constraints: Maas-Hoffman osmotic salinity limits, soil texture
        infiltration capacities, biological nitrogen credit, and EPPO/FAO pathogen host
        interruption cycles. The neural prior covers yield only, for the 22 crops with real
        training rows.
      </p>
    </div>
  );
}
