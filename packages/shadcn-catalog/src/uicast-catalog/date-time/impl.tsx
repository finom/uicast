import { useEffect, useReducer } from "react";
import { createComponentImplementation } from "@uicast/react";
import { RelativeTimeDef } from "./def";

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;

// The text can change each second under a minute away, each minute under an hour, else each hour.
function tickMs(date: Date): number {
  const distance = Math.abs(date.getTime() - Date.now());
  if (distance < MINUTE_MS) return SECOND_MS;
  if (distance < HOUR_MS) return MINUTE_MS;
  return HOUR_MS;
}

function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return date.toLocaleDateString();
}

export const RelativeTimeImpl = createComponentImplementation({
  def: RelativeTimeDef,
  render: ({ date, prefix }, { entry }) => {
    const dateObj = new Date(date);
    const [, tick] = useReducer((n: number) => n + 1, 0);
    // No dependencies: each render schedules the next, at the delay its own distance allows.
    useEffect(() => {
      const timer = setTimeout(tick, tickMs(new Date(date)));
      return () => clearTimeout(timer);
    });

    return (
      <time
        dateTime={dateObj.toISOString()}
        title={dateObj.toLocaleString()}
        className="text-sm text-muted-foreground"
        data-key={entry.key}
      >
        {prefix && `${prefix} `}
        {formatRelativeTime(dateObj)}
      </time>
    );
  },
});
