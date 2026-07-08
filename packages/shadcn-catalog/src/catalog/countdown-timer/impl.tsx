import { createComponentImplementation } from "@ui-fired/react";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { CountdownTimerDef } from "./def";

function calculateTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export const CountdownTimerImpl = createComponentImplementation({
  def: CountdownTimerDef,
  render: ({
    targetDate,
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    size = "default",
    onComplete,
    generatedKey,
  }) => {
    const target = new Date(targetDate);
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(target));

    // biome-ignore lint/correctness/useExhaustiveDependencies: the interval re-arms only when targetDate changes; target/onComplete are read from the arming render on purpose
    useEffect(() => {
      const interval = setInterval(() => {
        const updated = calculateTimeLeft(target);
        setTimeLeft(updated);
        if (updated.expired) {
          clearInterval(interval);
          onComplete?.({});
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [targetDate]);

    const sizeClasses = {
      sm: { num: "text-lg font-semibold", label: "text-[10px]" },
      default: { num: "text-2xl font-bold", label: "text-xs" },
      lg: { num: "text-4xl font-bold", label: "text-sm" },
    };

    const s = sizeClasses[size];

    const segments = [
      { value: timeLeft.days, label: "Days", show: showDays },
      { value: timeLeft.hours, label: "Hours", show: showHours },
      { value: timeLeft.minutes, label: "Min", show: showMinutes },
      { value: timeLeft.seconds, label: "Sec", show: showSeconds },
    ].filter((seg) => seg.show);

    return (
      <div className="inline-flex items-center gap-3" data-key={generatedKey}>
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className={cn(s.num, "tabular-nums")}>
                {String(seg.value).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  s.label,
                  "text-muted-foreground uppercase tracking-wide",
                )}
              >
                {seg.label}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span className={cn(s.num, "text-muted-foreground")}>:</span>
            )}
          </div>
        ))}
      </div>
    );
  },
});
