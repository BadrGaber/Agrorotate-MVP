import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Glyph } from "./icons";
import { ROUTE_LABELS, routeHref, type RouteKey } from "../app/router";
import {
  FAO_ANNEX_URL,
  SALINITY_CHECK_BY_CROP,
  VERIFICATION_LABEL,
} from "../data/evidence/verification";

export type ProofKind =
  | "verified"
  | "measured"
  | "estimate"
  | "modeled"
  | "unverified"
  | "missing"
  | "user";

export interface Proof {
  kind: ProofKind;
  label: string;
  statement: string;
  sourceId?: string;
  sourceUrl?: string;
  limitation?: string;

  endpoint?: string;

  crossCheck?: string;

  checkedOn?: string;
}

const KIND_TEXT: Record<ProofKind, string> = {
  verified: "Source-scoped",
  measured: "Measured",
  estimate: "Observation",
  modeled: "Modeled",
  unverified: "In attachment",
  missing: "Not measured",
  user: "Your input",
};

const KIND_CLASS: Record<ProofKind, string> = {
  verified: "badge--meas",
  measured: "badge--meas",
  estimate: "badge--est",
  modeled: "badge--model",
  unverified: "badge--none",
  missing: "badge--none",
  user: "badge--info",
};

interface ProofContextValue {
  open: (proof: Proof) => void;
}

const ProofContext = createContext<ProofContextValue>({ open: () => undefined });

export function useProof() {
  return useContext(ProofContext);
}

export function ProofProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Proof | null>(null);
  const open = useCallback((proof: Proof) => setActive(proof), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <ProofContext.Provider value={value}>
      {children}
      {active && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setActive(null)}
        >
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Evidence detail"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="drawer__close"
              aria-label="Close evidence detail"
              onClick={() => setActive(null)}
            >
              <Glyph name="close" size={15} />
            </button>
            <span className={`badge ${KIND_CLASS[active.kind]}`}>
              {KIND_TEXT[active.kind]}
            </span>
            <h2 className="h2" style={{ marginTop: 14, fontSize: 26 }}>
              {active.label}
            </h2>
            <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: 14 }}>
              {active.statement}
            </p>

            {active.limitation && (
              <div className="note note--harvest" style={{ marginTop: 18 }}>
                <Glyph name="alert" size={17} className="note__icon" />
                <div>
                  <strong>Limitation.</strong> {active.limitation}
                </div>
              </div>
            )}

            {active.endpoint && (
              <div className="kv" style={{ marginTop: 18 }}>
                <span className="kv__k">Tabulated endpoint</span>
                <span className="kv__v">{active.endpoint}</span>
              </div>
            )}

            {active.sourceId && (
              <div className="kv">
                <span className="kv__k">Registry record</span>
                <span className="kv__v mono">{active.sourceId}</span>
              </div>
            )}

            {active.checkedOn && (
              <div className="kv">
                <span className="kv__k">Re-checked</span>
                <span className="kv__v">{active.checkedOn}</span>
              </div>
            )}

            {active.crossCheck && (
              <p className="small" style={{ marginTop: 14 }}>
                <strong>Cross-check.</strong> {active.crossCheck}
              </p>
            )}

            {active.sourceUrl && (
              <p className="small" style={{ marginTop: 14 }}>
                <a href={active.sourceUrl} target="_blank" rel="noreferrer">
                  Open the primary source ↗
                </a>
              </p>
            )}

            <p className="small" style={{ marginTop: 22 }}>
              AgroRotate shows the provenance of every value so a recommendation can
              be checked, not just trusted.
            </p>
          </aside>
        </div>
      )}
    </ProofContext.Provider>
  );
}

export function ProofChip({
  proof,
  compact = false,
}: {
  proof: Proof;
  compact?: boolean;
}) {
  const { open } = useProof();
  return (
    <button
      type="button"
      className={`badge badge--soft proof-chip ${KIND_CLASS[proof.kind]}`}
      style={{ cursor: "pointer", border: "1px solid transparent" }}
      onClick={(event) => {
        event.stopPropagation();
        open(proof);
      }}
      title={`${KIND_TEXT[proof.kind]} — ${proof.label}`}
    >
      {!compact && <span aria-hidden="true">●</span>}
      {proof.label}
    </button>
  );
}

