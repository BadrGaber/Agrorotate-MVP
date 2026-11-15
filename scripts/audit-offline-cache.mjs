#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "dist", "precache-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("dist/precache-manifest.json not found. Run `npm run build` first.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const size = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const groups = manifest.groups ?? {};
const sum = (files = []) => {
  const names = new Set(files);
  return manifest.files
    .filter((file) => names.has(file))
    .reduce((total, file) => {
      const absolute = path.join(process.cwd(), "dist", file.replace(/^\//, ""));
      return total + (fs.existsSync(absolute) ? fs.statSync(absolute).size : 0);
    }, 0);
};

console.log(`Offline manifest: ${manifest.version}`);
console.log(`Generated:        ${manifest.generatedAtIso}`);
console.log(`Files:            ${manifest.files.length}`);
console.log(`Total payload:    ${size(sum(manifest.files))}`);
console.log("");
for (const [name, files] of Object.entries(groups)) {
  console.log(`${name.padEnd(8)} ${String(files.length).padStart(3)} files  ${size(sum(files))}`);
}
