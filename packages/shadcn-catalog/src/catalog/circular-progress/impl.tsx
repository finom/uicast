import { createComponentImplementation } from "@uicast/react";
import { CircularProgressDef } from "./def";

export const CircularProgressImpl = createComponentImplementation({
  def: CircularProgressDef,
  render: ({
    value = 0,
    size = 80,
    strokeWidth = 8,
    color = "var(--color-primary)",
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
