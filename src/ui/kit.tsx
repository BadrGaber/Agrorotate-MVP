import React from "react";
import { Glyph, type GlyphName, ScribbleUnderline } from "./icons";

export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
  glyph,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  glyph?: GlyphName;
}) {
  return (
    <header className="page-head">
      <div className="page-head__text">
        <span className="eyebrow">
          {glyph && <Glyph name={glyph} size={15} />}
          {eyebrow}
        </span>
        <h1 className="display">{title}</h1>
        <ScribbleUnderline width={116} />
        {lede && <p className="lede" style={{ marginTop: 8 }}>{lede}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  hint,
  aside,
  glyph,
  children,
  flat,
  wash,
  style,
  id,
  className,
}: {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  aside?: React.ReactNode;
  glyph?: GlyphName;
  children: React.ReactNode;
  flat?: boolean;
  wash?: boolean;
  style?: React.CSSProperties;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`card${flat ? " card--flat" : ""}${wash ? " card--wash" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={style}
    >
      {(title || aside) && (
        <div className="card__head">
          <div className="card__head-main">
            {title && (
              <h2 className="card__title">
                {glyph && <Glyph name={glyph} size={17} />}
                <span>{title}</span>
              </h2>
            )}
            {hint && <p className="card__hint">{hint}</p>}
          </div>
          {aside && <div className="row card__aside">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Note({
  tone = "default",
  glyph = "info",
  children,
  style,
}: {
  tone?: "default" | "forest" | "clay" | "harvest" | "sky";
  glyph?: GlyphName;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const cls = tone === "default" ? "note" : `note note--${tone}`;
  return (
    <div className={cls} style={style}>
      <Glyph name={glyph} size={17} className="note__icon" />
      <div className="note__content">{children}</div>
    </div>
  );
}

export function Stamp({
  verdict,
  children,
}: {
  verdict: "open" | "caution" | "conflict";
  children: React.ReactNode;
}) {
  return <span className={`stamp stamp--${verdict}`}>{children}</span>;
}

export function Meter({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="meter" role="presentation">
      <div className="meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({
  title,
  children,
  glyph = "help",
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  glyph?: GlyphName;
}) {
  return (
    <div className="empty">
      <Glyph name={glyph} size={26} />
      <div className="empty__title">{title}</div>
      {children && <div className="small" style={{ maxWidth: "46ch" }}>{children}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  proof,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  proof?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {proof}
      </span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`seg__btn${option.value === value ? " is-active" : ""}`}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({
  value,
  label,
  foot,
  tone,
  action,
}: {
  value: React.ReactNode;
  label: string;
  foot?: React.ReactNode;
  tone?: "forest" | "harvest" | "clay";
  action?: React.ReactNode;
}) {
  const color =
    tone === "forest"
      ? "var(--forest)"
      : tone === "harvest"
        ? "var(--harvest)"
        : tone === "clay"
          ? "var(--clay)"
          : undefined;
  return (
    <div className="stat">
      <span className="stat__value" style={{ color }}>
        {value}
      </span>
      <span className="stat__label">{label}</span>
      {foot && <span className="stat__foot">{foot}</span>}
      {action && <span className="stat__action">{action}</span>}
    </div>
  );
}

export function Rail({
  steps,
  current,
  onNavigate,
}: {
  steps: { key: string; label: string; done: boolean }[];
  current: string;
  onNavigate: (key: string) => void;
}) {
  return (
    <nav className="rail" aria-label="Setup progress">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          {index > 0 && <span className="rail__sep" aria-hidden="true" />}
          <button
            type="button"
            className={`rail__step${step.key === current ? " is-active" : ""}${
              step.done && step.key !== current ? " is-done" : ""
            }`}
            aria-current={step.key === current ? "step" : undefined}
            onClick={() => onNavigate(step.key)}
          >
            <span className="rail__num">
              {step.done && step.key !== current ? "✓" : index + 1}
            </span>
            {step.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

export function KVRows({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <div>
      {rows.map(([k, v], i) => (
        <div className="kv" key={i}>
          <span className="kv__k">{k}</span>
          <span className="kv__v">{v}</span>
        </div>
      ))}
    </div>
  );
}
