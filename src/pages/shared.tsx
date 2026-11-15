import React, { useEffect, useMemo, useState } from "react";
import { Glyph } from "../ui/icons";
import { SETUP_ROUTES, ROUTE_LABELS, type RouteKey } from "../app/router";
import { setupCompleteness } from "../engine/agronomy";
import { useWorkspace } from "../state/workspace";
import type { WorkspaceState } from "../state/model";

export interface SetupRequirement {
  key: string;
  label: string;

  selectors: string[];
}


export function setupRequirements(
  state: WorkspaceState,
): Record<"field" | "soil" | "water" | "priorities", SetupRequirement[]> {
  const done = setupCompleteness(state);
  const field: SetupRequirement[] = [];
  if (!(state.field.boundary.length >= 3 && (state.field.areaHa ?? 0) > 0)) {
    field.push({
      key: "boundary",
      label: "Draw the field boundary",
      selectors: ['[data-gate="field-boundary"]'],
    });
  }
  return {
    field,
    soil: done.soil
      ? []
      : [
          {
            key: "soil",
            label: "An observation or a measured ECe",
            selectors: [
              '[data-gate="soil-observation"]',
              '[data-gate="soil-ece"]',
            ],
          },
        ],
    water: done.water
      ? []
      : [
          {
            key: "water",
            label: "Water supply regime, quota or ECw",
            selectors: [
              '[data-gate="water-regime"]',
              '[data-gate="water-ecw"]',
            ],
          },
        ],
    priorities: done.priorities
      ? []
      : [
          {
            key: "priorities",
            label: "A priority lens or last season's crop",
            selectors: ['[data-gate="priorities-preset"]'],
          },
        ],
  };
}


export function focusGateRequirement(selectors: string[]) {
  let el: HTMLElement | null = null;
  for (const selector of selectors) {
    el = document.querySelector<HTMLElement>(selector);
    if (el) break;
  }
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("gate-flash");
  void el.offsetWidth;
  el.classList.add("gate-flash");
  window.setTimeout(() => el?.classList.remove("gate-flash"), 1800);
  window.setTimeout(() => {
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      el.focus({ preventScroll: true });
    }
  }, 420);
}

export function SetupRail({ current, navigate }: { current: RouteKey; navigate: (r: RouteKey) => void }) {
  const { state } = useWorkspace();
  const completeness = setupCompleteness(state);
  const doneMap: Record<string, boolean> = {
    field: completeness.field,
    soil: completeness.soil,
    water: completeness.water,
    priorities: completeness.priorities,
  };
  const currentIndex = SETUP_ROUTES.indexOf(current);
  const shortLabels: Record<string, string> = {
    field: "Field",
    soil: "Soil",
    water: "Water",
    priorities: "Priorities",
  };



  let frontierIndex = 0;
  while (frontierIndex < SETUP_ROUTES.length - 1 && doneMap[SETUP_ROUTES[frontierIndex]]) {
    frontierIndex += 1;
  }
  return (
    <nav className="setup-tabs" aria-label="Setup steps">
      <span className="setup-tabs__caption">Field setup</span>
      <div className="setup-tabs__track">
        {SETUP_ROUTES.map((route, index) => {
          const active = route === current;
          const done = Boolean(doneMap[route]);
          const locked = index > frontierIndex;
          return (
            <button
              key={route}
              type="button"
              className={`setup-tab${active ? " is-active" : ""}${done && !active ? " is-done" : ""}${locked ? " is-locked" : ""}`}
              aria-current={active ? "step" : undefined}
              aria-disabled={locked || undefined}
              title={locked ? `Finish ${shortLabels[SETUP_ROUTES[index - 1]]} first — the steps run in order` : undefined}
              onClick={() => {
                if (locked) {


                  window.dispatchEvent(
                    new CustomEvent("agrorotate:gate-attempt", {
                      detail: { step: SETUP_ROUTES[frontierIndex] },
                    }),
                  );
                  return;
                }
                navigate(route);
              }}
            >
              <span className="setup-tab__num">{index + 1}</span>
              <span>{shortLabels[route] ?? ROUTE_LABELS[route]}</span>
              {locked ? (
                <Glyph name="lock" size={10} strokeWidth={2.4} />
              ) : done && !active ? (
                <Glyph name="check" size={11} strokeWidth={2.6} />
              ) : null}
            </button>
          );
        })}
      </div>
      <span className="setup-tabs__progress mono">
        {String(currentIndex + 1).padStart(2, "0")} / 04
      </span>
    </nav>
  );
}






