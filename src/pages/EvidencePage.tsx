import { useMemo, useState } from "react";
import { Card, Note, PageHead, Seg } from "../ui/kit";
import { Glyph } from "../ui/icons";
import {
  EVIDENCE_CLAIMS,
  EVIDENCE_CROPS,
  EVIDENCE_INPUTS,
  EVIDENCE_META,
  EVIDENCE_SOURCES,
} from "../data/evidence/generated";

type Tab = "claims" | "sources" | "inputs";

const STATUS_BUCKETS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "supported", label: "Source-supported" },
  { value: "no_source", label: "Estimated · no exact source" },
  { value: "not_universal", label: "Locally calibrated" },
  { value: "mismatch", label: "Mismatch / partial" },
  { value: "other", label: "Other" },
];

function bucketOf(status: string): string {
  if (status === "SUPPORTED FOR SOURCE SCOPE") return "supported";
  if (
    status.includes("VALUE-SPECIFIC SOURCE IN ATTACHMENT") ||
    status.startsWith("ESTIMATED")
  )
    return "no_source";
  if (status.includes("CONTEXT-SPECIFIC REQUIREMENT")) return "not_universal";
  if (/MISMATCH|PARTIAL|PENDING SOURCE SCOPE|RANGE COLLAPSED|OVER-PRECISE/.test(status))
    return "mismatch";
  return "other";
}

const statusClass = (status: string) =>
  status === "SUPPORTED FOR SOURCE SCOPE"
    ? "badge--meas"
    : status.startsWith("ESTIMATED")
      ? "badge--est"
      : status.includes("SOURCE IN ATTACHMENT") || status.includes("CONTEXT-SPECIFIC")
        ? "badge--none"
        : "badge--est";

const statusLabel = (status: string) => {
  if (status === "SUPPORTED FOR SOURCE SCOPE") return "source-scoped";
  if (status.startsWith("ESTIMATED")) return "estimated";
  if (status.includes("SOURCE IN ATTACHMENT")) return "in attachment";
  return "registry";
};

const statusTitle = (status: string) =>
  status.startsWith("ESTIMATED")
    ? "Estimated: no exact source is attached to this value, so it is not treated as a confirmed number."
    : status;