export function KindBadge({ kind }: { kind: ProofKind }) {
  return <span className={`badge ${KIND_CLASS[kind]}`}>{KIND_TEXT[kind]}</span>;
}

export const PROOFS = {
  faoSalinity: (cropName: string): Proof => {
    const check = SALINITY_CHECK_BY_CROP[cropName];
    const endpoint = check ? ` The table's yield basis is ${check.endpoint.toLowerCase()}.` : "";
    const crossCheck = check
      ? check.fao56Table23
        ? "The same threshold and slope also appear in FAO-56 (Chapter 8, Table 23)."
        : "FAO-56 Table 23 lists sunflower as '–', so Annex 1 Table A1.1 is the only numeric source for this pair."
      : undefined;

    return {
      kind: "verified",
      label: "FAO salinity table",
      statement: `The salinity threshold and yield-loss slope for ${cropName} are the crop numbers that trace to a named source scope: FAO Annex 1, Table A1.1 (Maas–Hoffman framework).${endpoint}`,
      sourceId: "S23",
      sourceUrl: FAO_ANNEX_URL,
      endpoint: check?.endpoint,
      crossCheck,
      checkedOn: check ? VERIFICATION_LABEL : undefined,
      limitation:
        check?.endpointCaveat ??
        "Only valid for the exact species and yield endpoint in the table. Soil salinity must be a saturated-paste ECe value — not EC1:5, not a crust observation, not irrigation-water ECw.",
    };
  },
  unverifiedCropValue: (what: string): Proof => ({
    kind: "unverified",
    label: "In attachment",
    statement: `${what} is recorded in the project crop file, with its value-specific source citation in attachment. The engine keeps these values qualitative until the citation and local calibration land.`,
    sourceId: "crop evidence ledger",
    limitation:
      "Labeled for transparency. It is shown to you with its status and is never used to rank a crop or block a season.",
  }),
  nasaPowerLive: (meta?: string): Proof => ({
    kind: "modeled",
    label: "NASA POWER",
    statement:
      meta ??
      "Fetched on demand (latest available: 2–3 days lag for meteorology, 5–7 days lag for solar radiation) from the NASA POWER daily point API (community=AG) for this field's coordinates. The response parameters, date range and retrieval time are stored with the request.",
    sourceId: "S02–S04",
    sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
    limitation:
      "POWER is a gridded agroclimatology product, not an on-farm weather station. Native resolution differs by parameter, and a grid value is regional context — never a field measurement.",
  }),
  demTerrain: (what: string): Proof => ({
    kind: "modeled",
    label: "SRTM DEM",
    statement: `${what} is sampled from the elevation model for the drawn polygon — the same coordinates NASA POWER is queried at. It is a modelled surface value, not a survey.`,
    sourceId: "S05–S15",
    sourceUrl: "https://search.earthdata.nasa.gov/",
    limitation:
      "A 30–90 m DEM cell is smoother than the field. Elevation and relief are screening values; a surveyed level is always preferred when one exists.",
  }),
  nasaNotFetched: (product: string): Proof => ({
    kind: "missing",
    label: `${product}: not fetched`,
    statement: `${product} is a real NASA product that supports this section; its granules are queued for retrieval for this field. Nothing is displayed before it is retrieved.`,
    sourceId: "S05–S15",
    sourceUrl: "https://search.earthdata.nasa.gov/",
    limitation:
      "A catalogue entry is not evidence of retrieval. When it is wired, the product short name, version, granule IDs, QA mask and units must be stored alongside the value.",
  }),
  labMeasurement: (what: string): Proof => ({
    kind: "measured",
    label: "Lab value",
    statement: `${what} is entered from a laboratory report for this field. It overrides any visual observation for decision-making.`,
    limitation:
      "Interpretation still depends on the lab method, sample depth, sampling date and region — the app stores the date and method label you enter.",
  }),
  observation: (what: string): Proof => ({
    kind: "estimate",
    label: "Observation",
    statement: `${what} is a field observation. It is stored as a class or flag exactly as you observed it and is never silently converted into a laboratory number.`,
    sourceId: "S18–S19",
    sourceUrl: "https://www.nrcs.usda.gov/sites/default/files/2025-04/Field-Book-for-Describing-and-Sampling-Soils-v4.pdf",
    limitation:
      "Measurement rule (soil input matrix, items 2–15): tactile classes, colour, wilting speed, fizz and leaf symptoms stay observations; the laboratory method supplies the exact sand/clay %, SOM, CEC, ECe, AWC, Ksat and N-P-K values.",
  }),
  ptfEstimate: (what: string): Proof => ({
    kind: "modeled",
    label: "Pedotransfer estimate",
    statement: `${what} was computed from your measured texture, bulk density and organic matter using Saxton–Rawls (2006) water-retention equations.`,
    sourceId: "PTF",
    limitation:
      "A pedotransfer function is a model, not a pressure-plate measurement. It is labelled as an estimate and is never presented as measured AWC, FC or PWP.",
  }),
  userInput: (what: string): Proof => ({
    kind: "user",
    label: "Your input",
    statement: `${what} comes from you — the field owner or agronomist — and is used as given.`,
    limitation: "Not independently verified by this tool.",
  }),
  familyPrinciple: (): Proof => ({
    kind: "verified",
    label: "Rotation principle",
    statement:
      "Crops in the same botanical family often share pests, diseases and nutrient traits, so repeating a family back-to-back reduces the rotation break. This is a documented principle, not a measured penalty.",
    sourceId: "S28",
    sourceUrl:
      "https://extension.umn.edu/garden-and-home/gardening-in-minnesota/gardening-and-farming/yard-and-garden/gardening-in-minnesota/living-soil-healthy-garden",
    limitation:
      "It does not define a universal minimum return interval per crop. A return period is pathogen- and host-specific, so the planner flags the repetition and leaves the interval to the field's pathogen record.",
  }),
  sorghumAllelopathy: (): Proof => ({
    kind: "unverified",
    label: "Weed suppression — research lead",
    statement:
      "Sorgoleone from sorghum can suppress some weed species under described conditions (S29). The rotation engine uses the sourced suppression principle without importing an undocumented tillage gap.",
    sourceId: "S29",
    sourceUrl:
      "https://extension.usu.edu/crops/research/sorghum-sudangrass-production-guide",
    limitation:
      "Crop-specific tillage timing stays with your agronomist's local recommendation; the engine flags the principle instead of asserting a number of days.",
  }),
  cropWaterDemand: (): Proof => ({
    kind: "estimate",
    label: "seasonal crop water demand (fixed per-crop, mm)",
    statement:
      "Crop water demand in this build is a seasonal crop water demand (fixed per-crop, mm), compared with the quota you record.",
    sourceId: "S21–S22",
    sourceUrl: "https://www.fao.org/4/X0490E/X0490E00.htm",
    limitation:
      "The fixed figure is a baseline estimate per crop, not a stage-dependent calculation, and ETo is climate demand — not irrigation delivery.",
  }),
  faoLeaching: (): Proof => ({
    kind: "modeled",
    label: "FAO-29 leaching",
    statement:
      "The indicative leaching fraction uses LR = ECw / (5 × ECe_target − ECw) from FAO Irrigation and Drainage Paper 29, using the crop's source-supported salinity threshold as the target root-zone salinity.",
    sourceId: "S23",
    sourceUrl: "https://www.fao.org/4/Y4263E/y4263e0e.htm",
    limitation:
      "This is an indicative screening value for a uniform root zone. It is not a scheduling prescription and assumes the salinity threshold is appropriate for the species and growth stage.",
  }),
} as const;

/**
 * Inline proof pointer: sits next to a claim and opens the screen that shows
 * the underlying data (and briefly outlines the exact card).
 */
export function VerifyLink({
  to,
  focus,
  children,
}: {
  to: RouteKey;
  focus?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="verify-link"
      href={routeHref(to, focus)}
      title={`Open ${ROUTE_LABELS[to]} at the proof for this claim`}
    >
      <Glyph name="check" size={11} />
      <span>{children}</span>
      <span aria-hidden="true" className="verify-link__arrow">
        ↗
      </span>
    </a>
  );
}
