import React from "react";





export type GlyphName =
  | "sprout"
  | "map"
  | "layers"
  | "drop"
  | "scales"
  | "calendar"
  | "book"
  | "flask"
  | "compass"
  | "sun"
  | "rain"
  | "alert"
  | "check"
  | "brain"
  | "database"
  | "lightbulb"
  | "refresh"
  | "target"
  | "arrow"
  | "download"
  | "close"
  | "info"
  | "wheat"
  | "help"
  | "cloud"
  | "pin"
  | "lock"
  | "sparkle"
  | "play"
  | "pen"
  | "rotate"
  | "volume"
  | "volumeOff";

const PATHS: Record<GlyphName, React.ReactNode> = {
  sprout: (
    <>
      <path d="M12 20.5v-7.2" />
      <path d="M12 13.6c-.2-3.2-2.4-5.3-5.6-5.5.1 3.1 2.2 5.2 5.6 5.5Z" />
      <path d="M12 15.1c.3-3.6 2.6-5.9 6.1-6.1-.2 3.5-2.5 5.7-6.1 6.1Z" />
    </>
  ),
  map: (
    <>
      <path d="M3.6 6.4 9 4.5l6 2 5.4-1.9v13l-5.4 1.9-6-2-5.4 1.9v-13Z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.7 8.2 4.1-8.2 4.2L3.8 7.8 12 3.7Z" />
      <path d="m4 12.1 8 4 8-4" />
      <path d="m4 16.3 8 4 8-4" />
    </>
  ),
  drop: (
    <>
      <path d="M12 3.6c3.2 3.9 5.4 6.6 5.4 9.5a5.4 5.4 0 0 1-10.8 0c0-2.9 2.2-5.6 5.4-9.5Z" />
      <path d="M9.6 13.4c0 1.5 1 2.5 2.3 2.7" />
    </>
  ),
  scales: (
    <>
      <path d="M12 4.2v15.6M6.4 19.8h11.2" />
      <path d="M4 8.2h16" />
      <path d="M4 8.2 1.9 13a2.4 2.4 0 0 0 4.3 0L4 8.2ZM20 8.2 17.9 13a2.4 2.4 0 0 0 4.3 0L20 8.2Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2" />
      <path d="M8 3.4v3.6M16 3.4v3.6M3.6 10.4h16.8" />
      <path d="M7.6 14h2.2M7.6 17.2h2.2M13.6 14h3" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.6h9.4a4.6 4.6 0 0 1 4.6 4.6v10.2H9.6A4.6 4.6 0 0 1 5 14.8V4.6Z" />
      <path d="M8.6 8.2h6M8.6 11.6h6M8.6 15h3.6" />
    </>
  ),
  flask: (
    <>
      <path d="M9.4 3.8h5.2M10.4 3.8v5.1L5.8 17a2.4 2.4 0 0 0 2.1 3.5h8.2a2.4 2.4 0 0 0 2.1-3.5l-4.6-8.1V3.8" />
      <path d="M7.6 14.6h8.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 5.4-5.4 2 2-5.4 5.4-2Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </>
  ),
  rain: (
    <>
      <path d="M7.4 15.4a3.9 3.9 0 0 1-.3-7.8 5.3 5.3 0 0 1 10.1-1.1 3.8 3.8 0 0 1 .9 7.5" />
      <path d="M8.4 19.2l-.9 2.2M12.4 19.2l-.9 2.2M16.4 19.2l-.9 2.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.9 21 19.8H3L12 3.9Z" />
      <path d="M12 9.6v4.4M12 16.7v.1" />
    </>
  ),
  check: <path d="m4.5 12.8 4.4 4.3L19.6 6.6" />,
  arrow: (
    <>
      <path d="M4 12h15.4" />
      <path d="m14.2 6.8 5.2 5.2-5.2 5.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.8v11.6" />
      <path d="m7.4 10.9 4.6 4.6 4.6-4.6" />
      <path d="M4.4 18.6h15.2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5.2M12 7.8v.1" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V9.4" />
      <path d="M12 12.4c-2.6-.4-4.2-1.9-4.4-4.6 2.7.2 4.3 1.8 4.4 4.6ZM12 12.4c2.6-.4 4.2-1.9 4.4-4.6-2.7.2-4.3 1.8-4.4 4.6Z" />
      <path d="M12 8.2c-2.2-.4-3.6-1.7-3.7-4 2.3.2 3.6 1.6 3.7 4ZM12 8.2c2.2-.4 3.6-1.7 3.7-4-2.3.2-3.6 1.6-3.7 4Z" />
      <path d="M12 17c-2.6-.4-4.2-1.9-4.4-4.6 2.7.2 4.3 1.8 4.4 4.6ZM12 17c2.6-.4 4.2-1.9 4.4-4.6-2.7.2-4.3 1.8-4.4 4.6Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2-2.5 3.6M12 17.3v.1" />
    </>
  ),
  cloud: (
    <path d="M7.2 18.2a4.2 4.2 0 0 1-.4-8.3 5.6 5.6 0 0 1 10.7-1.2 4 4 0 0 1 .7 7.9" />
  ),
  pin: (
    <>
      <path d="M12 21.4s6.4-5.6 6.4-10.6a6.4 6.4 0 1 0-12.8 0c0 5 6.4 10.6 6.4 10.6Z" />
      <circle cx="12" cy="10.6" r="2.3" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="10" rx="2.2" />
      <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.4l1.6 4.6L18.2 9.6l-4.6 1.6L12 15.8l-1.6-4.6L5.8 9.6l4.6-1.6L12 3.4Z" />
      <path d="M18.4 15.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m10.2 8.8 5.1 3.2-5.1 3.2V8.8Z" />
    </>
  ),
  pen: (
    <>
      <path d="M4.2 19.8 5.4 15l9.9-9.9a2.2 2.2 0 0 1 3.1 0l.5.5a2.2 2.2 0 0 1 0 3.1L9 18.6l-4.8 1.2Z" />
      <path d="m13.9 6.5 3.6 3.6" />
    </>
  ),
  rotate: (
    <>
      <path d="M20.2 11.2a8.2 8.2 0 1 0-1.7 5.4" />
      <path d="M20.4 4.8v6.4H14" />
    </>
  ),
  brain: <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-12S17.52 2 12 2z" />
    <path d="M8.95 6.05L5.35 8.65L6.69 10.5l1.5 1.5L2 17.99l5.66 1.48L15.16 5.35L12 8.57l-3.16 1.48z" />
    <path d="M19.12 17.75l1.45-1.45L18 6l-5.72 5.72L14.51 11H2v2h12.06l-1.36 7.77L19.12 17.75z" />
  </svg>,
  database: <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.1 2L2 7h3v9a5 5 0 1 0 10 0v-3.58l1.55 1.55L21.7 7h3l2-2h-5.9l-.96 9H5.97l-.59-1.81L3.16 15H5.9l-.95 1.51L2 19.96z" />
  </svg>,
  lightbulb: <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 7l10 5 10-5" />
    <path d="M2 7l4 15a1 1 0 0 0 1.7 1h13a1 1 0 0 0 1.7-1L2 7z" />
    <path d="M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  </svg>,
  refresh: <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 4v16M4.93 4.93L19.07 19.07" />
  </svg>,
  target: <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.58L12 20l-1.41-1.41L2 12l10-10z" />
  </svg>,
  volume: (
    <>
      <path d="M4.4 9.2h3.2L12 5.9v12.2l-4.4-3.3H4.4V9.2Z" />
      <path d="M15.2 8.8a4.8 4.8 0 0 1 0 6.4M17.8 6.2a8.4 8.4 0 0 1 0 11.6" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4.4 9.2h3.2L12 5.9v12.2l-4.4-3.3H4.4V9.2Z" />
      <path d="m15.4 9.5 5.2 5M20.6 9.5l-5.2 5" />
    </>
  ),
};

