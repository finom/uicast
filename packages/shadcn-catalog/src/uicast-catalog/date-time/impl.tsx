import { useEffect, useReducer } from "react";
import { createComponentImplementation } from "@uicast/react";
import { DateTimeDef } from "./def";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// "YYYY-MM-DD": the def admits no other string this short.
const ISO_DATE_LENGTH = 10;

type Preset = "date" | "time" | "datetime";

const PRESETS: Record<Preset, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "medium" },
  time: { timeStyle: "short" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
};

const TITLE: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "short" };
const DAY_TITLE: Intl.DateTimeFormatOptions = { dateStyle: "full", timeZone: "UTC" };

// Each unit, and how many of it make the next.
const UNITS: { unit: Intl.RelativeTimeFormatUnit; next: number }[] = [
  { unit: "second", next: 60 },
  { unit: "minute", next: 60 },
  { unit: "hour", next: 24 },
  { unit: "day", next: 7 },
  { unit: "week", next: 4.34524 },
  { unit: "month", next: 12 },
  { unit: "year", next: Number.POSITIVE_INFINITY },
];
const SECOND = 0;
const DAY = UNITS.findIndex(({ unit }) => unit === "day");

// `amount` counts UNITS[from]; it climbs to the largest unit it fills.
function relativeText(amount: number, from: number): string {
  let i = from;
  let value = amount;
  while (Math.abs(value) >= UNITS[i].next) {
    value /= UNITS[i].next;
    i++;
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(value), UNITS[i].unit);
}

// A date alone is a calendar day, counted from the viewer's today.
function daysFromToday(ms: number): number {
  const now = new Date();
  return (ms - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / DAY_MS;
}

// The text can change each second under a minute away, each minute under an hour, else each hour.
function tickMs(ms: number): number {
  const distance = Math.abs(ms - Date.now());
  if (distance < MINUTE_MS) return SECOND_MS;
  if (distance < HOUR_MS) return MINUTE_MS;
  return HOUR_MS;
}

function formatText(ms: number, isDay: boolean, format: Preset | "relative" | Intl.DateTimeFormatOptions): string {
  if (format === "relative") return isDay ? relativeText(daysFromToday(ms), DAY) : relativeText((ms - Date.now()) / SECOND_MS, SECOND);
  const options = typeof format === "string" ? PRESETS[format] : format;
  // A day is shown in UTC, where it was parsed, so no time zone moves it; a written time zone wins.
  return new Intl.DateTimeFormat(undefined, isDay ? { timeZone: "UTC", ...options } : options).format(ms);
}

export const DateTimeImpl = createComponentImplementation({
  def: DateTimeDef,
  render: ({ value, format, prefix }, { entry }) => {
    const day = typeof value === "string" && value.length === ISO_DATE_LENGTH ? value : null;
    const ms = typeof value === "number" ? value : Date.parse(value);
    const [, tick] = useReducer((n: number) => n + 1, 0);
    const delay = day === null ? tickMs(ms) : HOUR_MS;
    // No dependencies: each render schedules the next, at the delay its own distance allows.
    useEffect(() => {
      const timer = format === "relative" ? setTimeout(tick, delay) : undefined;
      return () => clearTimeout(timer);
    });

    return (
      <time
        dateTime={day ?? new Date(ms).toISOString()}
        title={new Intl.DateTimeFormat(undefined, day === null ? TITLE : DAY_TITLE).format(ms)}
        data-key={entry.key}
      >
        {prefix && `${prefix} `}
        {formatText(ms, day !== null, format)}
      </time>
    );
  },
});
