import { useEffect, useState } from "react";
import type { RouteKey } from "../app/router";
import { Glyph } from "../ui/icons";

type SceneKey = "field" | "soil" | "water" | "priorities" | "plan";

interface Scene {
  key: SceneKey;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}

const SCENES: Scene[] = [
  {
    key: "field",
    eyebrow: "Step 01 · Field",
    title: "Draw the field once. Every number traces back to it.",
    body: "Search a place or draw the boundary. The map shows NDVI only, so green means vegetation vigour — never moisture.",
    points: [
      "Area comes from your polygon or your lease",
      "Terrain stays explicit instead of guessed",
      "The location is yours, not a national average",
    ],
  },
  {
    key: "soil",
    eyebrow: "Step 02 · Soil",
    title: "Record what you can see. Leave the lab to the lab.",
    body: "A ribbon class stays a class. If you have not sampled ECe or pH, the record says so instead of filling the gap.",
    points: [
      "Observations never become invented percentages",
      "Missing values are shown as missing",
      "Lab values override observations when you add them",
    ],
  },
  {
    key: "water",
    eyebrow: "Step 03 · Water",
    title: "Rain is not irrigation.",
    body: "You state the supply, the delivery system and the source. ECw comes from your own sample; climate context comes from NASA POWER.",
    points: [
      "Full irrigation, deficit, supplementary or rain-fed",
      "Drip, sprinkler, surface, pivot or none",
      "Your water quality sits beside the crop threshold",
    ],
  },
  {
    key: "priorities",
    eyebrow: "Step 04 · Priorities",
    title: "Choose the lens the plan has to explain itself against.",
    body: "The plan is ordered by your priorities and your exclusions, not by a hidden score.",
    points: [
      "Yield, water, soil or risk can lead",
      "Crops you exclude stay excluded",
      "Every candidate prints the checks behind it",
    ],
  },
  {
    key: "plan",
    eyebrow: "Step 05 · Plan",
    title: "Six seasons, each with the checks it can and cannot make.",
    body: "Family breaks, salinity, season fit and your own rules are shown season by season — conflicts included.",
    points: [
      "Edit any season without rebuilding the rest",
      "Unassessed dimensions stay visible",
      "The board is yours to change",
    ],
  },
];

