# NASA data provenance — variable to decision

This note answers one challenge requirement directly: **where does NASA data
enter the decision?** It traces the wired variable from request to the number
the optimizer reads. Product names, units and limits follow the source registry
in [`SOURCES.md`](SOURCES.md) (S02–S04, NASA POWER; S01, challenge brief).

## The wired chain

| Step | NASA POWER product | Variable | Unit | Where it enters |
| --- | --- | --- | --- | --- |
| 1. Request | POWER Daily API, AG community, point request at the parcel centroid | T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR | °C, %, m/s, MJ m⁻² day⁻¹, mm/day | `src/api/client.ts` → `fetchClimateContext` |
| 2. Normalise | Same | each daily record; POWER `-999` becomes `null` | | `src/engine/climate.ts` → `summarisePower` |
| 3. ET₀ | Same | FAO-56 Penman–Monteith from Tmax, Tmin, RHmean, wind at 2 m, solar radiation, latitude, elevation | mm/day | `fao56PenmanMonteith` → `ClimateSummary.etoAnnualMm` |
| 4. Vector | Same | annual ET₀ (and heat days / rainfall context) | mm/year | `src/engine/estimate.ts` → continuous vector slot 30 (`annualEt0Mm / 2900`) |
| 5. Decision | Same | ET₀ is not a score by itself: it sets the climate context and the crop water-demand comparison in the trajectory evaluation | | `src/engine/optimizer.ts` → `evaluateCropTrajectory`, water-saving score |
| 6. Display | Same | source, parameter list, coordinates, date window, fetch time, cache state | | `src/pages/WaterPage.tsx`, `src/pages/SourcesPage.tsx` |

The exact request is reconstructible from the UI: the Sources/Water pages print
the endpoint parameters, the parcel centroid, the daily window (`startDate` →
`endDate`, number of records), the fetch timestamp and whether the response came
from the live request or the local server cache.

## Data status the UI must distinguish

| Status | Meaning | Where it is shown |
| --- | --- | --- |
| `live` | A fresh POWER response for this parcel and window | Fetch row: "live request"; `fetchedAtIso` |
| `server_cache` | The local API returned a stored response | Fetch row: "served from local cache — may be older than the field" |
| `partial` ET₀ | Some days miss a required variable and are excluded | Water step table "ET₀ input coverage" and a warning note |
| `unavailable` | No day had the full input set; `etoAnnualMm` is `null` | The app shows the gap; no measured-looking value replaces it |
| `EO_PRIOR` fallback vector | When no climate has been fetched, the vector uses a declared regional prior (`1680 mm`) and labels the tier `EO_PRIOR` | Method/Evidence provenance tier; never shown as a NASA measurement |
| `error` | The request failed | The climate card shows the error; cached values, if any, remain labelled |

No default is displayed as a NASA observation. `summarisePower` returns `null`
when the payload has no usable parameter, and the client raises an error instead
of inventing a series.

## What is *not* wired

Only NASA POWER daily agroclimatology is wired into the decision in this build.
No token-gated numeric granule product is listed or presented as available: if a
layer is not implemented, it is not advertised as a product input.

## Verification

- `tests/climate.test.mjs` checks POWER parsing, `-999` handling, ET₀,
  rainfall scaling and partial-series labelling.
- `npm run audit:inputs` lists every collected input and the decision module
  that reads it.
