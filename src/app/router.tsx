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

function readRoute(): RouteKey {
  const hash = window.location.hash || "#/";
  return HASH_TO_ROUTE[hash] ?? "field";
}

export function useRoute(): [RouteKey, (route: RouteKey) => void] {
  const [route, setRoute] = useState<RouteKey>(readRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
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

export function routeHref(route: RouteKey): string {
  return ROUTE_TO_HASH[route];
}
