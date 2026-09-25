import { createComponentImplementation } from "@uicast/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { CountdownTimerDef } from "./def";

const SIZES = {
  sm: { number: "text-lg font-semibold", label: "text-xs" },
  default: { number: "text-2xl font-bold", label: "text-xs" },
  lg: { number: "text-4xl font-bold", label: "text-sm" },
};

function timeLeft(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
    hours: Math.floor((ms / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((ms / (1000 * 60)) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    expired: false,
  };
}

export const CountdownTimerImpl = createComponentImplementation({
  def: CountdownTimerDef,
  render: ({ targetDate, showDays, showHours, showMinutes, showSeconds, size, onComplete }, { entry }) => {
    const target = new Date(targetDate);
    const [left, setLeft] = useState(() => timeLeft(target));

    // biome-ignore lint/correctness/useExhaustiveDependencies: the interval re-arms only when targetDate changes; target/onComplete are read from the arming render on purpose
    useEffect(() => {
      const initial = timeLeft(target);
      if (initial.expired) {
        // Expired before arming: never fire onComplete.
        setLeft(initial);
        return;
      }
      const interval = setInterval(() => {
        const next = timeLeft(target);
        setLeft(next);
        if (next.expired) {
          clearInterval(interval);
          onComplete();
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [targetDate]);

    const { number, label } = SIZES[size];
    const segments = [
      { value: left.days, label: "Days", show: showDays },
      { value: left.hours, label: "Hours", show: showHours },
      { value: left.minutes, label: "Min", show: showMinutes },
      { value: left.seconds, label: "Sec", show: showSeconds },
    ].filter((segment) => segment.show);

    return (
      <div className="inline-flex items-center gap-3" data-key={entry.key}>
        {segments.map((segment, i) => (
          <div key={segment.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className={cn(number, "tabular-nums")}>{String(segment.value).padStart(2, "0")}</span>
              <span className={cn(label, "text-muted-foreground uppercase tracking-wide")}>{segment.label}</span>
            </div>
            {i < segments.length - 1 && <span className={cn(number, "text-muted-foreground")}>:</span>}
          </div>
        ))}
      </div>
    );
  },
});
