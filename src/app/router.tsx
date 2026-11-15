import { useCallback, useEffect, useState } from "react";

export type RouteKey =
  | "landing"
  | "field"
  | "soil"
  | "water"
  | "priorities"
  | "plan"
  | "crops"
  | "evidence"
  | "method"
  | "sources";

const ROUTE_TO_HASH: Record<RouteKey, string> = {
  landing: "#/",
  field: "#/field",
  soil: "#/soil",
  water: "#/water",
  priorities: "#/priorities",
  plan: "#/plan",
  crops: "#/crops",
  evidence: "#/evidence",
  method: "#/method",
  sources: "#/sources",
};

const HASH_TO_ROUTE: Record<string, RouteKey> = Object.fromEntries(
  Object.entries(ROUTE_TO_HASH).map(([route, hash]) => [hash, route as RouteKey]),
);

export const SETUP_ROUTES: RouteKey[] = ["field", "soil", "water", "priorities"];

export const NAV_GROUPS: { label: string; routes: RouteKey[] }[] = [
  { label: "Plan", routes: ["plan"] },
  { label: "Reference", routes: ["crops", "evidence", "method"] },
];

export const PRIMARY_ROUTES: RouteKey[] = ["plan", "crops", "evidence", "sources", "method"];

export const ROUTE_LABELS: Record<RouteKey, string> = {
  landing: "Home",
  field: "Field & terrain",
  soil: "Soil",
  water: "Water & climate",
  priorities: "Priorities",
  plan: "Rotation plan",
  crops: "Crop library",
  evidence: "Evidence",
  method: "Method",
  sources: "Sources",
};

/** The highlight class applied to the card a "Verify" link points at. */
const FOCUS_FLASH = "is-focus-target";

/**
 * Hash format: `#/route?focus=element-id`.
 * The query is routing metadata, not part of the route key.
 */
function splitHash(hash: string): { path: string; focus: string | null } {
  const [path, query = ""] = (hash || "#/").split("?");
  const raw = new URLSearchParams(query).get("focus");
  return {
    path: path || "#/",
    focus: raw && /^[A-Za-z0-9_-]+$/.test(raw) ? raw : null,
  };
}

function readRoute(): RouteKey {
  const { path } = splitHash(window.location.hash || "#/");
  return HASH_TO_ROUTE[path] ?? "field";
}

/**
 * Scrolls to `focus`, then briefly outlines it. Pages are lazy-loaded, so the
 * target can arrive a few frames after the route changes; retry until it does.
 */
function scrollToFocus(focus: string, attempt = 0): void {
  const target = document.getElementById(focus);
  if (!target) {
    if (attempt < 40) {
      window.setTimeout(() => scrollToFocus(focus, attempt + 1), 100);
    }
    return;
  }
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.classList.add(FOCUS_FLASH);
  window.setTimeout(() => target.classList.remove(FOCUS_FLASH), 2600);
}

export function useRoute(): [RouteKey, (route: RouteKey) => void] {  const [route, setRoute] = useState<RouteKey>(readRoute);

  useEffect(() => {
    const onChange = () => {
      const { focus } = splitHash(window.location.hash || "#/");
      setRoute(readRoute());
      if (focus) {
        scrollToFocus(focus);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    };
    window.addEventListener("hashchange", onChange);
    // A shared or reloaded `#/route?focus=…` link must land on its proof too.
    const initial = splitHash(window.location.hash || "#/");
    if (initial.focus) window.setTimeout(() => scrollToFocus(initial.focus as string), 0);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((next: RouteKey) => {
    const hash = ROUTE_TO_HASH[next];
    if (window.location.hash === hash) {
      setRoute(next);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    window.location.hash = hash;
    setRoute(next);
  }, []);

  return [route, navigate];
}

/**
 * True while the current hash is a `?focus=` proof link. Setup pages use this
 * to render their content instead of bouncing a reader back to step one.
 */
export function useRouteFocus(): string | null {
  const [focus, setFocus] = useState<string | null>(
    () => splitHash(window.location.hash || "#/").focus,
  );

  useEffect(() => {
    const onChange = () => setFocus(splitHash(window.location.hash || "#/").focus);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return focus;
}

export function routeHref(route: RouteKey, focus?: string): string {
  const base = ROUTE_TO_HASH[route];
  return focus ? `${base}?focus=${encodeURIComponent(focus)}` : base;
}
