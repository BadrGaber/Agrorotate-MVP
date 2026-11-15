import { useMemo, useState } from "react";
import { Card, Empty, Note, PageHead, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { PROOFS, ProofChip } from "../ui/proof";
import {
  CROP_CATALOG,
  CROP_FAMILIES,
  cropById,
  SALINITY_VERIFIED_COUNT,
} from "../data/catalog";
import { EVIDENCE_CLAIMS, EVIDENCE_CROPS } from "../data/evidence/generated";
import type { RouteKey } from "../app/router";

const STATUS_CLASS = (status: string) =>
  status.startsWith("SUPPORTED")
    ? "badge--meas"
    : status.startsWith("UNDER REVIEW") || status.startsWith("PENDING")
      ? "badge--none"
      : "badge--est";

const STATUS_LABEL = (status: string) =>
  status
    .replace("ESTIMATED — NO EXACT SOURCE ATTACHED", "Estimated · no exact source")
    .replace("ESTIMATED — LOCAL PRACTICE", "Estimated · local practice")
    .replace("ESTIMATED — NEEDS HOST SOURCE", "Estimated · needs host source")
    .replace("ESTIMATED — LAW NOT CONFIRMED", "Estimated · law not confirmed")
    .replace("UNDER REVIEW — VALUE-SPECIFIC SOURCE IN ATTACHMENT", "In attachment")
    .replace("CONTEXT-SPECIFIC REQUIREMENT — CALIBRATED LOCALLY", "Locally calibrated")
    .replace("UNDER REVIEW — CROP/PATHOGEN-SPECIFIC SOURCE REQUIRED", "Needs host source")
    .replace("PENDING OFFICIAL EGYPTIAN REGULATORY REFERENCE", "Awaiting law ref")
    .replace("SUPPORTED FOR SOURCE SCOPE", "Source-scoped")
    .replace("PARTIAL / ENDPOINT MISMATCH", "Endpoint mismatch")
    .replace("PENDING SOURCE SCOPE — AS APPLIED", "Pending as applied")
    .replace("PENDING SOURCE SCOPE", "Pending source")
    .replace("MISMATCH / RANGE COLLAPSED", "Range collapsed")
    .replace("MISMATCH / OVER-PRECISE", "Over-precise")
    .replace("MISMATCH: THRESHOLD", "Threshold mismatch")
    .replace("SPECIES MISMATCH", "Species mismatch")
    .replace("CONDITIONAL MATCH", "Conditional match");

export function CropsPage({ navigate }: { navigate: (route: RouteKey) => void }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [season, setSeason] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("bread-wheat");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return CROP_CATALOG.filter((crop) => {
      if (family !== "all" && crop.family !== family) return false;
      if (season !== "all" && crop.season !== season) return false;
      if (verifiedOnly && crop.salinityLimitDsm === null) return false;
      if (
        search &&
        !crop.name.toLowerCase().includes(search) &&
        !crop.scientificName.toLowerCase().includes(search)
      )
        return false;
      return true;
    });
  }, [query, family, season, verifiedOnly]);

  const selected = cropById(selectedId);
  const selectedEvidence = EVIDENCE_CROPS.find((crop) => crop.name === selected?.name);
  const claims = useMemo(
    () => EVIDENCE_CLAIMS.filter((claim) => claim.crop === selected?.name),
    [selected],
  );
  const supported = claims.filter((claim) => claim.status === "SUPPORTED FOR SOURCE SCOPE").length;

  return (
    <main className="page page--wide">
      <PageHead
        eyebrow="Reference · Crop evidence library"
        glyph="book"
        title={
          <>
            Thirty crops. <em>One</em> sourced number each.
          </>
        }
        lede="Every value in the crop registry with its source status. Source-scoped values drive the engine; estimates are labelled as estimates so you can always see exactly what backs each check."
        actions={
          <div className="row">
            <span className="badge badge--soft badge--meas">
              {SALINITY_VERIFIED_COUNT} with FAO salinity pair
            </span>
          </div>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 22 }}>
        <Stat value={CROP_CATALOG.length} label="Crop entries" foot="registry, source-labeled" />
        <Stat
          value="6"
          label="Checks per season"
          foot="salinity · family · season · water"
          tone="forest"
        />
        <Stat
          value={SALINITY_VERIFIED_COUNT}
          label="FAO salinity pairs"
          foot="source-scoped threshold + slope"
          tone="clay"
        />
        <Stat value={CROP_FAMILIES.length} label="Botanical families" foot="used for rotation breaks" />
      </div>

      <div className="split split--crops">
        <div className="stack">
          <Card
            glyph="compass"
            title="Filter"
            hint="Search the catalogue, or narrow to crops whose salinity pair is source-supported."
          >
            <div className="grid-fields">
              <input
                className="input"
                value={query}
                placeholder="Search crop or scientific name…"
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="select"
                value={family}
                onChange={(event) => setFamily(event.target.value)}
                aria-label="Filter by family"
              >
                <option value="all">All families</option>
                {CROP_FAMILIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                aria-label="Filter by season"
              >
                <option value="all">Both seasons</option>
                <option value="cool">Cool season</option>
                <option value="warm">Warm season</option>
              </select>
              <button
                type="button"
                className="chip-toggle"
                aria-pressed={verifiedOnly}
                onClick={() => setVerifiedOnly((value) => !value)}
              >
                <Glyph name="check" size={13} />
                FAO salinity only
              </button>
            </div>
            <p className="small" style={{ marginTop: 10 }}>
              {filtered.length} of {CROP_CATALOG.length} shown. “Verified” here means only
              that the salinity threshold and slope match FAO’s table for this species —
              not that the crop entry as a whole is validated.
            </p>
          </Card>

          <div className="grid grid--2">
            {filtered.map((crop) => (
              <button
                key={crop.id}
                type="button"
                className={`card${selectedId === crop.id ? " card--flat" : ""}`}
                onClick={() => setSelectedId(crop.id)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor:
                    selectedId === crop.id ? "var(--forest)" : "var(--rule)",
                  boxShadow:
                    selectedId === crop.id
                      ? "inset 0 0 0 1px var(--forest), var(--shadow-card)"
                      : undefined,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span className="row row--between" style={{ alignItems: "flex-start" }}>
                  <span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 600,
                        display: "block",
                        lineHeight: 1.2,
                      }}
                    >
                      {crop.name}
                    </span>
                    <span
                      className="small"
                      style={{ fontStyle: "italic", display: "block", marginTop: 2 }}
                    >
                      {crop.scientificName}
                    </span>
                  </span>
                  <span style={{ color: crop.accent, flexShrink: 0 }}>
                    <Glyph name={crop.glyph} size={20} />
                  </span>
                </span>

                <span className="row" style={{ gap: 5 }}>
                  <span className="badge badge--soft badge--none">{crop.family}</span>
                  <span className="badge badge--soft badge--none">
                    {crop.season === "cool" ? "cool" : "warm"}
                  </span>
                </span>

                <span className="row row--between" style={{ marginTop: 2 }}>
                  <span className="small">
                    Salinity:{" "}
                    {crop.salinityLimitDsm !== null ? (
                      <strong style={{ color: "var(--forest)" }}>
                        {crop.salinityLimitDsm.toFixed(1)} dS/m
                      </strong>
                    ) : (
                      <em>estimated threshold</em>
                    )}
                  </span>
                  <span className="mono" style={{ color: "var(--ink-faint)" }}>
                    {crop.supportedClaims}/{crop.claimsTotal} sourced
                  </span>
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <Empty title="No crop matches those filters" glyph="help">
              Clear the family or season filter to see the full catalogue.
            </Empty>
          )}
        </div>

        <div className="stack crops-detail-stack">
          {selected && selectedEvidence ? (
            <>
              <Card
                glyph={selected.glyph}
                title={selected.name}
                hint={`${selected.scientificName} · ${selected.family} · ${selected.roleLabel}`}
                aside={<span className="badge badge--soft badge--none">{selected.season}</span>}
              >
                <div className="row" style={{ gap: 6, marginBottom: 12 }}>
                  <span className="badge badge--soft badge--est">registry entry</span>
                  <ProofChip
                    proof={PROOFS.unverifiedCropValue(
                      `${selected.claimsTotal - selected.supportedClaims} of ${selected.claimsTotal} parameters for ${selected.name}`,
                    )}
                  />
                </div>

                <div className="table-wrap">
                  <table className="data">
                    <tbody>
                      <tr>
                        <td>Salinity threshold</td>
                        <td>
                          {selected.salinityLimitDsm !== null
                            ? `${selected.salinityLimitDsm.toFixed(1)} dS/m`
                            : "—"}
                        </td>
                        <td>
                          {selected.salinityLimitDsm !== null ? (
                            <ProofChip proof={PROOFS.faoSalinity(selected.name)} compact />
                          ) : (
                            <span className="badge badge--none">no source</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Yield-loss slope</td>
                        <td>
                          {selected.salinitySlopePercentPerDsm !== null
                            ? `${selected.salinitySlopePercentPerDsm.toFixed(1)} %/dS/m`
                            : "—"}
                        </td>
                        <td>
                          {selected.salinitySlopePercentPerDsm !== null ? (
                            <ProofChip proof={PROOFS.faoSalinity(selected.name)} compact />
                          ) : (
                            <span className="badge badge--none">no source</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Water, N, pH, texture, return interval</td>
                        <td className="td-muted">registry values</td>
                        <td>
                          <span className="badge badge--none">estimated</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Note tone="sky" glyph="info" style={{ marginTop: 12 }}>
                  <strong>Activation rule:</strong> {selectedEvidence.activationGate}
                </Note>

                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn--small btn--primary"
                    onClick={() => navigate("plan")}
                  >
                    Use in the rotation board
                  </button>
                </div>
              </Card>

              <Card
                glyph="book"
                title="Claim ledger"
                hint={`${supported} of ${claims.length} source-supported`}
                aside={<span className="mono small">{selected.name}</span>}
              >
                <div className="scroll-y">
                  {claims.map((claim, index) => (
                    <details
                      key={`${claim.parameter}-${index}`}
                      style={{
                        borderBottom: "1px dashed var(--rule)",
                        padding: "8px 0",
                      }}
                    >
                      <summary style={{ cursor: "pointer", listStyle: "none" }}>
                        <span className="row row--between" style={{ alignItems: "baseline" }}>
                          <span style={{ fontSize: 12.5 }}>
                            <strong>{claim.parameter}</strong>
                            <span className="td-muted"> · {claim.value || "—"}</span>
                          </span>
                          <span className={`badge ${STATUS_CLASS(claim.status)}`}>
                            {STATUS_LABEL(claim.status)}
                          </span>
                        </span>
                      </summary>
                      <p className="small" style={{ marginTop: 6, lineHeight: 1.55 }}>
                        {claim.note || "No audit note."}
                      </p>
                      {claim.url && (
                        <a className="small" href={claim.url} target="_blank" rel="noreferrer">
                          Source ↗
                        </a>
                      )}
                    </details>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card glyph="help" title="Select a crop">
              <p className="small">Choose any crop card to read its full claim ledger.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
