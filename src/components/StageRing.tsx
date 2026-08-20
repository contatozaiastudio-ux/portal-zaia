export function StageRing({
  value,
  total,
  color,
  trackColor = "#D7DEE1",
  size = 76,
  strokeWidth = 10,
  centerLabel,
  centerColor,
}: {
  value: number;
  total: number;
  color: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  const dash = circumference * ratio;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-display text-lg font-medium"
        style={{ color: centerColor ?? color }}
      >
        {centerLabel}
      </div>
    </div>
  );
}
