import React, { useMemo } from "react";
import { validateSingleField } from "../engine/validation";
import { Glyph } from "../ui/icons";










export function SmartInput({
  fieldKey,
  label,
  unit,
  placeholder = "—",
  value,
  dataLabel,
  proof,
  hint,
  gate,
  fallback,
  onValue,
}: {
  fieldKey: string;
  label: React.ReactNode;
  unit: string;
  placeholder?: string;
  value: string;
  dataLabel?: string;
  proof?: React.ReactNode;
  hint?: string;
  gate?: string;

  fallback?: string;
  onValue: (value: string) => void;
}) {
  const validationIssue = useMemo(
    () => validateSingleField(fieldKey, value),
    [fieldKey, value],
  );
  const hasValue = value.trim() !== "";

  const badge = hasValue
    ? { text: "MEAS", className: "badge--meas" }
    : fallback
      ? { text: "EST", className: "badge--est" }
      : { text: "No value", className: "badge--none" };

  return (
    <div className="smart-field" data-gate={gate}>
      <div className="row row--between" style={{ alignItems: "baseline", marginBottom: 6 }}>
        <span className="label" style={{ margin: 0, fontWeight: 600 }}>
          {label}
          {proof}
        </span>
        <span className={`badge badge--soft ${badge.className}`}>{badge.text}</span>
      </div>

      <div className="input-group">
        <input
          className={`input ${validationIssue ? "input--error" : ""}`}
          data-gate={gate}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValue(event.target.value)}
        />
        <span className="input-group__suffix">{unit}</span>
      </div>

      {hint && <span className="hint">{hint}</span>}

      {validationIssue && (
        <div
          className="note note--danger"
          style={{ marginTop: 6, padding: "6px 10px", fontSize: "0.82rem" }}
        >
          <Glyph name="alert" size={14} className="note__icon" />
          <div>
            <strong>{validationIssue.title}:</strong> {validationIssue.message}
          </div>
        </div>
      )}

      {hasValue ? (
        <span className="hint">
          Typed value — treated as a measurement and overrides the estimate shown above.
        </span>
      ) : fallback ? (
        <div className="estimate-card" style={{ marginTop: 6, padding: "6px 10px" }}>
          <span className="small">
            If left blank: <strong>{fallback}</strong>
          </span>
        </div>
      ) : null}

      {dataLabel && (
        <div className="small" style={{ color: "var(--ink-faint)", marginTop: 6, fontSize: "0.78rem" }}>
          Data label: {dataLabel}
        </div>
      )}
    </div>
  );
}
