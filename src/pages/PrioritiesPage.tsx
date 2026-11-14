import { useMemo, useState } from "react";
import { useWorkspace } from "../state/workspace";
import { Card, Field, Note, PageHead } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { PROOFS, ProofChip } from "../ui/proof";
import { CROP_CATALOG, cropById, SALINITY_VERIFIED_COUNT } from "../data/catalog";
import { SetupRail, StepNav, CropSelect } from "./shared";
import type { RouteKey } from "../app/router";
import type { PriorityKey } from "../state/model";

const PRESETS: {
  id: "balanced" | "water" | "soil" | "risk";
  title: string;
  note: string;
  weights: Record<PriorityKey, number>;
  glyph: "scales" | "drop" | "sprout" | "lock";
}[] = [
  {
    id: "balanced",
    title: "Balanced yield & fertility",
    note: "No single objective dominates.",
    weights: { yield: 3, water: 3, soil: 3, risk: 3 },
    glyph: "scales",
  },
  {
    id: "water",
    title: "Water conservation",
    note: "Lean toward lower-demand seasons.",
    weights: { yield: 2, water: 5, soil: 3, risk: 2 },
    glyph: "drop",
  },
  {
    id: "soil",
    title: "Soil & nitrogen building",
    note: "Favour legumes and cover crops.",
    weights: { yield: 3, water: 3, soil: 5, risk: 3 },
    glyph: "sprout",
  },
  {
    id: "risk",
    title: "Pathogen & pest break",
    note: "Protect the rotation break above all.",
    weights: { yield: 2, water: 3, soil: 3, risk: 5 },
    glyph: "lock",
  },
];

const WEIGHT_LABELS: { key: PriorityKey; label: string; hint: string }[] = [
  { key: "yield", label: "Yield & fertility", hint: "Main crop output and soil fertility" },
  { key: "water", label: "Water", hint: "Irrigation demand and scarcity" },
  { key: "soil", label: "Soil health", hint: "Organic matter and nitrogen building" },
  { key: "risk", label: "Risk & pest break", hint: "Disease, salinity and stability" },
];

