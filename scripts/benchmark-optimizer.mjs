#!/usr/bin/env node
import os from "node:os";
import { optimizeWorkspace } from "../server/ai/optimizer.mjs";

const workspace = {
  field: {
    name: "Delta Research Field (benchmark fixture)",
    centroidLat: 31.1,
    centroidLon: 30.9,
    elevationM: 12,
    slopeClass: "flat",
  },
  soil: { lab: { eceDsm: "4.2", ph: "8.1", socPct: "1.1" } },
  water: { regime: "full_irrigation", quotaMm: "5800", ecwDsm: "1.4" },
  plan: { slots: [] },
  priorities: {
    previousCropId: "bread-wheat",
    weights: { yield: 3, water: 3, soil: 3, risk: 3 },
  },
};

const RUNS = 5;
const rows = [];
for (let i = 0; i < RUNS; i += 1) {
  const started = performance.now();
  const contract = optimizeWorkspace(workspace);
  const wallMs = performance.now() - started;
  if (contract.status !== "ok") {
    console.error(JSON.stringify(contract.inputIssues, null, 2));
    process.exit(1);
  }
  rows.push({
    run: i + 1,
    engineElapsedMs: contract.search.elapsedMs,
    wallMs: Number(wallMs.toFixed(2)),
    simulationsExecuted: contract.search.simulationsExecuted,
    candidatesGenerated: contract.search.candidatesGenerated,
    uniqueRotationsEvaluated: contract.search.uniqueRotationsEvaluated,
    duplicateRolloutsSkipped: contract.search.duplicateRolloutsSkipped,
    theoreticalSearchSpace: contract.search.theoreticalSearchSpace,
  });
}

const cpu = os.cpus()?.[0]?.model ?? "unknown CPU";
console.log(
  JSON.stringify(
    {
      measuredAtUtc: new Date().toISOString(),
      machine: {
        platform: `${os.platform()} ${os.release()}`,
        arch: os.arch(),
        cpu,
        cpuCount: os.cpus()?.length ?? null,
        totalMemoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
      },
      node: process.version,
      engine: "server/ai/optimizer.mjs (same MCTS contract as the browser worker)",
      budget: 900,
      fixture: {
        field: workspace.field.name,
        soilLab: workspace.soil.lab,
        water: workspace.water,
        weights: workspace.priorities.weights,
        seasonsSearched: 6,
      },
      runs: rows,
      summary: {
        medianWallMs: rows.map((r) => r.wallMs).sort((a, b) => a - b)[2],
        minWallMs: Math.min(...rows.map((r) => r.wallMs)),
        maxWallMs: Math.max(...rows.map((r) => r.wallMs)),
      },
      note: "One machine, one fixture. Not a guarantee of latency or optimality on other hardware or data.",
    },
    null,
    2,
  ),
);
