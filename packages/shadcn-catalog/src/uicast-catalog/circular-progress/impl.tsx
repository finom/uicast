import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { CircularProgressDef } from "./def";

// Written-out CSS variables: an SVG stroke cannot take a Tailwind class.
const STROKES = {
	default: "var(--color-primary)",
	success: "var(--color-chart-2, #22c55e)",
	warning: "var(--color-chart-4, #f59e0b)",
	error: "var(--color-destructive)",
} as const;

export const CircularProgressImpl = createComponentImplementation({
  def: CircularProgressDef,
  render: ({
    value,
    size,
    strokeWidth,
    color,
    showValue,
    label,
  }, { entry }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value, 0), 100);
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div
        className="inline-flex flex-col items-center gap-1"
        data-key={entry.key}
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={STROKES[color]}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 120 }} />,
});
