import { Card, Note, PageHead, Stat } from "../ui/kit";
import { PROOFS, ProofChip } from "../ui/proof";
import { EO_PRODUCTS } from "../data/eo";
import { MODEL_CARD } from "../data/evidence/crops.generated";

const EXTRA_GIBS_ROWS = [
  {
    product: "MODIS NDVI · 8-day",
    label: "MODIS · NDVI 8-day",
    id: "MODIS_Terra_NDVI_8Day",
    zoom: 9,
    use: "Rolling 8-day greenness context for the map; visual only.",
  },
  {
    product: "True-colour base",
    label: "MODIS Terra corrected reflectance",
    id: "MODIS_Terra_CorrectedReflectance_TrueColor",
    zoom: 9,
    use: "The satellite base imagery under the parcel, requested as WMS.",
  },
];

/**
 * The one tab that answers "where does every number come from?": each NASA or
 * FAO source the app calls, the exact endpoint and parameters, what it feeds,
 * and the limits recorded in the evidence ledger.
 */
export function SourcesPage() {
  const gibsRows = [
    ...EO_PRODUCTS.flatMap((product) =>
      product.gibs.map((layer) => ({
        product: product.name,
        label: layer.label,
        id: layer.id,
        zoom: layer.maxNativeZoom,
        use: product.role,
      })),
    ),
    ...EXTRA_GIBS_ROWS,
  ];

  return (
    <main className="page">
      <PageHead
        eyebrow="Transparency"
        glyph="book"
        title={
          <>
            Every source, every <em>API</em>.
          </>
        }
        lede="The complete register of the data the app touches: the NASA APIs it calls with the chosen coordinates, the geocoding and terrain services, the FAO tables behind the engine, and the rotation model trained on real global data."
      />

      <div className="grid grid--4" style={{ marginBottom: 20 }}>
        <Stat value="NASA POWER" label="Climate engine" foot="daily AG · 7 parameters" tone="forest" />
        <Stat value="NASA GIBS" label="Visual layers" foot="SRTM · static relief" />
        <Stat value="SoilGrids" label="Live soil priors" foot="250 m · ISRIC REST" tone="harvest" />
        <Stat value="FAO 56" label="Water & salinity" foot="Kc · threshold · slope" tone="harvest" />
      </div>

      <div className="stack" style={{ gap: 18 }}>
        <Card
          glyph="sun"
          title="NASA POWER · daily agroclimatology"
          hint="The climate engine. Called with the exact centroid of the drawn parcel."
          aside={<span className="badge badge--soft badge--meas">measured · live</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>What</th>
                  <th>Detail on record</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Endpoint</td>
                  <td className="mono">power.larc.nasa.gov/api/temporal/daily/point</td>
                </tr>
                <tr>
                  <td>Community</td>
                  <td>AG (agroclimatology) · JSON · daily UTC</td>
                </tr>
                <tr>
                  <td>Parameters</td>
                  <td className="mono">T2M, T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR</td>
                </tr>
                <tr>
                  <td>Window</td>
                  <td>Rolling 5-year window, ending 3 days before today (POWER daily lag)</td>
                </tr>
                <tr>
                  <td>Derived on device</td>
                  <td>FAO-56 Penman–Monteith ETo (Eq. 6, Ra Eq. 21), monthly means, seasonal fingerprint, heat/dry/frost day counts</td>
                </tr>
                <tr>
                  <td>Paths</td>
                  <td>Local API <span className="mono">/api/v1/context</span> (server-side cache, reproducible) with a direct-from-browser POWER fallback when the backend is offline</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <ProofChip proof={PROOFS.nasaPowerLive("Daily AG point request per parcel centroid; parameters listed above.")} />
            <a className="btn btn--small btn--ghost" href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noreferrer">
              POWER daily docs
            </a>
          </div>
        </Card>

        <Card
          glyph="map"
          title="NASA GIBS (EOSDIS) · visual layers"
          hint="One product at a time on the field map. The imagery is context; it is never converted into numbers."
          aside={<span className="badge badge--soft badge--est">visual · not numeric</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Layer id</th>
                  <th>Native</th>
                  <th>Use</th>
                </tr>
              </thead>
              <tbody>
                {gibsRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.product}</td>
                    <td className="mono">{row.id}</td>
                    <td className="mono">z{row.zoom}</td>
                    <td>{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ marginTop: 10 }}>
            WMTS service: <span className="mono">gibs.earthdata.nasa.gov/wmts/epsg3857/best</span> ·
            EPSG:3857 · <span className="mono">image/png</span>. The URL carries style then
            time, e.g. <span className="mono">/&#123;layer&#125;/default/default/&#123;matrix&#125;/&#123;z&#125;/&#123;y&#125;/&#123;x&#125;.png</span>.
            The base map uses the GIBS WMS endpoint. Browse imagery is visual context only:
            the engine never reads a number out of a pixel, and a GIBS pixel is much
            coarser than a field.
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <a className="btn btn--small btn--ghost" href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noreferrer">
              NASA Worldview
            </a>
            <a className="btn btn--small btn--ghost" href="https://nasa-gibs.github.io/gibs-api-docs/" target="_blank" rel="noreferrer">
              GIBS API docs
            </a>
          </div>
        </Card>

        <Card
          glyph="pin"
          title="Geocoding & terrain"
          hint="How a typed village name becomes coordinates, and how elevation is attached."
          aside={<span className="badge badge--soft badge--est">estimated · screening</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Place search</td>
                  <td>Nominatim (OpenStreetMap) via <span className="mono">/api/v1/geocode</span> — cached server-side, never stores your query beyond the cache key</td>
                </tr>
                <tr>
                  <td>Elevation / relief</td>
                  <td>Open-Meteo elevation API (Copernicus DEM / SRTM-backed) via <span className="mono">/api/v1/field/analyze</span>. A 5×5 sample grid is fitted for elevation and slope. Slope is a model input; elevation is climate context. Not a survey-grade DEM map.</td>
                </tr>
                <tr>
                  <td>Unified EO snapshot</td>
                  <td><span className="mono">POST /api/v1/eo</span> returns terrain, SoilGrids and the GIBS layer registry in one response. Accepts a boundary or a lat/lon point.</td>
                </tr>
                <tr>
                  <td>Browser location</td>
                  <td>Optional <span className="mono">navigator.geolocation</span> — used only when you press “My location”</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          glyph="layers"
          title="SoilGrids (ISRIC) · mapped soil priors"
          hint="Live public data for the field centroid. A 250 m mapped prediction, explicitly not a laboratory test."
          aside={<span className="badge badge--soft badge--meas">live · mapped prior</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>What</th>
                  <th>Detail on record</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Endpoint</td>
                  <td className="mono">rest.isric.org/soilgrids/v2.0/properties/query</td>
                </tr>
                <tr>
                  <td>Properties</td>
                  <td className="mono">clay, sand, silt, phh2o, soc, cec, bdod, nitrogen, cfvo, wv0010, wv0033, wv1500</td>
                </tr>
                <tr>
                  <td>Depths</td>
                  <td>0–5, 5–15, 15–30, 30–60, 60–100 cm; topsoil is the depth-weighted 0–30 cm mean, root zone 0–100 cm</td>
                </tr>
                <tr>
                  <td>Units</td>
                  <td>Clay / sand / silt %, pH(H₂O), SOC %, CEC cmol(c)/kg, bulk density g/cm³, water retention % vol.</td>
                </tr>
                <tr>
                  <td>Uncertainty</td>
                  <td>Every layer keeps the SoilGrids predicted uncertainty; the panel shows it as ± next to the 0–30 cm mean</td>
                </tr>
                <tr>
                  <td>How it is used</td>
                  <td>Used as a global baseline and conformal calibration benchmark for the AI surrogate model; field soil properties in the app are strictly grounded in direct farmer records (Lab MEAS & Field EST).</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn btn--small btn--ghost" href="https://soilgrids.org/" target="_blank" rel="noreferrer">
              SoilGrids
            </a>
            <a className="btn btn--small btn--ghost" href="https://rest.isric.org/soilgrids/v2.0/docs" target="_blank" rel="noreferrer">
              ISRIC REST docs
            </a>
          </div>
        </Card>

        <Card
          glyph="lock"
          title="Numeric earth-observation inputs"
          hint="SRTM terrain and SoilGrids priors are the only numeric EO inputs in this build; both are public."
          aside={<span className="badge badge--soft badge--meas">live</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Numeric status</th>
                  <th>What the app does today</th>
                </tr>
              </thead>
              <tbody>
                {EO_PRODUCTS.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <div className="small td-muted">
                        {product.resolution} · {product.cadence}
                      </div>
                    </td>
                    <td>
                      {product.numeric === "live" ? "live" : "token required"}
                    </td>
                    <td>
                      {product.methodNote}
                      <div className="small td-muted">{product.caveat}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ marginTop: 10 }}>
            No Earthdata-token granule product is wired in this build, so no numeric
            value depends on a credential. The server may still report whether one is
            configured, without exposing it to the browser.
          </p>
        </Card>

        <Card
          glyph="book"
          title="FAO source tables"
          hint="The decision rules the rotation engine runs, before NASA data is ever involved."
          aside={<span className="badge badge--soft badge--meas">source-scoped</span>}
        >
          <div className="stack" style={{ gap: 10 }}>
            <div>
              <strong>FAO-56 (1998)</strong> — Penman–Monteith reference ET: Eq. 6 (ETo) and
              Eq. 21 (extraterrestrial radiation Ra). Implemented in <span className="mono">src/engine/climate.ts</span>,
              one implementation shared by every path.
            </div>
            <div>
              <strong>FAO Irrigation & Drainage Paper 29 / Annex 1 (Ayers &amp; Westcot, 1985)</strong> — crop salinity
              threshold (ECe) and yield-decline slope pairs per crop, soil sodicity dispersion thresholds (ESP &gt; 12%),
              active lime sensitivity (CaCO₃ &gt; 12%), and water infiltration permeability hazard screening (ECw vs SARw).
            </div>
            <div>
              <strong>Saxton &amp; Rawls (2006) Soil Physics</strong> — pedotransfer functions predicting field capacity,
              wilting point, available water capacity, and saturated hydraulic conductivity across 12 USDA textural classes.
            </div>
            <div>
              <strong>FAO crop season windows</strong> — planting/harvest windows and family
              (botanical) break rules used by the rotation checks.
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn btn--small btn--ghost" href="https://www.fao.org/4/x0490e/x0490e00.htm" target="_blank" rel="noreferrer">
              FAO-56 full text
            </a>
            <a className="btn btn--small btn--ghost" href="https://www.fao.org/4/y4360e/y4360e00.htm" target="_blank" rel="noreferrer">
              FAO Drainage & salinity
            </a>
          </div>
        </Card>

        <Card
          glyph="sparkle"
          title="The rotation yield model"
          hint="What was trained, on what, and how well it tested outside its own data."
          aside={<span className="badge badge--soft badge--model">{MODEL_CARD.version}</span>}
        >
          <p className="small" style={{ lineHeight: 1.65 }}>
            <span className="mono">{MODEL_CARD.architecture}</span> — it predicts{" "}
            {MODEL_CARD.predicts} only. Trained on {(MODEL_CARD.rows ?? 0).toLocaleString()} real
            site × crop rows ({MODEL_CARD.sites} sites, {MODEL_CARD.crops} crops) from{" "}
            {MODEL_CARD.trainedOn.join("; ")}.
          </p>
          <div className="grid grid--3" style={{ gap: 10, marginTop: 12 }}>
            <Stat
              value={MODEL_CARD.metrics?.oofMae ?? "—"}
              label="OOF MAE (pp)"
              foot="5-fold spatial block CV"
              tone="forest"
            />
            <Stat
              value={MODEL_CARD.metrics?.arcSpearman ?? "—"}
              label="ARC/ICARDA ρ"
              foot="independent 504-row exam"
              tone="harvest"
            />
            <Stat
              value={`${MODEL_CARD.featureCounts.learned}/32`}
              label="learned state dims"
              foot={`${MODEL_CARD.featureCounts.physicsOnly} not learned · ${MODEL_CARD.featureCounts.constant} constant`}
            />
          </div>
          <div className="grid grid--2" style={{ gap: 10, marginTop: 12 }}>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>Learned from the training rows</strong>
              <p className="small" style={{ marginTop: 6 }}>
                {MODEL_CARD.learnedNames.join(" · ")}
              </p>
            </div>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>Constant in training — and what reads it</strong>
              <p className="small" style={{ marginTop: 6 }}>
                {MODEL_CARD.physicsOnlyDetail.map((item) => (
                  <span key={item} style={{ display: "block", marginBottom: 4 }}>
                    {item}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <Note tone="harvest" glyph="info" style={{ marginTop: 12 }}>
            ECe is <strong>not</strong> a model input. A measured WoSIS ECe layer was joined to{" "}
            {MODEL_CARD.salinity.eceCoverageSites} sites and tested: it did not improve accuracy
            and inverted the salinity response (ARC/ICARDA ρ {""}
            {MODEL_CARD.salinity.eceExperiment?.withEce?.arc_spearman ?? "—"} vs {""}
            {MODEL_CARD.salinity.eceExperiment?.withoutEce?.arc_spearman ?? "—"}), so salinity
            stays with the Maas–Hoffman physics and the crop threshold/slope pairs.
          </Note>
        </Card>

        <Card
          glyph="book"
          title="Evidence and model layer"
          hint="Retrieval over the audited ledger — separate from the yield model above."
          aside={<span className="badge badge--soft">rules + retrieval</span>}
        >
          <div className="grid grid--2" style={{ gap: 10 }}>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>Evidence ledger</strong>
              <p className="small" style={{ marginTop: 6 }}>
                <span className="mono">server/ai/evidence.json</span> — an audited claim
                ledger over 30 crop profiles, each with
                crop, parameter, value, source URL and a scope status (“SUPPORTED FOR SOURCE
                SCOPE” or explicitly estimated). Only claims a decision reads are kept:
                family, season and the FAO salinity threshold/slope pair.
              </p>
            </div>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>Evidence Retrieval & Decision Engine</strong>
              <p className="small" style={{ marginTop: 6 }}>
                <span className="mono">server/ai/retrieval.mjs</span> searches the audited evidence ledger by
                crop/parameter, while the neural surrogate model evaluates yield projections
                calibrated with NASA Earth Observations and SoilGrids data.
              </p>
            </div>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>Local API endpoints</strong>
              <p className="small mono" style={{ marginTop: 6, lineHeight: 1.9 }}>
                GET /api/v1/health<br />
                POST /api/v1/context<br />
                GET /api/v1/geocode<br />
                POST /api/v1/field/analyze<br />
                GET / POST /api/v1/eo<br />
                GET / POST /api/v1/eo/soilgrids<br />
                POST /api/v1/plans/sync · GET /api/v1/plans/:id<br />
                POST /api/v1/ai/choose
              </p>
            </div>
            <div className="card card--flat" style={{ padding: 16 }}>
              <strong>What is never used for training</strong>
              <p className="small" style={{ marginTop: 6 }}>
                The farmer’s personal field record. Saved decisions stay in{" "}
                <span className="mono">server/data/</span> and are only used for your own
                revision history and local farm plan records.
              </p>
            </div>
          </div>
        </Card>

        <Note tone="sky" glyph="info">
          Nothing in this register is decorative: every card maps one-to-one to a call or
          a table the running app actually uses. Where a value is estimated instead of
          measured, the badge next to it says so — and the Method tab explains the limit.
          The seven EO products now have an explicit state: <strong>live</strong> for
          SoilGrids and SRTM terrain, <strong>visual</strong> for the four GIBS layers,
          and <strong>token</strong> where numeric NASA access is still missing.
        </Note>
      </div>
    </main>
  );
}

export default SourcesPage;
