import { createComponentImplementation } from "@uicast/react";
import { useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { CronBuilderDef } from "./def";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeCron(cron: string): string {
  const [min, hour, day, month, weekday] = cron.split(" ");
  const segments: string[] = [];
  if (min === "*" && hour === "*") segments.push("Every minute");
  else if (min !== "*" && hour === "*")
    segments.push(`At minute ${min} of every hour`);
  else if (min !== "*" && hour !== "*")
    segments.push(`At ${hour}:${min.padStart(2, "0")}`);
  else segments.push(`Every minute during hour ${hour}`);
  if (day !== "*") segments.push(`on day ${day} of the month`);
  if (month !== "*") segments.push(`in month ${month}`);
  if (weekday !== "*") segments.push(`on ${WEEKDAYS[Number(weekday)] ?? weekday}`);
  return segments.join(" ");
}

export const CronBuilderImpl = createComponentImplementation({
  def: CronBuilderDef,
  render: ({
    value,
    showPreview,
    onChange,
  }, { entry }) => {
    // A document change to the prop resyncs the parts; local edits win in between.
    const parts = value.split(" ");
    const [minute, setMinute] = useState(parts[0]);
    const [hour, setHour] = useState(parts[1]);
    const [day, setDay] = useState(parts[2]);
    const [month, setMonth] = useState(parts[3]);
    const [weekday, setWeekday] = useState(parts[4]);
    const lastPropValue = useRef(value);
    if (lastPropValue.current !== value) {
      lastPropValue.current = value;
      setMinute(parts[0]);
      setHour(parts[1]);
      setDay(parts[2]);
      setMonth(parts[3]);
      setWeekday(parts[4]);
    }

    const cronStr = `${minute} ${hour} ${day} ${month} ${weekday}`;

    const update = (index: number, setter: (v: string) => void, v: string) => {
      setter(v);
      // From the just-computed next state: the render-scope values are still the previous ones.
      const next = [minute, hour, day, month, weekday];
      next[index] = v;
      onChange({ value: next.join(" ") });
    };

    const minuteOpts = [
      "*",
      ...Array.from({ length: 60 }, (_, i) => String(i)),
    ];
    const hourOpts = ["*", ...Array.from({ length: 24 }, (_, i) => String(i))];
    const dayOpts = [
      "*",
      ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
    ];
    const monthOpts = [
      "*",
      ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
    ];
    const weekdayOpts = ["*", "0", "1", "2", "3", "4", "5", "6"];

    return (
      <div className="space-y-4" data-key={entry.key}>
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: "Minute",
              value: minute,
              opts: minuteOpts,
              setter: setMinute,
            },
            { label: "Hour", value: hour, opts: hourOpts, setter: setHour },
            { label: "Day", value: day, opts: dayOpts, setter: setDay },
            { label: "Month", value: month, opts: monthOpts, setter: setMonth },
            {
              label: "Weekday",
              value: weekday,
              opts: weekdayOpts,
              setter: setWeekday,
              names: WEEKDAYS,
            },
          ].map((field, i) => (
            <div key={field.label} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <Select
                value={field.value}
                onValueChange={(v) => update(i, field.setter, v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.opts.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt === "*" ? "Any" : field.names?.[Number(opt)] ?? opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="rounded-md border bg-muted px-3 py-2">
          <code className="text-sm font-mono">{cronStr}</code>
        </div>
        {showPreview && (
          <p className="text-xs text-muted-foreground">
            {describeCron(cronStr)}
          </p>
        )}
      </div>
    );
  },
});
