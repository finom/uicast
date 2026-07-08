import { createComponentImplementation } from "@ui-fired/react";
import { RelativeTimeDef } from "./def";

// Largest-fitting unit, then the platform's locale-aware formatter.
// `numeric: "auto"` yields phrasings like "yesterday", and both past and
// future dates ("in 2 days") come out with correct pluralization — no
// hand-rolled unit math.
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

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
  render: ({ date, prefix, generatedKey }) => {
    const dateObj = new Date(date);

    return (
      <time
        dateTime={dateObj.toISOString()}
        title={dateObj.toLocaleString()}
        className="text-sm text-muted-foreground"
        data-key={generatedKey}
      >
        {prefix && `${prefix} `}
        {formatRelativeTime(dateObj)}
      </time>
    );
  },
});
