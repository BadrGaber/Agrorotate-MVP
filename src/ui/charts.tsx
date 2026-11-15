import type { ClimateSummary } from "../state/model";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];





export function MonthlyClimateChart({
  summary,
  height = 150,
}: {
  summary: ClimateSummary;
  height?: number;
}) {
  const monthly = summary.monthly ?? [];
  if (monthly.length === 0) {
    return (
      <div className="climate-chart__empty">
        This cached climate summary predates the seasonal chart. Refresh the field
        climate to compute monthly values from NASA POWER.
      </div>
    );
  }
  const width = 560;
  const pad = { top: 16, right: 10, bottom: 22, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxRain = Math.max(1, ...monthly.map((month) => month.rainMm));
  const maxEto = Math.max(1, ...monthly.map((month) => month.etoMm ?? 0));
  const barW = innerW / 12 - 5;
  const etoPoints = monthly
    .map((month, index) => {
      const x = pad.left + (innerW / 12) * index + (innerW / 24);
      const y = pad.top + innerH - ((month.etoMm ?? 0) / maxEto) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="climate-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Monthly rainfall bars and reference evapotranspiration line"
      >
        <defs>
          <linearGradient id="rain-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="eto-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f6c177" />
            <stop offset="100%" stopColor="#ff8a72" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH * ratio}
            y2={pad.top + innerH * ratio}
            stroke="rgba(214, 240, 222, 0.1)"
            strokeDasharray="3 5"
          />
        ))}
        {monthly.map((month, index) => {
          const barH = (month.rainMm / maxRain) * innerH;
          const x = pad.left + (innerW / 12) * index + 2.5;
          return (
            <g key={month.month}>
              <rect
                x={x}
                y={pad.top + innerH - barH}
                width={barW}
                height={barH}
                rx={3}
                fill="url(#rain-fill)"
              />
              <text
                x={x + barW / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(214, 240, 222, 0.55)"
                fontFamily="var(--font-mono)"
              >
                {MONTHS[index]}
              </text>
            </g>
          );
        })}
        <polyline
          points={etoPoints}
          fill="none"
          stroke="url(#eto-stroke)"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {monthly.map((month, index) => {
          const x = pad.left + (innerW / 12) * index + (innerW / 24);
          const y = pad.top + innerH - ((month.etoMm ?? 0) / maxEto) * innerH;
          return <circle key={month.month} cx={x} cy={y} r="2.2" fill="#f6c177" />;
        })}
      </svg>
      <div className="climate-chart__legend">
        <span>
          <i className="legend-swatch legend-swatch--rain" /> Rain (mm/month)
        </span>
        <span>
          <i className="legend-swatch legend-swatch--eto" /> Reference ETo
        </span>
      </div>
    </div>
  );
}

export function SeasonFingerprint({ summary }: { summary: ClimateSummary }) {
  const fallbackSeason = {
    tmaxC: summary.meanTmaxC,
    tminC: summary.meanTminC,
    rainMm: summary.annualPrecipMm,
    etoMm: summary.etoAnnualMm,
    days: summary.days,
  };
  const rows = [
    {
      label: "Summer · JJA",
      data: summary.summer ?? fallbackSeason,
      tone: "warm",
    },
    {
      label: "Winter · DJF",
      data: summary.winter ?? fallbackSeason,
      tone: "cool",
    },
  ];
  return (
    <div className="season-fingerprint">
      {rows.map((row) => (
        <div className={`season-row season-row--${row.tone}`} key={row.label}>
          <div className="season-row__label">{row.label}</div>
          <div className="season-row__stats">
            <span>
              <strong>{row.data.tmaxC.toFixed(1)}°</strong>
              <small>day max</small>
            </span>
            <span>
              <strong>{row.data.tminC.toFixed(1)}°</strong>
              <small>night min</small>
            </span>
            <span>
              <strong>{row.data.rainMm}</strong>
              <small>mm rain</small>
            </span>
            <span>
              <strong>{row.data.etoMm ?? "—"}</strong>
              <small>mm ETo</small>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