export function Glyph({
  name,
  size = 18,
  className,
  strokeWidth = 1.6,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}


export function ScribbleUnderline({ width = 132 }: { width?: number }) {
  return (
    <svg
      width={width}
      height="10"
      viewBox={`0 0 ${width} 10`}
      fill="none"
      aria-hidden="true"
      style={{ display: "block", marginTop: -2 }}
    >
      <path
        d={`M2 6.4C${width * 0.2} 2.6 ${width * 0.36} 8.6 ${width * 0.55} 5.2c${width * 0.16} -2.8 ${width * 0.24} 3 ${width * 0.42} 0.4`}
        stroke="#C08A2A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}





export const RAW_ICONS: Record<string, string> = {
  sprout:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGRlZnM+IDxsaW5lYXJHcmFkaWVudCBpZD0ibGVhZkwiIHgxPSIxMCIgeTE9IjE0IiB4Mj0iMzQiIHkyPSI0MiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPiA8c3RvcCBzdG9wLWNvbG9yPSIjNkVFN0I3Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDU5NjY5Ii8+IDwvbGluZWFyR3JhZGllbnQ+IDxsaW5lYXJHcmFkaWVudCBpZD0ibGVhZlIiIHgxPSIzMiIgeTE9IjgiIHgyPSI1NiIgeTI9IjM2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+IDxzdG9wIHN0b3AtY29sb3I9IiMzNEQzOTkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwNDc4NTciLz4gPC9saW5lYXJHcmFkaWVudD4gPC9kZWZzPiA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyOCIgZmlsbD0iIzEyMTQxQyIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuNCIvPiA8cGF0aCBkPSJNMzIgNTNWMjgiIHN0cm9rZT0iIzZFRTdCNyIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8cGF0aCBkPSJNMjQgNTRDMjcgNTEgMzcgNTEgNDAgNTQiIHN0cm9rZT0iI0E3RjNEMCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8cGF0aCBkPSJNMzIgMzZDMjAgMzYgMTIgMjYgMTQgMTVDMjUgMTQgMzIgMjMgMzIgMzZaIiBmaWxsPSJ1cmwoI2xlYWZMKSIgc3Ryb2tlPSIjQTdGM0QwIiBzdHJva2Utd2lkdGg9IjEuNSIvPiA8cGF0aCBkPSJNMjAgMjJMMjkgMzEiIHN0cm9rZT0iI0QxRkFFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8cGF0aCBkPSJNMzIgMzBDNDQgMzAgNTIgMjAgNTAgOUMzOSA4IDMyIDE3IDMyIDMwWiIgZmlsbD0idXJsKCNsZWFmUikiIHN0cm9rZT0iI0E3RjNEMCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPHBhdGggZD0iTTQ0IDE2TDM0IDI2IiBzdHJva2U9IiNEMUZBRTUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPGNpcmNsZSBjeD0iNDYiIGN5PSIxNCIgcj0iMyIgZmlsbD0iI0ZERTZIQSIvPiA8L3N2Zz4=",
  wheat:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGRlZnM+IDxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZEciIHgxPSIxNiIgeTE9IjEwIiB4Mj0iNDgiIHkyPSI1NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPiA8c3RvcCBzdG9wLWNvbG9yPSIjRkRFNjhBIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRDk3NzA2Ii8+IDwvbGluZWFyR3JhZGllbnQ+IDwvZGVmcz4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iI0ZCQkYyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQiLz4gPHBhdGggZD0iTTMyIDU0VjE0IiBzdHJva2U9IiNGQkJGMjQiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxlbGxpcHNlIGN4PSIyNSIgY3k9IjIyIiByeD0iNSIgcnk9IjgiIHRyYW5zZm9ybT0icm90YXRlKC0yOCAyNSAyMikiIGZpbGw9InVybCgjZ29sZEcpIi8+IDxlbGxpcHNlIGN4PSIzOSIgY3k9IjIyIiByeD0iNSIgcnk9IjgiIHRyYW5zZm9ybT0icm90YXRlKDI4IDM5IDIyKSIgZmlsbD0idXJsKCNnb2xkRykiLz4gPGVsbGlwc2UgY3g9IjI1IiBjeT0iMzMiIHJ4PSI1IiByeT0iOCIgdHJhbnNmb3JtPSJyb3RhdGUoLTI4IDI1IDMzKSIgZmlsbD0idXJsKCNnb2xkRykiLz4gPGVsbGlwc2UgY3g9IjM5IiBjeT0iMzMiIHJ4PSI1IiByeT0iOCIgdHJhbnNmb3JtPSJyb3RhdGUoMjggMzkgMzMpIiBmaWxsPSJ1cmwoI2dvbGRHKSIvPiA8ZWxsaXBzZSBjeD0iMjYiIGN5PSI0NCIgcng9IjQuNSIgcnk9IjciIHRyYW5zZm9ybT0icm90YXRlKC0yNSAyNiA0NCkiIGZpbGw9IiMzNEQzOTkiLz4gPGVsbGlwc2UgY3g9IjM4IiBjeT0iNDQiIHJ4PSI0LjUiIHJ5PSI3IiB0cmFuc2Zvcm09InJvdGF0ZSgyNSAzOCA0NCkiIGZpbGw9IiMzNEQzOTkiLz4gPGNpcmNsZSBjeD0iMzIiIGN5PSIxMyIgcj0iNCIgZmlsbD0iI0ZERTZIQSIvPiA8L3N2Zz4=",
  legume:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGRlZnM+IDxsaW5lYXJHcmFkaWVudCBpZD0icG9kRyIgeDE9IjE0IiB5MT0iMTQiIHgyPSI1MCIgeTI9IjUwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+IDxzdG9wIHN0b3AtY29sb3I9IiM4NkVGQUMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxMEI5ODEiLz4gPC9saW5lYXJHcmFkaWVudD4gPC9kZWZzPiA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyOCIgZmlsbD0iIzEyMTQxQyIgc3Ryb2tlPSIjNEFERUgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuNDUiLz4gPHBhdGggZD0iTTE4IDQ0QzE2IDI2IDI4IDE0IDQ4IDE2QzQ2IDM2IDM0IDQ4IDE4IDQ0WiIgZmlsbD0idXJsKCNwb2RHKSIgc3Ryb2tlPSIjRDFGQUU1IiBzdHJva2Utd2lkdGg9IjIiLz4gPGNpcmNsZSBjeD0iMjciIGN5PSIzNSIgcj0iNC41IiBmaWxsPSIjMDY0RTNCIiBzdHJva2U9IiNBN0YzRDAiIHN0cm9rZS13aWR0aD0iMS41Ii8+IDxjaXJjbGUgY3g9IjM1IiBjeT0iMjgiIHI9IjQuNSIgZmlsbD0iIzA2NEUzQiIgc3Ryb2tlPSIjQTdGM0QwIiBzdHJva2Utd2lkdGg9IjEuNSIvPiA8Y2lyY2xlIGN4PSI0MiIgY3k9IjIxIiByPSIzLjUiIGZpbGw9IiMwNjRFM0IiIHN0cm9rZT0iI0E3RjNEMCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPGNpcmNsZSBjeD0iMjAiIGN5PSI0OSIgcj0iMyIgZmlsbD0iIzM4QkRGOCIvPiA8Y2lyY2xlIGN4PSIzMCIgY3k9IjUxIiByPSIyLjUiIGZpbGw9IiMzOEJERjgiLz4gPC9zdmc+",
  water:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGRlZnM+IDxsaW5lYXJHcmFkaWVudCBpZD0iZHJvcEciIHgxPSIyMCIgeTE9IjEwIiB4Mj0iNDYiIHkyPSI1NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPiA8c3RvcCBzdG9wLWNvbG9yPSIjMzhCREY4Ii8+PHN0b3Agb2Zmc2V0PSIwLjYiIHN0b3AtY29sb3I9IiMwMjg0QzciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxMEI5ODEiLz4gPC9saW5lYXJHcmFkaWVudD4gPC9kZWZzPiA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyOCIgZmlsbD0iIzEyMTQxQyIgc3Ryb2tlPSIjMzhCREY4IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuNDUiLz4gPHBhdGggZD0iTTMyIDEwQzMyIDEwIDUwIDI5IDUwIDQxQzUwIDUwLjkgNDEuOSA1NiAzMiA1NkMyMi4xIDU2IDE0IDUwLjkgMTQgNDFDMTQgMjkgMzIgMTAgMzIgMTBaIiBmaWxsPSJ1cmwoI2Ryb3BHKSIgc3Ryb2tlPSIjQkFFNkZEIiBzdHJva2Utd2lkdGg9IjEuOCIvPiA8cGF0aCBkPSJNMzIgNDlWMjYiIHN0cm9rZT0iI0QxRkFFNSIgc3Ryb2tlLXdpZHRoPSIyLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8cGF0aCBkPSJNMzIgMzhMMjUgMzJNMzIgMzNMMzkgMjdNMzIgNDNMMzggMzgiIHN0cm9rZT0iI0E3RjNEMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPC9zdmc+",

  soil: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjYiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM0RDM5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxwYXRoIGQ9Ik0xOCAzOEg0Nk0yMiA0Nkg0MiIgc3Ryb2tlPSIjRkJCRjI0IiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxwYXRoIGQ9Ik0zMiAzOFYyMk0zMiAyOEMyNyAyOCAyNCAyMyAyNCAxOUMyOCAxOSAzMiAyMiAzMiAyOFpNMzIgMjVDMzcgMjUgNDAgMjAgNDAgMTZDMzYgMTYgMzIgMTkgMzIgMjVaIiBzdHJva2U9IiMzNEQzOTkiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4gPC9zdmc+",
  map: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM0RDM5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxwb2x5Z29uIHBvaW50cz0iMTgsMjAgNDYsMTYgNTAsNDQgMjIsNDgiIGZpbGw9IiMxMEI5ODEiIGZpbGwtb3BhY2l0eT0iMC4yMiIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWRhc2hhcnJheT0iNCAyIi8+IDxjaXJjbGUgY3g9IjE4IiBjeT0iMjAiIHI9IjQiIGZpbGw9IiMzOEJERjgiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPGNpcmNsZSBjeD0iNDYiIGN5PSIxNiIgcj0iNCIgZmlsbD0iIzM4QkRGOCIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjEuNSIvPiA8Y2lyY2xlIGN4PSI1MCIgY3k9IjQ0IiByPSI0IiBmaWxsPSIjMzhCREY4IiBzdHJva2U9IiNGRkYiIHN0cm9rZS13aWR0aD0iMS41Ii8+IDxjaXJjbGUgY3g9IjIyIiBjeT0iNDgiIHI9IjQiIGZpbGw9IiMzOEJERjgiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPHBhdGggZD0iTTM0IDM4VjI2TTM0IDMwQzI5IDI5IDI3IDI0IDMxIDIyQzM0IDIyIDM1IDI2IDM0IDMwWiIgc3Ryb2tlPSIjNkVFN0I3IiBzdHJva2Utd2lkdGg9IjIuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSIjMzREMzk5Ii8+IDwvc3ZnPg==",
  wind: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzJERDRCRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxwYXRoIGQ9Ik0xMiAyOEg0MkM0NiAyOCA0OSAyNSA0OSAyMUM0OSAxNyA0NiAxNCA0MiAxNEMzOC41IDE0IDM2IDE2LjUgMzUuNSAxOS41IiBzdHJva2U9IiMzOEJERjgiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxwYXRoIGQ9Ik0xMCAzNkg0OEM1MiAzNiA1NSAzOSA1NSA0M0M1NSA0NyA1MiA1MCA0OCA1MEM0NCA1MCA0MS41IDQ3IDQxIDQ0IiBzdHJva2U9IiMzNEQzOTkiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxwYXRoIGQ9Ik0xNiA0NEgzMiIgc3Ryb2tlPSIjQTdGM0QwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxwYXRoIGQ9Ik0yMiAyMUMyNiAxNSAzNCAxNSAzNiAyMUMzMSAyNCAyNSAyNCAyMiAyMVoiIGZpbGw9IiMzNEQzOTkiIHN0cm9rZT0iI0QxRkFFNSIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4gPC9zdmc+",
  sun: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iI0ZCQkYyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjEyIiBmaWxsPSIjRjU5RTBCIiBzdHJva2U9IiNGREU2OEEiIHN0cm9rZS13aWR0aD0iMiIvPiA8cGF0aCBkPSJNMzIgMTBWMTVNMzIgNDlWNTRNMTAgMzJIMTVNNDkgMzJINTRNMTYuNCAxNi40TDIwIDIwTTQ0IDQ0TDQ3LjYgNDcuNk00Ny42IDE2LjRMNDQgMjBNMjAgNDRMMTYuNCA0Ny42IiBzdHJva2U9IiNGQkJGMjQiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPHBhdGggZD0iTTI4IDM0QzMwIDI5IDM1IDI4IDM3IDMxQzM0IDM1IDMwIDM2IDI4IDM0WiIgZmlsbD0iI0ZFRjNDNyIvPiA8L3N2Zz4=",
  thermo:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM4QkRGOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxyZWN0IHg9IjIwIiB5PSIxMiIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI4IiByeD0iNSIgZmlsbD0iIzBGMTEzNCIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjIuMiIvPiA8Y2lyY2xlIGN4PSIyNSIgY3k9IjQ0IiByPSI4IiBmaWxsPSIjMTBCOTgxIiBzdHJva2U9IiNBN0YzRDAiIHN0cm9rZS13aWR0aD0iMiIvPiA8cmVjdCB4PSIyMy41IiB5PSIyMCIgd2lkdGg9IjMiIGhlaWdodD0iMjAiIHJ4PSIxLjUiIGZpbGw9IiMzNEQzOTkiLz4gPHBhdGggZD0iTTQzIDIwQzQzIDIwIDUxIDMwIDUxIDM3QzUxIDQxLjQgNDcuNCA0NSA0MyA0NUMzOC42IDQ1IDM1IDQxLjQgMzUgMzdDMzUgMzAgNDMgMjAgNDMgMjBaIiBmaWxsPSIjMzhCREY4IiBzdHJva2U9IiNCQUU2RkQiIHN0cm9rZS13aWR0aD0iMS41Ii8+IDwvc3ZnPg==",
  rain: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzYwQTVGQSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjQ1Ii8+IDxwYXRoIGQ9Ik0yMCAzNEg0NUM0OS40IDM0IDUzIDMwLjQgNTMgMjZDNTMgMjEuOCA0OS44IDE4LjQgNDUuNyAxOC4xQzQ0LjIgMTIuOSAzOS40IDkgMzMuOCA5QzI2LjggOSAyMS4yIDE0LjYgMjEuMiAyMS42QzE3LjIgMjIuMyAxNCAyNS44IDE0IDMwQzE0IDMyLjIgMTYuNSAzNCAyMCAzNFoiIGZpbGw9IiMzOEJERjgiIHN0cm9rZT0iI0UwRjJGRSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPHBhdGggZD0iTTIzIDQwTDIwIDQ4TTMyIDQwTDI5IDQ4TTQxIDQwTDM4IDQ4IiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxwYXRoIGQ9Ik0yNiA1M0MyOSA0OSAzNSA0OSAzOCA1MyIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8L3N2Zz4=",
  compass:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM0RDM5OSIgc3Ryb2tlLXdpZHRoPSIxLjgiLz4gPHBhdGggZD0iTTMyIDEwTDM3IDI3TDU0IDMyTDM3IDM3TDMyIDU0TDI3IDM3TDEwIDMyTDI3IDI3TDMyIDEwWiIgZmlsbD0iIzEwQjk4MSIgZmlsbC1vcGFjaXR5PSIwLjM1IiBzdHJva2U9IiM2RUU3QjciIHN0cm9rZS13aWR0aD0iMiIvPiA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSI2IiBmaWxsPSIjRkJCRjI0IiBzdHJva2U9IiNGRUYzQzciIHN0cm9rZS13aWR0aD0iMS41Ii8+IDwvc3ZnPg==",
  shield:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM0RDM5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPHBhdGggZD0iTTMyIDExTDQ5IDE4VjMxQzQ5IDQzIDQxLjUgNTAuNSAzMiA1NEMyMi41IDUwLjUgMTUgNDMgMTUgMzFWMThMMzIgMTFaIiBmaWxsPSIjMDU5NjY5IiBmaWxsLW9wYWNpdHk9IjAuNDUiIHN0cm9rZT0iIzZFRTdCNyIgc3Ryb2tlLXdpZHRoPSIyLjIiLz4gPHBhdGggZD0iTTI1IDMzTDMwIDM4TDQwIDI2IiBzdHJva2U9IiNBN0YzRDAiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4gPC9zdmc+",
  verdictOptimal:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjciIGZpbGw9IiMwNTk2NjkiIGZpbGwtb3BhY2l0eT0iMC4zIiBzdHJva2U9IiMzNEQzOTkiIHN0cm9rZS13aWR0aD0iMi41Ii8+IDxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjE5IiBmaWxsPSIjMTBCOTgxIi8+IDxwYXRoIGQ9Ik0yNCAzMi41TDI5LjUgMzhMNDEgMjYuNSIgc3Ryb2tlPSIjMDUyRTE2IiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPiA8L3N2Zz4=",
  verdictWarn:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjciIGZpbGw9IiNEOTc3MDYiIGZpbGwtb3BhY2l0eT0iMC4yOCIgc3Ryb2tlPSIjRkJCRjI0IiBzdHJva2Utd2lkdGg9IjIuNSIvPiA8cG9seWdvbiBwb2ludHM9IjMyLDEzIDUxLDQ3IDEzLDQ3IiBmaWxsPSIjRjU5RTBCIiBzdHJva2U9IiNGREU2OEEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPiA8cGF0aCBkPSJNMzIgMjVWMzUiIHN0cm9rZT0iIzQ1MUEwMyIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPGNpcmNsZSBjeD0iMzIiIGN5PSI0MS41IiByPSIyLjUiIGZpbGw9IiM0NTFBMDMiLz4gPC9zdmc+",
  verdictConflict:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjciIGZpbGw9IiM5OTFCMUIiIGZpbGwtb3BhY2l0eT0iMC4zMiIgc3Ryb2tlPSIjRjg3MTcxIiBzdHJva2Utd2lkdGg9IjIuNSIvPiA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxOSIgZmlsbD0iI0VGNDQ0NCIvPiA8cGF0aCBkPSJNMjUgMjVMMzkgMzlNMzkgMjVMMjUgMzkiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPC9zdmc+",
  save: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPHJlY3QgeD0iMTIiIHk9IjEyIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSIxMiIgZmlsbD0iIzEyMTQxQyIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjIuMiIvPiA8cGF0aCBkPSJNMzIgMjBDMzggMjAgNDIgMjYgNDAgMzRDMzcgNDEgMjcgNDEgMjQgMzRDMjIgMjYgMjYgMjAgMzIgMjBaIiBmaWxsPSIjMzREMzk5Ii8+IDxwYXRoIGQ9Ik0zMiAyNFY0NCIgc3Ryb2tlPSIjMDY0RTNCIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDwvc3ZnPg==",
  print:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPHJlY3QgeD0iMTQiIHk9IjEwIiB3aWR0aD0iMzYiIGhlaWdodD0iNDQiIHJ4PSI2IiBmaWxsPSIjMTIxNDFDIiBzdHJva2U9IiMzOEJERjgiIHN0cm9rZS13aWR0aD0iMi4yIi8+IDxwYXRoIGQ9Ik0yMiAyMkg0Mk0yMiAzMEg0Mk0yMiAzOEgzNCIgc3Ryb2tlPSIjQkFFNkZEIiBzdHJva2Utd2lkdGg9IjIuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+IDxjaXJjbGUgY3g9IjQxIiBjeT0iNDEiIHI9IjUiIGZpbGw9IiMzNEQzOTkiLz4gPC9zdmc+",
  reset:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4gPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjYiIGZpbGw9IiMxMjE0MUMiIHN0cm9rZT0iIzM0RDM5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz4gPHBhdGggZD0iTTE4IDMwQzE4IDIyLjMgMjQuMyAxNiAzMiAxNkMzNy44IDE2IDQyLjggMTkuNSA0NC45IDI0LjVNNDYgMzRDNDYgNDEuNyAzOS43IDQ4IDMyIDQ4QzI2LjIgNDggMjEuMiA0NC41IDE5LjEgMzkuNSIgc3Ryb2tlPSIjMzREMzk5IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8cG9seWxpbmUgcG9pbnRzPSI0NiwxNyA0NiwyNSAzOCwyNSIgc3Ryb2tlPSIjNkVFN0I3IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPiA8cG9seWxpbmUgcG9pbnRzPSIxOCw0NyAxOCwzOSAyNiwzOSIgc3Ryb2tlPSIjNkVFN0I3IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPiA8L3N2Zz4=",
};
export const BOTANICAL_ICONS_B64: Record<string, string> = {
  ...RAW_ICONS,
  soilLayers: RAW_ICONS.soil,
  waterDrop: RAW_ICONS.water,
  mapBoundary: RAW_ICONS.map,
  windLeaf: RAW_ICONS.wind,
  sunRays: RAW_ICONS.sun,
  optimal: RAW_ICONS.verdictOptimal,
  warning: RAW_ICONS.verdictWarn,
  conflict: RAW_ICONS.verdictConflict,
  saveSeed: RAW_ICONS.save,
  printScroll: RAW_ICONS.print,
  labFlask: RAW_ICONS.thermo,
  target: RAW_ICONS.compass,
  calendarLeaf: RAW_ICONS.rain,
  sparkleLeaf: RAW_ICONS.sprout,
  sunflower: RAW_ICONS.sun,
  shieldLeaf: RAW_ICONS.shield,
};
export function BotanicalArtIcon({
  name,
  size = 24,
  animation = "none",
  animate = undefined,
}: {
  name: string;
  size?: number;
  animation?: string;
  animate?: string;
}) {
  const src = BOTANICAL_ICONS_B64[name] || BOTANICAL_ICONS_B64.sprout;
  const mode = animate || animation || "none";
  const animClass =
    mode === "float"
      ? "botanical-icon-float"
      : mode === "pulse"
        ? "botanical-icon-pulse"
        : "";
  return  React.createElement("img", {
    src: src,
    alt: "",
    "aria-hidden": "true",
    width: size,
    height: size,
    className: `botanical-2d-art ${animClass}`,
    style: {
      width: `${size}px`,
      height: `${size}px`,
      objectFit: "contain",
      display: "inline-block",
      verticalAlign: "middle",
      flexShrink: 0,
    },
  });
}
export function SproutLogoIcon({ size = 24 }) {
  return  React.createElement(BotanicalArtIcon, {
    name: "sprout",
    size: size,
    animation: "float",
  });
}
