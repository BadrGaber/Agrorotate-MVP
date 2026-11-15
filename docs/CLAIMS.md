# Claim policy — evidence, estimates, and the sales deck

The external sales/value deck (`agrorotate_sales_deck_report.md`, not part of
this repository) states figures such as **+45–70 % profit**, **25–35 % water
saving**, **$180–320/ha fertiliser saving** and **90 % pest loss/cost
reduction**. No field trial, paired-farm study or worked calculation supporting
those values exists in this repository. They are therefore treated as
**unverified marketing claims**, not product results.

## Rules applied in the app

1. **No guaranteed outcome.** The product does not state that using AgroRotate
   increases profit, saves water or reduces pests by a fixed percentage.
2. **Scenario output is labelled as an estimate.** The compare view prints the
   measured simulation count and elapsed time, and states that the scores are
   model estimates under the declared inputs and weights — not measured farm
   outcomes.
3. **No mixing of evidence types.** Sourced rules (FAO salinity, NASA POWER
   climate, rotation principles) are separated from model estimates (trained
   yield-gap prior) and from farmer-entered measurements; each carries its own
   provenance tier (`MEAS`, `EST`, `EO_PRIOR`) in the app.
4. **Local review.** Fertilisation, irrigation and pest-control decisions are
   presented as decision support to review with a local agronomist or extension
   service, not as prescriptions.

## If those figures are ever published

Each percentage or money value must carry, next to it:

- the baseline it is measured against;
- whether it is a **simulation result** or a **field/experimental result**;
- the price, yield and consumption assumptions (with their source and date);
- the sample size and geography for experimental data;
- a link to the dataset or worked calculation that reproduces it.

Until then the deck figures must be removed or explicitly marked
"illustrative scenario, not a measured result". The app itself intentionally
does not reproduce them.

## What the app *does* claim, and can be checked

| Claim | Evidence |
| --- | --- |
| Climate comes from NASA POWER daily AG, cached with the request | `docs/DATA-PROVENANCE.md`, `docs/SOURCES.md` S02–S04 |
| ET₀ follows FAO-56 Penman–Monteith from the listed inputs | `tests/climate.test.mjs` Example 18 (3.88 ± 0.05 mm/day) |
| Salinity thresholds/slopes come from FAO Annex 1 Table A1.1 | `docs/VERIFICATION.md` (26 claims re-checked) |
| The search runs 900 rollouts and reports unique rotations evaluated | `docs/BENCHMARK.md`, `tests/search-honesty.test.mjs` |
| Invalid numeric input stops the search and names the field | `tests/numeric-input.test.mjs`, `tests/search-honesty.test.mjs` |
