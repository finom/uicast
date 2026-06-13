import { createComponentImplementation } from "@ui-fired/react";
import { CircularProgressDef } from "./def";

export const CircularProgressImpl = createComponentImplementation({
  def: CircularProgressDef,
  render: ({
    value = 0,
    size = 80,
    strokeWidth = 8,
    color = "hsl(var(--primary))",
    showValue = true,
    label,
    generatedKey,
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value, 0), 100);
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div
        className="inline-flex flex-col items-center gap-1"
        data-key={generatedKey}
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
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
});