export function SetupGate({
  current,
  navigate,
  children,
}: {
  current: RouteKey;
  navigate: (r: RouteKey) => void;
  children: React.ReactNode;
}) {
  const { state } = useWorkspace();
  const completeness = setupCompleteness(state);
  const doneMap: Record<string, boolean> = {
    field: completeness.field,
    soil: completeness.soil,
    water: completeness.water,
    priorities: completeness.priorities,
  };
  const index = SETUP_ROUTES.indexOf(current);

  const required = index === -1 ? SETUP_ROUTES : SETUP_ROUTES.slice(0, index);
  const missing = required.filter((route) => !doneMap[route]);
  const firstMissing = missing[0];




  useEffect(() => {
    if (firstMissing) navigate(firstMissing);
  }, [firstMissing]);

  if (missing.length > 0) return null;
  return <>{children}</>;
}

export function StepNav({
  step,
  back,
  next,
  nextLabel,
  navigate,
  hint,
}: {
  step?: "field" | "soil" | "water" | "priorities";
  back?: RouteKey;
  next?: RouteKey;
  nextLabel?: string;
  navigate: (route: RouteKey) => void;
  hint?: string;
}) {
  const { state } = useWorkspace();
  const [gate, setGate] = useState<SetupRequirement[] | null>(null);
  const requirements = useMemo(
    () => (step ? setupRequirements(state)[step] : []),
    [state, step],
  );

  const completeness = setupCompleteness(state);
  const doneMap: Record<string, boolean> = {
    field: completeness.field,
    soil: completeness.soil,
    water: completeness.water,
    priorities: completeness.priorities,
  };
  const nextIndex = next ? SETUP_ROUTES.indexOf(next) : -1;
  const requiredSteps =
    next === "plan"
      ? SETUP_ROUTES
      : nextIndex === -1
        ? []
        : SETUP_ROUTES.slice(0, nextIndex);
  const nextLocked = requiredSteps.some((route) => !doneMap[route]);

  const reveal = (items: SetupRequirement[]) => {
    setGate(items);
    if (items[0]) focusGateRequirement(items[0].selectors);
  };

  useEffect(() => {
    if (!step) return;
    const onAttempt = (event: Event) => {
      const target = (event as CustomEvent<{ step?: RouteKey }>).detail?.step;
      if (target !== step) return;
      reveal(requirements);
    };
    window.addEventListener("agrorotate:gate-attempt", onAttempt);
    return () => window.removeEventListener("agrorotate:gate-attempt", onAttempt);
  }, [step, requirements]);

  useEffect(() => {
    if (gate && requirements.length === 0) setGate(null);
  }, [gate, requirements.length]);

  return (
    <>
      {gate && (
        <div className="gate-hint no-print" role="alert">
          <Glyph name="lock" size={15} />
          <div>
            <strong>The next step is still locked.</strong>{" "}
            {requirements.length > 0
              ? "Fill these entries first:"
              : "Finish this step's required entries first."}
            {requirements.length > 0 && (
              <div className="gate-hint__jumps">
                {requirements.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => focusGateRequirement(item.selectors)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className="row row--between no-print"
        style={{ marginTop: 26, borderTop: "1px solid var(--rule)", paddingTop: 18 }}
      >
        <div>
          {back && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => navigate(back)}
              data-sound="whoosh"
            >
              ← {ROUTE_LABELS[back]}
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {hint && <span className="small">{hint}</span>}
          {next && (
            <button
              type="button"
              className="btn btn--primary"
              data-sound={nextLocked ? undefined : "whoosh"}
              onClick={() => {
                if (nextLocked) {
                  reveal(requirements);
                  return;
                }
                navigate(next);
              }}
            >
              {nextLabel ?? `Continue to ${ROUTE_LABELS[next]}`}
              <Glyph name="arrow" size={15} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function CropSelect({
  value,
  onChange,
  crops,
  placeholder = "Choose a crop…",
  includeBlank = true,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  crops: { id: string; name: string; family: string }[];
  placeholder?: string;
  includeBlank?: boolean;
}) {
  const families = Array.from(new Set(crops.map((crop) => crop.family))).sort();
  return (
    <select
      className="select"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
    >
      {includeBlank && <option value="">{placeholder}</option>}
      {families.map((family) => (
        <optgroup key={family} label={family}>
          {crops
            .filter((crop) => crop.family === family)
            .map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
