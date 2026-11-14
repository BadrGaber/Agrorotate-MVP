/**
 * Minimal .env reader for the local API.
 *
 * Node 18 does not load .env files on its own, and the project deliberately
 * keeps the server dependency-free. This parser supports the subset the
 * project documents: KEY=value, optional quotes, comments and an optional
 * `export` prefix. Existing process environment values always win.
 */
import fs from "node:fs";
import path from "node:path";

export function parseEnv(text) {
  const values = {};
  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (/^export\s+/i.test(line)) line = line.replace(/^export\s+/i, "").trim();
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[key] = value;
  }
  return values;
}

/**
 * Loads .env and .env.local from `cwd` without overriding variables that were
 * already set by the shell. Later files override earlier files.
 */
export function loadEnvFiles({ cwd = process.cwd(), files } = {}) {
  const candidates = files ?? [
    path.join(cwd, ".env"),
    path.join(cwd, ".env.local"),
  ];
  const existing = { ...process.env };
  const merged = {};
  const loadedFiles = [];

  for (const file of candidates) {
    try {
      Object.assign(merged, parseEnv(fs.readFileSync(file, "utf8")));
      loadedFiles.push(file);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        // A malformed or unreadable file must not stop the API. The caller can
        // still see the status through the EO endpoint.
      }
    }
  }

  for (const [key, value] of Object.entries(merged)) {
    if (existing[key] === undefined) process.env[key] = value;
  }
  return { keys: Object.keys(merged), files: loadedFiles };
}