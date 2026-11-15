export function SproutLoader({
  size = "sm",
  label = "Loading",
  className = "",
}: {
  size?: "xs" | "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`sprout-loader sprout-loader--${size} ${className}`.trim()}
      role="status"
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="sprout-loader__soil" d="M5 26.5h22" />
        <path className="sprout-loader__stem" d="M16 26.5V13" />
        <path className="sprout-loader__leaf sprout-loader__leaf--left" d="M16 18C10 18 7 15 7 10c6 0 9 3 9 8Z" />
        <path className="sprout-loader__leaf sprout-loader__leaf--right" d="M16 14c6 0 9-3 9-8-6 0-9 3-9 8Z" />
      </svg>
    </span>
  );
}
