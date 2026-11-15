import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";



const rawTarget = process.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const proxyTarget = rawTarget.replace(/\/api\/v1\/?$/, "");

function walkFiles(dir: string, prefix = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walkFiles(path.join(dir, entry.name), rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}








function offlinePrecache(): Plugin {
  let root = process.cwd();
  let outDir = "dist";
  return {
    name: "agrorotate-offline-precache",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      const emitted = Object.entries(bundle)
        .filter(([name]) => !name.endsWith(".map"))
        .map(([name, item]) => {
          const bytes =
            item.type === "asset"
              ? Buffer.byteLength(typeof item.source === "string" ? item.source : item.source)
              : Buffer.byteLength(item.code);
          return { name: `/${name.replace(/\\/g, "/")}`, bytes };
        });

      const publicDir = path.join(root, "public");
      const publicFiles = walkFiles(publicDir)
        .filter((name) => name !== "sw.js")
        .filter((name) => !name.endsWith(".map"))
        .filter((name) => !name.endsWith(".md"))
        .map((name) => {
          const absolute = path.join(publicDir, name);
          return { name: `/${name.replace(/\\/g, "/")}`, bytes: fs.statSync(absolute).size };
        });

      const seen = new Set<string>();
      const unique = [...emitted, ...publicFiles].filter((file) => {
        if (seen.has(file.name)) return false;
        seen.add(file.name);
        return true;
      });


      if (!seen.has("/index.html")) unique.push({ name: "/index.html", bytes: 0 });
      const totalBytes = unique.reduce((sum, file) => sum + file.bytes, 0);

      const manifest = {
        version: `agrorotate-${Date.now()}`,
        generatedAtIso: new Date().toISOString(),
        outDir: path.relative(root, outDir).replace(/\\/g, "/"),
        totalBytes,
        files: unique.map((file) => file.name).sort(),
        groups: {
          app: unique
            .filter((f) => f.name.startsWith("/assets/") || f.name === "/index.html")
            .map((f) => f.name),
          model: unique.filter((f) => f.name.startsWith("/models/")).map((f) => f.name),
          media: unique
            .filter((f) => f.name.startsWith("/hero/") || f.name.startsWith("/sounds/"))
            .map((f) => f.name),
        },
      };

      this.emitFile({
        type: "asset",
        fileName: "precache-manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), offlinePrecache()],
  server: {
    port: 5173,
    proxy: {
      "/api/v1": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
