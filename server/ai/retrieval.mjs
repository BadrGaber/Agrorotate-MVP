import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
let cached = null;

export async function loadEvidence() {
  if (cached) return cached;
  const raw = await fs.readFile(path.join(here, "evidence.json"), "utf8");
  const payload = JSON.parse(raw);
  cached = {
    ...payload,
    claims: payload.claims.map((claim, index) => ({
      ...claim,
      id: `E${String(index + 1).padStart(3, "0")}`,
    })),
  };
  return cached;
}

function tokens(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9%.+-]+/g, " ")
    .split(" ")
    .filter((token) => token.length >= 3);
}

function scoreClaim(claim, cropName, queryTokens, parameterHints) {
  let score = 0;
  if (cropName && claim.crop.toLowerCase() === cropName.toLowerCase())
    score += 8;
  else if (
    cropName &&
    claim.crop.toLowerCase().includes(cropName.toLowerCase())
  )
    score += 4;
  const haystack =
    `${claim.crop} ${claim.parameter} ${claim.value} ${claim.note}`.toLowerCase();
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 1.2;
  }
  for (const hint of parameterHints) {
    if (claim.parameter.toLowerCase().includes(hint)) score += 3;
  }
  if (claim.status === "SUPPORTED FOR SOURCE SCOPE") score += 1.5;
  if (claim.status?.includes("PENDING SOURCE SCOPE")) score -= 1;
  return score;
}

export async function retrieveEvidence({
  cropName = "",
  question = "",
  route = "",
  limit = 6,
} = {}) {
  const evidence = await loadEvidence();
  const parameterHints =
    route === "soil"
      ? ["salinity", "ph", "ece", "texture"]
      : route === "water"
        ? ["water", "salinity"]
        : route === "priorities"
          ? ["family", "season", "return"]
          : route === "plan"
            ? ["salinity", "family", "season"]
            : [];
  const queryTokens = tokens(
    `${question} ${route} ${parameterHints.join(" ")}`,
  );
  const ranked = evidence.claims
    .map((claim) => ({
      claim,
      score: scoreClaim(claim, cropName, queryTokens, parameterHints),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.claim);

  return {
    claims: ranked,
    counts: {
      claims: evidence.claims.length,
      supported: evidence.claims.filter(
        (claim) => claim.status === "SUPPORTED FOR SOURCE SCOPE",
      ).length,
      sources: evidence.sources.length,
    },
  };
}

export async function inputRulesForRoute(route) {
  const evidence = await loadEvidence();
  const mapping = {
    field: ["Field"],
    soil: ["Soil", "Salinity", "Texture"],
    water: ["Water", "Climate"],
    priorities: ["Priority", "Rotation"],
    plan: ["Rotation", "Salinity"],
  };
  const words = mapping[route] ?? [];
  return evidence.inputs.filter((input) =>
    words.some((word) =>
      `${input.name} ${input.correctLabel}`
        .toLowerCase()
        .includes(word.toLowerCase()),
    ),
  );
}