function Preview({ scene }: { scene: SceneKey }) {
  if (scene === "field") {
    return (
      <div className="preview-stage">
        <div className="preview-map">
          <div className="preview-map__tiles" />
          <div className="preview-map__outline" />
          <span className="preview-map__tag">NDVI · vegetation only</span>
          <span className="preview-map__area">4.4 ha · 5 corners</span>
        </div>
        <div className="preview-kv">
          <span>Place</span>
          <strong>Your Field (Draw or Search on Map)</strong>
        </div>
        <div className="preview-kv">
          <span>Terrain</span>
          <strong>Level · DEM elevation, not a survey</strong>
        </div>
      </div>
    );
  }

  if (scene === "soil") {
    return (
      <div className="preview-stage">
        <span className="preview-label">Texture by hand</span>
        <div className="preview-chiprow">
          <span className="preview-chip">Sandy</span>
          <span className="preview-chip">Loam</span>
          <span className="preview-chip is-on">Clay</span>
          <span className="preview-chip">Not checked</span>
        </div>
        <div className="preview-kv">
          <span>ECe</span>
          <strong className="is-missing">not sampled</strong>
        </div>
        <div className="preview-kv">
          <span>pH</span>
          <strong className="is-missing">not sampled</strong>
        </div>
        <p className="preview-note">Empty stays empty until a lab report arrives.</p>
      </div>
    );
  }

  if (scene === "water") {
    return (
      <div className="preview-stage">
        {[
          ["Supply", "Full irrigation"],
          ["System", "Drip"],
          ["Source", "River / canal"],
          ["ECw", "1.2 dS/m"],
        ].map(([label, value]) => (
          <div className="preview-kv" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
        <p className="preview-note">
          Climate context: NASA POWER. Water quality: your sample.
        </p>
      </div>
    );
  }

  if (scene === "priorities") {
    return (
      <div className="preview-stage">
        <div className="preview-presets">
          {[
            ["Balanced", "No single objective dominates"],
            ["Water first", "Lean toward lower demand"],
            ["Soil first", "Legumes and cover crops"],
            ["Risk first", "Protect the rotation break"],
          ].map(([title, note], index) => (
            <div className={`preview-preset${index === 2 ? " is-on" : ""}`} key={title}>
              <strong>{title}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
        <p className="preview-note">
          The plan prints the reasons; the priority only orders them.
        </p>
      </div>
    );
  }

  if (scene === "plan") {
    return (
      <div className="preview-stage">
        <div className="preview-seasons">
          {[
            ["S1", "Faba bean", "Fabaceae"],
            ["S2", "Wheat", "Poaceae"],
            ["S3", "Cowpea", "Fabaceae"],
            ["S4", "Maize", "Poaceae"],
            ["S5", "Mustard cover", "Brassicaceae"],
            ["S6", "Sorghum", "Poaceae"],
          ].map(([season, crop, family], index) => (
            <div className={`preview-season${index === 2 ? " is-on" : ""}`} key={season}>
              <span className="preview-season__num">{season}</span>
              <strong>{crop}</strong>
              <small>{family}</small>
            </div>
          ))}
        </div>
        <p className="preview-note">
          Family break · season fit · salinity where a threshold exists.
        </p>
      </div>
    );
  }

  return (
    <div className="preview-stage">
      <div className="preview-chat">
        <div className="preview-chat__q">What should I change in Season 3?</div>
        <div className="preview-chat__a">
          <strong>Try cowpea after the mustard cover.</strong>
          <p>
            It changes the family, fits the warm season and adds a legume. Keep the
            season open if you still need the cover residue.
          </p>
          <div className="preview-chat__chips">
            <span>Family break</span>
            <span>Season fit</span>
            <span>Legume</span>
          </div>
        </div>
      </div>
      <p className="preview-note">
        Plain advice. The full checks stay on the plan card.
      </p>
    </div>
  );
}

export function PreviewPlayer({
  navigate,
  onClose,
}: {
  navigate: (route: RouteKey) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(SCENES.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const start = () => {
    onClose();
    navigate("field");
  };

  return (
    <div className="preview-box" role="dialog" aria-modal="true" aria-label="AgroRotate preview">
      <div className="preview-box__card">
        <header className="preview-box__top">
          <div className="preview-box__brand">
            <span className="preview-box__mark">
              <Glyph name="sprout" size={16} />
            </span>
            <span>
              <strong>AgroRotate preview</strong>
              <small>Five steps, no live changes</small>
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close preview">
            <Glyph name="close" size={15} />
          </button>
        </header>

        <div className="preview-box__body">
          <div className="preview-box__copy">
            <span className="eyebrow">{scene.eyebrow}</span>
            <h2>{scene.title}</h2>
            <p>{scene.body}</p>
            <ul>
              {scene.points.map((point) => (
                <li key={point}>
                  <Glyph name="check" size={14} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="preview-box__preview">
            <Preview scene={scene.key} />
          </div>
        </div>

        <footer className="preview-box__foot">
          <div className="preview-box__dots" role="tablist" aria-label="Preview steps">
            {SCENES.map((item, dotIndex) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Step ${dotIndex + 1}: ${item.eyebrow}`}
                className={dotIndex === index ? "is-active" : ""}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
            <span className="preview-box__count mono">
              {index + 1} / {SCENES.length}
            </span>
          </div>
          <div className="preview-box__actions">
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={index === 0}
            >
              Back
            </button>
            {isLast ? (
              <button
                type="button"
                className="btn btn--small btn--primary"
                onClick={start}
                data-sound="whoosh"
              >
                Start with my field
                <Glyph name="arrow" size={13} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--small btn--primary"
                onClick={() => setIndex((current) => Math.min(SCENES.length - 1, current + 1))}
              >
                Next
                <Glyph name="arrow" size={13} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
