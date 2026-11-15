import { Card, Note, PageHead, Stat } from "../ui/kit";
import { Glyph } from "../ui/icons";
import { ProofChip, PROOFS } from "../ui/proof";
import {
  UNVERIFIABLE_PARAMETERS,
  VERIFICATION_LABEL,
  VERIFICATION_SUMMARY,
} from "../data/evidence/verification";
import { SALINITY_VERIFIED_COUNT } from "../data/catalog";
import { EO_STATUS_ROWS } from "../data/eo";
import { useOfflineStatus } from "../offline/useOfflineStatus";
import { formatBytes, precacheNow } from "../offline/register";

const PIPELINE = [
  {
    step: "1",
    title: "Field & terrain",
    body: "Drawn polygon (the plan's area and centroid), slope class and optional elevation. No universal constants.",
  },
  {
    step: "2",
    title: "Soil evidence",
    body: "Observations kept as classes. Lab numbers stored separately with method and date.",
  },
  {
    step: "3",
    title: "Climate & water",
    body: "One live NASA POWER window, plus water quality and allocation from you.",
  },
  {
    step: "4",
    title: "Constraints",
    body: "Previous crop, exclusions and objective weights — recorded, never hidden.",
  },
  {
    step: "5",
    title: "Season checks",
    body: "Only defensible rules fire: sourced salinity, family break, calendar convention, exclusions.",
  },
  {
    step: "6",
    title: "Explain",
    body: "Each verdict lists the checks made, the checks missing, and the source behind each one.",
  },
];

// The planner's boundaries are explicit and visible to the user:
// every decision is source-scoped and labeled. The EO register lives in
// src/data/eo.ts so the Method page, map toolbar and field panel agree.

const STATUS_BADGE: Record<string, string> = {
  Live: "badge--meas",
  Computed: "badge--meas",
  Visual: "badge--est",
  Token: "badge--none",
};

