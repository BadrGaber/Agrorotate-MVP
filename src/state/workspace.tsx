import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_WORKSPACE,
  EMPTY_LAB,
  type ClimateState,
  type FieldState,
  type LabSoil,
  type PlanState,
  type PrioritiesState,
  type SoilState,
  type WaterState,
  type WorkspaceState,
} from "./model";
export const WORKSPACE_STORAGE_KEY = "agrorotate.v6.workspace";
const STORAGE_KEY = WORKSPACE_STORAGE_KEY;
/**
 * Keys written by earlier builds. They are removed on load so a stale example
 * record cannot be mistaken for the visitor's own data.
 */
const LEGACY_STORAGE_KEYS = [
  "agrorotate.v5.workspace",
  "agrorotate.v5.ai.journal",
  "agrorotate.v5.ai.snapshot",
];

/** First-visit state: genuinely empty — no field, no answers, no seeded data. */
function emptyWorkspace(): WorkspaceState {
  return structuredClone(DEFAULT_WORKSPACE);
}

function mergeState(raw: Partial<WorkspaceState> | null): WorkspaceState {
  if (!raw) return emptyWorkspace();
  return {
    version: 6,
    field: { ...DEFAULT_WORKSPACE.field, ...(raw.field ?? {}) },
    soil: {
      observations: { ...(raw.soil?.observations ?? {}) },
      lab: { ...EMPTY_LAB, ...(raw.soil?.lab ?? {}) },
      estimates: { ...(raw.soil?.estimates ?? {}) },
    },
    water: { ...DEFAULT_WORKSPACE.water, ...(raw.water ?? {}) },
    climate: { ...DEFAULT_WORKSPACE.climate, ...(raw.climate ?? {}) },
    priorities: {
      ...DEFAULT_WORKSPACE.priorities,
      ...(raw.priorities ?? {}),
      weights: {
        ...DEFAULT_WORKSPACE.priorities.weights,
        ...(raw.priorities?.weights ?? {}),
      },
      excluded: { ...(raw.priorities?.excluded ?? {}) },
    },
    plan: {
      ...DEFAULT_WORKSPACE.plan,
      ...(raw.plan ?? {}),
      cycle: raw.plan?.cycle ?? 1,
      slots:
        raw.plan?.slots?.length === 6
          ? raw.plan.slots.map((slot) => ({
              cropId: slot?.cropId ?? null,
              note: slot?.note ?? "",
            }))
          : structuredClone(DEFAULT_WORKSPACE.plan.slots),
    },
    updatedAtIso: raw.updatedAtIso ?? new Date().toISOString(),
  };
}

function readStorage(): WorkspaceState {
  try {
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    return mergeState(JSON.parse(raw) as Partial<WorkspaceState>);
  } catch {
    return emptyWorkspace();
  }
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  savedAtIso: string | null;
  dirty: boolean;
  setField: (patch: Partial<FieldState>) => void;
  setSoil: (patch: Partial<SoilState>) => void;
  setObservation: (key: string, value: string | null) => void;
  setLab: (patch: Partial<LabSoil>) => void;
  setWater: (patch: Partial<WaterState>) => void;
  setPriorities: (patch: Partial<PrioritiesState>) => void;
  setPlan: (patch: Partial<PlanState>) => void;
  setSlotCrop: (index: number, cropId: string | null) => void;
  setClimate: (patch: Partial<ClimateState>) => void;
  resetWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(readStorage);
  const [savedAtIso, setSavedAtIso] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<number | null>(null);

  const mutate = useCallback((updater: (current: WorkspaceState) => WorkspaceState) => {
    setState((current) => {
      const next = updater(current);
      return { ...next, updatedAtIso: new Date().toISOString() };
    });
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSavedAtIso(new Date().toISOString());
        setDirty(false);
      } catch {
        /* storage full or blocked — the app still works in memory */
      }
    }, 450);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, dirty]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      savedAtIso,
      dirty,
      setField: (patch) => mutate((c) => ({ ...c, field: { ...c.field, ...patch } })),
      setSoil: (patch) => mutate((c) => ({ ...c, soil: { ...c.soil, ...patch } })),
      setObservation: (key, observationValue) =>
        mutate((c) => ({
          ...c,
          soil: {
            ...c.soil,
            observations: { ...c.soil.observations, [key]: observationValue },
          },
        })),
      setLab: (patch) =>
        mutate((c) => {
          const estimates = { ...c.soil.estimates };
          for (const key of Object.keys(patch)) delete estimates[key];
          return {
            ...c,
            soil: { ...c.soil, lab: { ...c.soil.lab, ...patch }, estimates },
          };
        }),
      setWater: (patch) =>
        mutate((c) => {
          // A value typed directly is recorded as the user's own entry, so any
          // estimate provenance for the patched keys is dropped — same rule as
          // the soil lab fields.
          const estimates = { ...c.water.estimates };
          for (const key of Object.keys(patch)) delete estimates[key];
          return { ...c, water: { ...c.water, ...patch, estimates } };
        }),
      setPriorities: (patch) =>
        mutate((c) => ({
          ...c,
          priorities: {
            ...c.priorities,
            ...patch,
            weights: { ...c.priorities.weights, ...(patch.weights ?? {}) },
            excluded: { ...c.priorities.excluded, ...(patch.excluded ?? {}) },
          },
        })),
      setPlan: (patch) => mutate((c) => ({ ...c, plan: { ...c.plan, ...patch } })),
      setSlotCrop: (index, cropId) =>
        mutate((c) => ({
          ...c,
          plan: {
            ...c.plan,
            slots: c.plan.slots.map((slot, i) =>
              i === index ? { ...slot, cropId } : slot,
            ),
          },
        })),
      setClimate: (patch) =>
        mutate((c) => ({ ...c, climate: { ...c.climate, ...patch } })),
      resetWorkspace: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(emptyWorkspace());
        setSavedAtIso(null);
        setDirty(false);
      },
    }),
    [state, savedAtIso, dirty, mutate],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