export function EvidencePage() {
  const [tab, setTab] = useState<Tab>("claims");
  const [crop, setCrop] = useState("all");
  const [bucket, setBucket] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(40);

  const claims = useMemo(() => {
    const search = query.trim().toLowerCase();
    return EVIDENCE_CLAIMS.filter((claim) => {
      if (crop !== "all" && claim.crop !== crop) return false;
      if (bucket !== "all" && bucketOf(claim.status) !== bucket) return false;
      if (
        search &&
        !claim.parameter.toLowerCase().includes(search) &&
        !claim.value.toLowerCase().includes(search)
      )
        return false;
      return true;
    });
  }, [crop, bucket, query]);

  return (
    <main className="page page--wide">
      <PageHead
        eyebrow="Reference · Evidence room"
        glyph="book"
        title={
          <>
            The audit trail, <em>in public</em>.
          </>
        }
        lede="Generated directly from the crop evidence registry. Every value carries its source status, visible before it can influence a single verdict."
        actions={
          <Seg<Tab>
            ariaLabel="Evidence sections"
            value={tab}
            onChange={setTab}
            options={[
              { value: "claims", label: "Claims" },
              { value: "sources", label: "Sources" },
              { value: "inputs", label: "Input rules" },
            ]}
          />
        }
      />

      {tab === "claims" && (
        <div className="stack">
          <Note tone="sky" glyph="info">
            Every claim in the ledger carries its source status at a glance. The
            source-scoped rows are FAO salinity threshold/slope pairs that drive the hard
            checks. The remaining rows are <strong>estimates</strong>: no exact source is
            attached to the individual value, so the engine keeps them qualitative and
            never treats them as confirmed numbers.
          </Note>

          <Card
            glyph="compass"
            title="Filter the ledger"
            aside={<span className="small">{claims.length} matching</span>}
          >
            <div className="grid-fields">
              <select
                className="select"
                value={crop}
                onChange={(event) => {
                  setCrop(event.target.value);
                  setVisible(40);
                }}
                aria-label="Filter by crop"
              >
                <option value="all">All 30 crops</option>
                {EVIDENCE_CROPS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={bucket}
                onChange={(event) => {
                  setBucket(event.target.value);
                  setVisible(40);
                }}
                aria-label="Filter by status"
              >
                {STATUS_BUCKETS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={query}
                placeholder="Search parameter or value…"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(40);
                }}
              />
            </div>
          </Card>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Parameter</th>
                  <th>Value in file</th>
                  <th>Evidence status</th>
                  <th>Audit note</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, visible).map((claim, index) => (
                  <tr key={`${claim.crop}-${claim.parameter}-${index}`}>
                    <td style={{ whiteSpace: "nowrap" }}>{claim.crop}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{claim.parameter}</td>
                    <td className="mono">{claim.value || "—"}</td>
                    <td>
                      <span
                        className={`badge ${statusClass(claim.status)}`}
                        title={statusTitle(claim.status)}
                      >
                        {statusLabel(claim.status)}
                      </span>
                    </td>
                    <td className="td-muted" style={{ minWidth: 300 }}>
                      {claim.note || "—"}
                      {claim.url && (
                        <>
                          {" "}
                          <a href={claim.url} target="_blank" rel="noreferrer">
                            source ↗
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visible < claims.length && (
            <button
              type="button"
              className="btn"
              onClick={() => setVisible((value) => value + 60)}
            >
              Show 60 more ({claims.length - visible} remaining)
            </button>
          )}
        </div>
      )}

      {tab === "sources" && (
        <div className="stack">
          <Note tone="forest" glyph="check">
            Every source below was checked on 29 October 2026 and carries an explicit
            “limits and non-claims” line. That line is the part most projects drop.
          </Note>

          {EVIDENCE_SOURCES.map((source) => (
            <Card key={source.id} flat>
              <div className="source-item" style={{ borderBottom: 0, padding: 0 }}>
                <span className="source-item__id">{source.id}</span>
                <div>
                  <div className="row row--between" style={{ alignItems: "baseline" }}>
                    <h3 className="h3" style={{ fontSize: 15.5 }}>
                      {source.title}
                    </h3>
                    <span className="small">{source.organization}</span>
                  </div>
                  <p className="small" style={{ marginTop: 4 }}>
                    <strong>Use:</strong> {source.use}
                  </p>
                  <p className="small" style={{ marginTop: 4, color: "var(--clay)" }}>
                    <strong>Limits:</strong> {source.limits}
                  </p>
                  <a className="small" href={source.url} target="_blank" rel="noreferrer">
                    {source.url} ↗
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "inputs" && (
        <div className="stack">
          <Note tone="harvest" glyph="alert">
            These are the {EVIDENCE_META.inputSections} input sections this build still
            collects, each with the exact thing the evidence review says must <em>not</em> be
            encoded from it.
          </Note>

          {EVIDENCE_INPUTS.map((input) => (
            <Card key={input.section} flat>
              <div className="card__head" style={{ marginBottom: 8 }}>
                <div>
                  <h3 className="h3" style={{ fontSize: 16 }}>
                    <span className="mono" style={{ color: "var(--forest)", marginRight: 8 }}>
                      §{String(input.section).padStart(2, "0")}
                    </span>
                    {input.name}
                  </h3>
                </div>
                <span className="badge badge--soft badge--none">{input.correctLabel}</span>
              </div>
              <p className="small">
                <strong>What NASA or maps can support:</strong> {input.nasaSupport}
              </p>
              <p className="small" style={{ marginTop: 6 }}>
                <strong>Required primary evidence:</strong> {input.requiredEvidence}
              </p>
              <p className="small" style={{ marginTop: 6, color: "var(--clay)" }}>
                <strong>Do not encode without evidence:</strong> {input.doNotEncode}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Note tone="sky" glyph="download" style={{ marginTop: 20 }}>
        <Glyph name="book" size={14} /> This page is regenerated from{" "}
        <span className="mono">Agrorotate_30_Crop_Parameter_Claim_Ledger.csv</span> and the
        companion registry by <span className="mono">scripts/generate-evidence.mjs</span>.
        Re-running the script is the only way to change these numbers — nothing is typed
        by hand.
      </Note>
    </main>
  );
}