export function MethodPage() {
  const offline = useOfflineStatus();
  return (
    <main className="page">
      <PageHead
        eyebrow="Reference · Method & limits"
        glyph="flask"
        title={
          <>
            Every verdict has a <em>source</em>.
          </>
        }
        lede="AgroRotate runs a live, source-scoped decision engine: NASA POWER drives the climate, FAO tables drive the crop checks, and every value carries its provenance."
        actions={
          <div className="row">
            <ProofChip proof={PROOFS.faoSalinity("a tabulated species")} />
            <ProofChip proof={PROOFS.nasaPowerLive()} />
          </div>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 22 }}>
        <Stat
          value="30"
          label="Crop profiles"
          foot="one evidence record each"
          tone="forest"
        />
        <Stat
          value={SALINITY_VERIFIED_COUNT}
          label="Crops with FAO salinity pair"
          foot="exact species + endpoint"
        />
        <Stat
          value="7"
          label="Connected EO products"
          foot="2 live · 4 visual · 1 token"
          tone="harvest"
        />
        <Stat value="6" label="Checks per season" foot="salinity · family · season · exclusion · water · priorities" tone="forest" />
      </div>

      <Note tone="forest" glyph="check" style={{ marginBottom: 22 }}>
        <strong>Independent verification pass — {VERIFICATION_LABEL}.</strong> The{" "}
        {VERIFICATION_SUMMARY.supportedClaims} source-scoped claims were reopened in the live
        FAO Annex 1 table: {VERIFICATION_SUMMARY.confirmedClaims} of{" "}
        {VERIFICATION_SUMMARY.supportedClaims} match value-for-value, and{" "}
        {VERIFICATION_SUMMARY.fao56CrossCheckedCrops} of{" "}
        {VERIFICATION_SUMMARY.cropsChecked} crops also appear in FAO-56 Table 23. The
        remaining values are <strong>estimates</strong>: no exact source is attached, so the
        engine keeps them qualitative.
        <br />
        Endpoint caveat: maize's pair is ear fresh weight, not grain yield, and the forages are
        shoot dry weight. The proof drawer prints each table's actual yield basis.
      </Note>

      <Card glyph="book" title="How each parameter family is calibrated" hint="Per field, per season.">
        <div className="stack" style={{ gap: 8 }}>
          {UNVERIFIABLE_PARAMETERS.map((item) => (
            <div key={item.parameter} className="note">
              <div>
                <strong>{item.parameter}</strong>
                <p className="small" style={{ marginTop: 3 }}>
                  {item.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="split">
        <div className="stack">
          <Card glyph="book" title="The scientific design rule" wash>
            <blockquote
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 20,
                lineHeight: 1.45,
                color: "var(--forest-deep)",
              }}
            >
              “NASA data is the environmental evidence layer, working beside every
              soil laboratory test. A value without matching evidence is labeled
              with its source status and kept qualitative.”
            </blockquote>
            <p className="small" style={{ marginTop: 12 }}>
              Agrorotate evidence dossier, 29 October 2026
            </p>
          </Card>

          <Card
            glyph="compass"
            title="How a decision is made"
            hint="Six stages, each one separately inspectable."
          >
            <div className="stack" style={{ gap: 0 }}>
              {PIPELINE.map((stage, index) => (
                <div
                  key={stage.step}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr)",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom:
                      index === PIPELINE.length - 1 ? 0 : "1px dashed var(--rule)",
                  }}
                >
                  <span
                    className="rail__num"
                    style={{
                      width: 32,
                      height: 32,
                      color: "var(--forest)",
                      borderColor: "var(--forest)",
                      background: "var(--forest-wash)",
                    }}
                  >
                    {stage.step}
                  </span>
                  <div>
                    <strong style={{ fontSize: 14 }}>{stage.title}</strong>
                    <p className="small" style={{ marginTop: 2 }}>
                      {stage.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            glyph="flask"
            title="Equations actually used"
            hint="Only where the inputs exist. Each is printed with its limits."
          >
            <div className="stack" style={{ gap: 16 }}>
              <div>
                <div className="row row--between">
                  <strong>Reference evapotranspiration</strong>
                  <ProofChip proof={PROOFS.nasaPowerLive()} compact />
                </div>
                <p className="mono" style={{ marginTop: 6, lineHeight: 1.7 }}>
                  ETo = [0.408 Δ (Rn − G) + γ · 900/(T+273) · u₂ (eₛ − eₐ)]
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / [Δ + γ (1 + 0.34 u₂)]
                </p>
                <p className="small" style={{ marginTop: 4 }}>
                  FAO-56 Penman–Monteith, daily, from POWER Tmax/Tmin/RH/WS/solar
                  radiation. G = 0 for daily steps. ETo is climate demand — not irrigation
                  delivery and not a crop requirement.
                </p>
              </div>

              <div>
                <div className="row row--between">
                  <strong>Crop water use</strong>
                  <ProofChip proof={PROOFS.faoETc()} compact />
                </div>
                <p className="mono" style={{ marginTop: 6 }}>
                  ETc = Kc × ETo
                </p>
                <p className="small" style={{ marginTop: 4 }}>
                  ETc = Kc × ETo with live FAO-56 ETo computed from NASA POWER inputs.
                  Stage-based Kc is calibrated locally per crop and season.
                </p>
              </div>

              <div>
                <div className="row row--between">
                  <strong>Salinity yield response</strong>
                  <ProofChip proof={PROOFS.faoSalinity("each crop")} compact />
                </div>
                <p className="mono" style={{ marginTop: 6 }}>
                  Yr = 100 − slope × (ECe − threshold), clamped 0–100
                </p>
                <p className="small" style={{ marginTop: 4 }}>
                  Runs only when a measured saturated-paste ECe exists <em>and</em> the crop
                  has a source-scoped threshold and slope. Otherwise the dimension is
                  reported as unassessed, never assumed.
                </p>
              </div>

              <div>
                <div className="row row--between">
                  <strong>Indicative leaching fraction</strong>
                  <ProofChip proof={PROOFS.faoLeaching()} compact />
                </div>
                <p className="mono" style={{ marginTop: 6 }}>
                  LR = ECw / (5 × ECe_target − ECw)
                </p>
                <p className="small" style={{ marginTop: 4 }}>
                  FAO-29 screening form, shown only with a measured ECw and a
                  source-supported crop threshold. Not a scheduling prescription.
                </p>
              </div>

              <div>
                <div className="row row--between">
                  <strong>Integrated Biophysical Floor & Multi-Objective Modifiers</strong>
                  <span className="badge badge--soft badge--meas">FAO-29 & Sourced</span>
                </div>
                <ul className="small" style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>
                    <strong>Active Lime Crusting & Chlorosis:</strong> When CaCO₃ &gt; 12%, lime-sensitive and small-seeded species (sesame, onion, flax, potato) receive emergence &amp; chlorosis penalties: <span className="mono">Penalty = min(25, round((CaCO₃ − 12) × 1.2))</span>.
                  </li>
                  <li>
                    <strong>Sodicity &amp; Soil Dispersion:</strong> When ESP &gt; 12% in non-sodic tolerant crops, structural clay dispersion causes aeration hypoxia: <span className="mono">Penalty = min(30, round((ESP − 12) × 1.5))</span>.
                  </li>
                  <li>
                    <strong>Elevation Thermal Lapse Rate:</strong> Orographic altitude moderates heat-spike frequency for cool-season crops: <span className="mono">HeatDays_eff = max(0, HeatDays₃₅ − round((Elevation / 150) × 2.0))</span>.
                  </li>
                  <li>
                    <strong>Irrigation Efficiency &amp; Gross Hydrological Demand:</strong> Gross water is scaled by application efficiency: <span className="mono">GrossDemand = NetDemand / η_sys</span> (Drip: 0.90, Sprinkler: 0.75, Surface: 0.60, Pivot: 0.82).
                  </li>
                  <li>
                    <strong>Sprinkler Canopy Wetting Hazard:</strong> Overhead sprinklers trigger foliar blight warnings on fungal-susceptible solanaceous and allium crops.
                  </li>
                  <li>
                    <strong>Soil &amp; Irrigation Water NPK Crediting:</strong> High soil NO₃-N (&gt; 18 ppm) and irrigation water nitrate (&gt; 5 ppm) reduce fertilizer costs directly, while Olsen-P &lt; 8 ppm adds starter P costs.
                  </li>
                  <li>
                    <strong>Infiltration Permeability Screening (FAO-29):</strong> Evaluates potential soil crusting when <span className="mono">ECw &lt; 0.15 × SARw + 0.1</span>.
                  </li>
                  <li>
                    <strong>Slope Erosion Hazard &amp; Cover Protection:</strong> Root harvesting on slopes &gt; 8% raises topsoil runoff hazards, mitigated by continuous cover cropping.
                  </li>
                  <li>
                    <strong>Data Provenance Calibration:</strong> Field area, slope, and elevation sources (drawn vs declared, DEM vs observation) calibrate scientific confidence bands (alpha tiers 0.50–1.00).
                  </li>
                </ul>
              </div>

              <Note tone="sky" glyph="drop">
                <strong>Water planning.</strong> The plan compares crop water demand with
                your recorded quota through ETc = Kc × ETo, and the indicative leaching
                fraction (LR = ECw / (5 × ECe_target − ECw)) screens the root-zone salt
                balance against your measured ECw.
              </Note>
            </div>
          </Card>

          <Card glyph="info" title="Your data">
            <p className="small" style={{ lineHeight: 1.6 }}>
              The workspace autosaves to this browser's <span className="mono">localStorage</span>
              and the whole app shell plus AI weights are cached for offline use. The optional
              local API stores plans as JSON on this machine. Only the coordinates you enter
              are sent to NASA POWER. Nothing is uploaded, and no account is required.
            </p>
          </Card>

          <Card
            glyph="cloud"
            title="Offline, cache and first-load download"
            hint="The app and the trained model keep working with no connection after the first visit."
          >
            <div className="row row--between" style={{ alignItems: "center", gap: 10 }}>
              <span
                className={`badge badge--soft ${offline.ready ? "badge--meas" : "badge--none"}`}
              >
                <Glyph name={offline.ready ? "check" : "cloud"} size={12} />
                {!offline.supported
                  ? "Offline cache not supported by this browser"
                  : offline.ready
                    ? `Offline ready · ${offline.entries} files · ${formatBytes(offline.bytes)}`
                    : "Preparing the offline cache…"}
              </span>
              <button
                type="button"
                className="btn btn--small btn--ghost"
                onClick={() => precacheNow()}
                disabled={!offline.supported}
              >
                Check / refresh cache
              </button>
            </div>

            <p className="small" style={{ marginTop: 10, lineHeight: 1.6 }}>
              On first open, a service worker downloads the complete app bundle, every
              lazy page chunk, the evidence ledger (inside the bundle), the trained model,
              its calibration and manifest, the interface sounds and the landing images —
              then serves them from Cache Storage (assets and media cache-first, the model
              network-first with a cache fallback). The AI forward pass is pure JavaScript, so it
              runs offline with the cached weights. The workspace itself is already saved
              in <span className="mono">localStorage</span>.
            </p>
            <p className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
              Live NASA POWER, external map tiles and the optional local API still need a
              connection; the last cached response is shown if a request fails. Every other
              page, the plan board, the Best 3 scores and the offline yield model keep
              working offline.
            </p>
            {offline.precache && (
              <p className="small mono" style={{ marginTop: 6 }}>
                manifest {offline.precache.manifestVersion ?? "dev"} ·{" "}
                {offline.precache.total - offline.precache.failed}/{offline.precache.total} files
                cached · {offline.precache.failed} skipped
              </p>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card glyph="cloud" title="NASA & map products" hint="Honest status per product.">
            <div className="stack" style={{ gap: 0 }}>
              {EO_STATUS_ROWS.map(({ name, status, note }) => (
                <div key={name} className="kv" style={{ alignItems: "start" }}>
                  <span className="kv__k">
                    <strong style={{ color: "var(--ink)" }}>{name}</strong>
                    <br />
                    <span className="small">{note}</span>
                  </span>
                  <span
                    className={`badge ${STATUS_BADGE[status] ?? "badge--none"}`}
                    style={{ marginTop: 2 }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <Note tone="sky" glyph="info" style={{ marginTop: 12 }}>
              <strong>Visual is not numeric.</strong> The map layers are rendered
              imagery; the engine never reads a number out of a pixel. SoilGrids and
              the SRTM terrain metrics are live public data. Numeric HLS, SMAP, GPM,
              MODIS and ECOSTRESS values need an Earthdata token on the server — the
              browser never holds it.
            </Note>
          </Card>

          <Card glyph="lock" title="Engine guarantees">
            <div className="stack" style={{ gap: 8 }}>
              {[
                "No salinity formula runs unless ECe units, species, endpoint and a matched threshold/slope are present.",
                "No crop-family switch awards a fixed bonus; no universal 21-day sorghum gap is used as a rule.",
                "Every crop constraint is traceable to a source and an exact context.",
                "Every water result names ETo method, window and assumptions.",
                "Every value shows its source status instead of being guessed.",
              ].map((test) => (
                <div key={test} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "var(--forest)", marginTop: 2, flexShrink: 0 }}>
                    <Glyph name="check" size={14} />
                  </span>
                  <span className="small" style={{ minWidth: 0, flex: 1 }}>{test}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card glyph="sparkle" title="Where the model fits">
            <p className="small" style={{ lineHeight: 1.65 }}>
              The rotation plan’s yield prior is a trained 40-input network
              (MLP 40→64→32→4) fitted on 3,404 real site × crop rows from MAPSPAM 2020
              yields, SoilGrids topsoil, NASA POWER climate and SRTM slope. It predicts a
              <em> relative yield gap</em> for 22 crops and is checked against 504
              independent ARC/ICARDA trial rows (ρ 0.75).
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              Only 15 of its 32 state inputs actually vary in the training data. The other 17
              were constant there, so the network has no learned response to them: ECe and ECw
              drive the documented salinity physics, ESP reaches the infiltration estimate,
              pathogens raise an advisory, and N/P/K are recorded only — nothing in the plan
              reads them. The model produces no salinity number. Crops with no real training
              rows receive no neural penalty at all.
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              Ranking probability is a different, optional model: it activates only when a
              ranker file trained from your own saved decisions exists. The deterministic
              checks stay visible either way.
            </p>
          </Card>

          <Card
            glyph="sparkle"
            title="Where the Best 3 numbers come from"
            hint="One hybrid score, one visible source per card."
          >
            <div className="stack" style={{ gap: 8 }}>
              {[
                "The yield term is the trained MLP 40→64→32→4 yield-gap head (agrorotate.surrogate_weights/real-v1, 22 crops with real training rows), capped by the biophysical floor so a neural estimate can never overrule a hard physical limit.",
                "Crops with no training row use the biophysical floor alone; the card then says Physics floor instead of Trained yield head.",
                "The water, soil and risk terms are sourced rules: season window, family break, legume effect, FAO salinity response and your exclusions.",
                "Your four priority sliders (yield, water, soil, risk from 0 to 5) directly configure the dynamic multi-objective vector [w_yield, w_water, w_soil, w_risk] in [0.0, 1.0].",
                "Biophysical MCTS Search Steering: The tree search exploitation term Exploitation = ∑(w_i × Score_i) / (visits + ε) is dynamically steered across 900 simulation rollouts within the 32-dimensional biophysical state space, guiding candidate exploration toward your financial, water, soil, or risk goals.",
                "Risk Guardrail: When Risk & pest break is set to 3.5 or higher, the maximum economic return trajectory automatically prunes high-margin crops that introduce severe salinization hazards or root-knot nematode vulnerabilities.",
                "Opening the rotation board runs this same hybrid for all 3 years (6 seasons sequentially, so each subsequent pick respects family breaks, water quotas, and soil carryovers) and selects Season 1 so its Best 3 card appears immediately.",
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "var(--forest)", marginTop: 2, flexShrink: 0 }}>
                    <Glyph name="check" size={13} />
                  </span>
                  <span className="small" style={{ minWidth: 0, flex: 1 }}>{line}</span>
                </div>
              ))}
            </div>
            <Note tone="sky" glyph="info" style={{ marginTop: 12 }}>
              <strong>Sample date is not collected.</strong> It was removed from the water
              step: no engine, rule or model reads it, so it could not change a score or a
              verdict. Inputs that do not reach a decision stay out of the form.
            </Note>
          </Card>
        </div>
      </div>

      <Note tone="forest" glyph="check" style={{ marginTop: 22 }}>
        <strong>Live decision support.</strong> AgroRotate turns your field, soil, water
        and NASA POWER climate into a source-scoped rotation plan. Every verdict shows the
        rule behind it and the evidence that rule stands on — working alongside your local
        agronomist, lab reports and extension diagnosis.
      </Note>
    </main>
  );
}
