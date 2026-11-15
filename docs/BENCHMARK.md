# Optimizer benchmark — 15 November 2026

This is the single reproducibility record required by the search-integrity
review. It measures **what the engine executes**, not the size of the search
space.

## Command

```bash
npm run benchmark:optimizer
```

The script (`scripts/benchmark-optimizer.mjs`) calls
`server/ai/optimizer.mjs`, which shares the same MCTS contract and 900-rollout
budget as `src/engine/optimizer.ts` (the browser worker imports that module
directly).

## Fixture

| Item | Value |
| --- | --- |
| Field | Delta Research Field (benchmark fixture), 6 seasons |
| Soil lab | ECe 4.2 dS/m, pH 8.1, SOC 1.1 % |
| Water | full irrigation, quota 5800, ECw 1.4 dS/m |
| Weights | yield 3, water 3, soil 3, risk 3 |
| Simulation budget | 900 rollouts |

## Machine

| Item | Value |
| --- | --- |
| Platform | win32 10.0.26200, x64 |
| CPU | 12th Gen Intel Core i5-12450HX (12 logical CPUs) |
| Memory | 15.7 GiB |
| Runtime | Node v25.6.0 |
| Measured (UTC) | 2026-11-15T04:32:29Z |

## Measured result (5 runs)

| Run | Simulations executed | Candidates generated | Unique rotations evaluated | Duplicates skipped | Engine elapsed (ms) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 900 | 900 | 161 | 739 | 19.59 |
| 2 | 900 | 900 | 161 | 739 | 11.79 |
| 3 | 900 | 900 | 161 | 739 | 13.04 |
| 4 | 900 | 900 | 161 | 739 | 8.07 |
| 5 | 900 | 900 | 161 | 739 | 7.04 |

- Median wall time: **11.82 ms** (min 7.05 ms, max 20.07 ms).
- The theoretical ordered 6-season space is computed from the candidate pools
  and labelled as theoretical. It is an upper bound on the space, **not** the
  number of paths explored.
- The engine evaluated **161 unique rotations** in this run and skipped 739
  duplicate rollouts. Both numbers are reported by every result's `search`
  block and shown in the UI.

## Limits

- One machine, one fixture, warm in-process runs. JIT warm-up makes run 1
  slower than later runs; do not quote the minimum as a guarantee.
- The browser worker adds model loading and message-passing overhead that this
  Node benchmark does not include.
- No result here proves global optimality. The four pathways are the best
  alternatives found for each objective **among the 161 evaluated rotations**.
