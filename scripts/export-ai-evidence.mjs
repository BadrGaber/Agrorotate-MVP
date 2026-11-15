#!/usr/bin/env node
/**
 * The evidence ledger is authored as a TypeScript module for the UI. The local
 * Node API cannot import it directly (extensionless type imports), so this
 * script extracts the three JSON-shaped arrays once and writes a runtime copy.
 *
 * Run after regenerating src/data/evidence/generated.ts:
 *   npm run export:ai
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "src", "data", "evidence", "generated.ts");
const outDir = path.join(root, "server", "ai");
const outPath = path.join(outDir, "evidence.json");

function matchingBracket(source, openIndex) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escape) escape = false;
      else if (char === "\\") escape = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Unclosed array in generated.ts");
}

function extractArray(source, exportName) {
  const marker = `export const ${exportName}:`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not find ${exportName}`);
  // Skip the TypeScript type annotation, which can itself contain `[]`.
  const equals = source.indexOf("=", start);
  const open = source.indexOf("[", equals);
  const close = matchingBracket(source, open);
  return JSON.parse(source.slice(open, close + 1));
}

const source = await fs.readFile(sourcePath, "utf8");
const payload = {
  schemaVersion: "agrorotate.evidence-runtime/1",
  generatedAtIso: new Date().toISOString(),
  source: "src/data/evidence/generated.ts",
  claims: extractArray(source, "EVIDENCE_CLAIMS"),
  inputs: extractArray(source, "EVIDENCE_INPUTS"),
  sources: extractArray(source, "EVIDENCE_SOURCES"),
};

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outPath, JSON.stringify(payload), "utf8");
console.log(
  `wrote ${outPath} (${payload.claims.length} claims, ${payload.inputs.length} input rules, ${payload.sources.length} sources)`,
);
