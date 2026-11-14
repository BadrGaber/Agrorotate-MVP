import React, { useEffect, useState } from "react";
import { Glyph } from "../ui/icons";
import { useWorkspace } from "../state/workspace";
import { checkBackend } from "../api/client";
import { setupCompleteness } from "../engine/agronomy";
import { SoundToggle } from "../ui/SoundToggle";
import {
  PRIMARY_ROUTES,
  ROUTE_LABELS,
  SETUP_ROUTES,
  routeHref,
  type RouteKey,
} from "./router";

// The five-step preview dialog lives at the app level (see App.tsx) so it can
// overlay the landing page too — the topbar button just asks App to open it.

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  return new Date(iso).toLocaleTimeString();
}

export function AppShell({
  route,
  navigate,
  children,
  onStartPreview,
}: {
  route: RouteKey;
  navigate: (route: RouteKey) => void;
  children: React.ReactNode;
  onStartPreview?: () => void;
}) {
  const { state, savedAtIso, dirty, resetWorkspace } = useWorkspace();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const inSetup = SETUP_ROUTES.includes(route);
  const completeness = setupCompleteness(state);
  const setupDone: Record<string, boolean> = {
    field: completeness.field,
    soil: completeness.soil,
    water: completeness.water,
    priorities: completeness.priorities,
  };
  const firstMissingSetup = SETUP_ROUTES.find((step) => !setupDone[step]);
  const planUnlocked =
    completeness.field &&
    completeness.soil &&
    completeness.water &&
    completeness.priorities;

  useEffect(() => {
    let cancelled = false;
    checkBackend().then((online) => {
      if (!cancelled) setApiOnline(online);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar no-print">
        <div className="topbar__inner">
          <a
            className="brand"
            href={routeHref("landing")}
            onClick={(event) => {
              event.preventDefault();
              navigate("landing");
            }}
          >
            <span className="brand__mark">
              <Glyph name="sprout" size={22} />
            </span>
            <span>
              <span className="brand__name">AgroRotate</span>
              <span className="brand__tag">Evidence-first rotations</span>
            </span>
          </a>

          <nav className="nav" aria-label="Main">
            <a
              className={`nav__link${inSetup ? " is-active" : ""}`}
              href={routeHref("field")}
              onClick={(event) => {
                event.preventDefault();
                navigate("field");
              }}
            >
              Setup
            </a>
            {PRIMARY_ROUTES.map((item) => {
              const locked = item === "plan" && !planUnlocked;
              return (
                <a
                  key={item}
                  className={`nav__link${item === route ? " is-active" : ""}${locked ? " is-locked" : ""}`}
                  href={locked ? undefined : routeHref(item)}
                  aria-current={item === route ? "page" : undefined}
                  aria-disabled={locked || undefined}
                  title={
                    locked
                      ? "Finish Field, Soil, Water and Priorities — the plan opens when setup is complete"
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (locked) {
                      // Same behaviour as a failed Continue: stay here and
                      // surface the entries the open setup step still needs.
                      if (firstMissingSetup) {
                        window.dispatchEvent(
                          new CustomEvent("agrorotate:gate-attempt", {
                            detail: { step: firstMissingSetup },
                          }),
                        );
                      }
                      return;
                    }
                    navigate(item);
                  }}
                >
                  {locked && <Glyph name="lock" size={10} strokeWidth={2.4} />}
                  {item === "plan"
                    ? "Plan"
                    : item === "crops"
                      ? "Crops"
                      : ROUTE_LABELS[item]}
                </a>
              );
            })}
          </nav>

          <div className="topbar__actions">
            <SoundToggle />
            <button
              type="button"
              className="btn btn--small btn--primary"
              onClick={onStartPreview}
              data-sound="whoosh"
              title="Open the five-step preview — sample screens, no live changes"
            >
              <Glyph name="sparkle" size={13} />
              Preview
            </button>
            <span
              className="badge badge--soft badge--none topbar__status"
              title={
                apiOnline === null
                  ? "Checking the local API"
                  : apiOnline
                    ? "Local API reachable — plans can sync and NASA data is cached server-side"
                    : "No local API — the app stores everything in this browser"
              }
            >
              <span
                className={`status-dot ${
                  apiOnline === null ? "" : apiOnline ? "is-online" : "is-local"
                }`}
              />
              {apiOnline === null
                ? "checking"
                : apiOnline
                  ? "API online"
                  : "browser mode"}
            </span>
            {(dirty || savedAtIso) && (
              <span
                className="badge badge--soft badge--none topbar__status"
                title="Autosaved in this browser"
              >
                <Glyph name={dirty ? "cloud" : "check"} size={12} />
                {dirty
                  ? "saving…"
                  : savedAtIso && `saved ${timeAgo(savedAtIso)}`}
              </span>
            )}
            <button
              type="button"
              className="icon-btn"
              title="Reset this browser workspace"
              aria-label="Reset workspace"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset the field, soil, water, priorities and plan in this browser? This cannot be undone.",
                  )
                ) {
                  resetWorkspace();
                  navigate("field");
                }
              }}
            >
              <Glyph name="rotate" size={15} />
            </button>
          </div>
        </div>
      </header>

      {children}

      <footer className="footer no-print">
        <div className="footer__inner">
          <div style={{ maxWidth: "56ch" }}>
            <div className="footer__brand">AgroRotate</div>A rotation advisor
            built on live NASA POWER data, FAO source tables and your own field
            record.
          </div>
          <div className="footer__links">
            <a href={routeHref("method")}>Method & limits</a>
            <a href={routeHref("evidence")}>Evidence package</a>
            <a href={routeHref("sources")}>Sources & APIs</a>
            <a href={routeHref("crops")}>Crop library</a>
          </div>
          <div className="footer__meta">
            NASA Space Apps Challenge 2026 · evidence build v5.1
          </div>
        </div>
      </footer>
    </div>
  );
}
