// Landing imagery lives in public/hero so it is fetched and cached as assets
// rather than being inlined into the JavaScript bundle.
function resolvePublicAsset(path: string): string {
  const base = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : "./"
  ).replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `${base}/${clean}`;
}

export const HERO_SLIDE_1_URI = resolvePublicAsset("hero/hero-1.jpg");
export const HERO_SLIDE_2_URI = resolvePublicAsset("hero/hero-2.jpg");
export const HERO_SLIDE_3_URI = resolvePublicAsset("hero/hero-3.jpg");