export function PrioritiesPage({ navigate }: { navigate: (route: RouteKey) => void }) {
  const { state, setPriorities } = useWorkspace();
  const [excludePick, setExcludePick] = useState<string>("");
  const [search, setSearch] = useState("");

  const excludedEntries = Object.entries(state.priorities.excluded);
  const previousCrop = cropById(state.priorities.previousCropId);

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return CROP_CATALOG.filter(
      (crop) =>
        crop.name.toLowerCase().includes(query) ||
        crop.family.toLowerCase().includes(query),
    ).slice(0, 8);
  }, [search]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setPriorities({ preset: preset.id, weights: preset.weights });
  };

  const setWeight = (key: PriorityKey, value: number) => {
    setPriorities({
      preset: "custom",
      weights: { ...state.priorities.weights, [key]: value },
    });
  };

  return (
    <main className="page">
      <PageHead
        eyebrow="Step 04 · Priorities & constraints"
        glyph="scales"
        title={
          <>
            What are you optimising <em>for</em>?
          </>
        }
        lede="Priorities are recorded, displayed and used to order qualitative candidates — every reason is printed beside the order it produces."
        actions={
          previousCrop ? (
            <span className="badge badge--soft badge--none">
              Last season: {previousCrop.name}
            </span>
          ) : (
            <span className="badge badge--soft badge--est">No previous crop recorded</span>
          )
        }
      />

      <SetupRail current="priorities" navigate={navigate} />

      <div className="split">
        <div className="stack">
          <Card
            glyph="calendar"
            title="Previous season"
            hint="The rotation break starts from what was actually in the ground, not from an assumption."
          >
            <div className="grid-fields">
              <Field
                label="Crop grown last season"
                hint="Leave empty if you genuinely do not know."
                proof={<ProofChip proof={PROOFS.userInput("Crop history")} />}
              >
                <CropSelect
                  crops={CROP_CATALOG}
                  value={state.priorities.previousCropId}
                  onChange={(previousCropId) => setPriorities({ previousCropId })}
                  placeholder="Not recorded"
                />
              </Field>
              {previousCrop && (
                <div className="note note--sky" style={{ alignSelf: "end" }}>
                  <Glyph name="info" size={16} className="note__icon" />
                  <div>
                    <strong>{previousCrop.name}</strong> — {previousCrop.family}. The first
                    season will be checked for a family repeat against this crop.
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            glyph="scales"
            title="Objective presets"
            hint="Pick a starting point, then fine-tune the four weights."
          >
            <div
              className="grid grid--2"
              style={{ gap: 10 }}
              data-gate="priorities-preset"
              tabIndex={-1}
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="choice"
                  aria-pressed={state.priorities.preset === preset.id}
                  onClick={() => applyPreset(preset)}
                  style={{ padding: 15 }}
                >
                  <span className="row" style={{ gap: 8 }}>
                    <Glyph name={preset.glyph} size={17} />
                    <span className="choice__title">{preset.title}</span>
                  </span>
                  <span className="choice__note">{preset.note}</span>
                </button>
              ))}
            </div>

            <hr className="divider" />

            <div className="row row--between" style={{ marginBottom: 10 }}>
              <span className="label" style={{ margin: 0 }}>
                Fine-tune the four weights
              </span>
              {state.priorities.preset === "custom" && (
                <span className="badge badge--soft badge--est">Custom mix</span>
              )}
            </div>

            <div className="stack" style={{ gap: 14 }}>
              {WEIGHT_LABELS.map((item) => (
                <div key={item.key}>
                  <div className="row row--between" style={{ marginBottom: 5 }}>
                    <span className="label" style={{ margin: 0 }}>
                      {item.label}
                      <span className="small" style={{ fontWeight: 400 }}>
                        · {item.hint}
                      </span>
                    </span>
                    <span className="badge badge--soft badge--none">
                      {state.priorities.weights[item.key]} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={state.priorities.weights[item.key]}
                    onChange={(event) => setWeight(item.key, Number(event.target.value))}
                    style={{ width: "100%", accentColor: "var(--forest)" }}
                    aria-label={`${item.label} weight`}
                  />
                </div>
              ))}
            </div>

            <Note tone="sky" glyph="info" style={{ marginTop: 16 }}>
              The weights only order the candidates you are <em>offered</em>; every reason
              is printed beside them, so the ordering stays visible.
            </Note>
          </Card>

          <Card
            glyph="lock"
            title="Crops you will not plant"
            hint="An exclusion is the one hard constraint the planner applies to your own choices."
          >
            <div className="grid-fields" style={{ alignItems: "end" }}>
              <Field label="Add a crop">
                <CropSelect
                  crops={CROP_CATALOG}
                  value={excludePick || null}
                  onChange={(id) => setExcludePick(id ?? "")}
                  placeholder="Choose from 30 crops…"
                />
              </Field>
              <button
                type="button"
                className="btn"
                disabled={!excludePick}
                onClick={() => {
                  if (!excludePick) return;
                  setPriorities({
                    excluded: {
                      ...state.priorities.excluded,
                      [excludePick]: "",
                    },
                  });
                  setExcludePick("");
                }}
              >
                Exclude
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <input
                className="input"
                value={search}
                placeholder="Search by crop name or family…"
                onChange={(event) => setSearch(event.target.value)}
              />
              {filteredCrops.length > 0 && (
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  {filteredCrops.map((crop) => (
                    <button
                      key={crop.id}
                      type="button"
                      className="chip-toggle"
                      onClick={() => {
                        setExcludePick(crop.id);
                        setSearch("");
                      }}
                    >
                      {crop.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {excludedEntries.length === 0 ? (
              <p className="small" style={{ marginTop: 14 }}>
                Nothing excluded yet. That is fine — the engine still checks family
                repeats and measured salinity.
              </p>
            ) : (
              <div className="stack" style={{ gap: 8, marginTop: 14 }}>
                {excludedEntries.map(([cropId, reason]) => {
                  const crop = cropById(cropId);
                  return (
                    <div
                      key={cropId}
                      className="row row--between note"
                      style={{ padding: "8px 12px" }}
                    >
                      <span>
                        <strong>{crop?.name ?? cropId}</strong>
                        <span className="small"> · {reason || "no reason recorded"}</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn--small btn--ghost"
                        onClick={() => {
                          const next = { ...state.priorities.excluded };
                          delete next[cropId];
                          setPriorities({ excluded: next });
                        }}
                      >
                        Allow again
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card glyph="book" title="Your decision brief" wash>
            <div className="kv">
              <span className="kv__k">Primary lens</span>
              <span className="kv__v" style={{ textTransform: "capitalize" }}>
                {state.priorities.preset ?? "not chosen"}
              </span>
            </div>
            <div className="kv">
              <span className="kv__k">Water regime</span>
              <span className="kv__v">
                {state.water.regime ? state.water.regime.replaceAll("_", " ") : "not set"}
              </span>
            </div>
            <div className="kv">
              <span className="kv__k">System</span>
              <span className="kv__v">{state.water.system ?? "not set"}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Excluded crops</span>
              <span className="kv__v">{excludedEntries.length}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Horizon</span>
              <span className="kv__v">3 years · 6 seasons</span>
            </div>
            {state.priorities.preset === null && (
              <p className="small" style={{ marginTop: 10 }}>
                No lens chosen: the weights are neutral (3/5 each) until you pick a
                preset or move a slider. Nothing is inferred from the field here.
              </p>
            )}
            <p className="hand" style={{ marginTop: 16 }}>
              The plan explains itself. It never promises a harvest.
            </p>
          </Card>

          <Card glyph="help" title="Why no crop score?">
            <p className="small" style={{ lineHeight: 1.65 }}>
              A ranking needs comparable water demand, salinity response, nutrient
              thresholds and disease host ranges for every crop. The FAO salinity pair
              is source-supported for {SALINITY_VERIFIED_COUNT} of the thirty crop
              entries, and the other families stay labelled as estimates until an exact
              source is attached. Printing the checks keeps every reason visible instead of
              compressing them into one opaque number.
            </p>
            <p className="small" style={{ marginTop: 10 }}>
              Weight sensitivity is visible by design. Because the weights only order
              qualitative candidates, changing them cannot silently change a verdict —
              it only changes what is offered first.
            </p>
          </Card>
        </div>
      </div>

      <StepNav
        step="priorities"
        back="water"
        next="plan"
        nextLabel="Open the rotation board"
        navigate={navigate}
        hint="Six seasons, one field, every check visible."
      />
    </main>
  );
}
