import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-fired/catalog/components/ui/select";
import { Label } from "@ui-fired/catalog/components/ui/label";
import { CronBuilderDef } from "./def";

function describeCron(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return "Invalid cron expression";
  const [min, hour, day, month, weekday] = parts;
  const segments: string[] = [];
  if (min === "*" && hour === "*") segments.push("Every minute");
  else if (min !== "*" && hour === "*")
    segments.push(`At minute ${min} of every hour`);
  else if (min !== "*" && hour !== "*")
    segments.push(`At ${hour}:${min.padStart(2, "0")}`);
  else if (min === "*" && hour !== "*")
    segments.push(`Every minute during hour ${hour}`);
  if (day !== "*") segments.push(`on day ${day} of the month`);
  if (month !== "*") segments.push(`in month ${month}`);
  if (weekday !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    segments.push(`on ${days[Number(weekday)] ?? weekday}`);
  }
  return segments.join(" ") || "Every minute";
}

export const CronBuilderRenderer = createAIComponentRenderer({
  def: CronBuilderDef,
  renderer: ({
    value = "* * * * *",
    showPreview = true,
    onChange,
    generatedKey,
  }) => {
    const parts = value.split(" ");
    const [minute, setMinute] = useState(parts[0] ?? "*");
    const [hour, setHour] = useState(parts[1] ?? "*");
    const [day, setDay] = useState(parts[2] ?? "*");
    const [month, setMonth] = useState(parts[3] ?? "*");
    const [weekday, setWeekday] = useState(parts[4] ?? "*");

    const cronStr = `${minute} ${hour} ${day} ${month} ${weekday}`;

    const update = (setter: (v: string) => void, v: string) => {
      setter(v);
      // Trigger onChange after state updates through a timeout
      setTimeout(() => {
        onChange?.({ value: cronStr });
      }, 0);
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
    const weekdayLabels: Record<string, string> = {
      "*": "Any",
      "0": "Sun",
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
    };

    return (
      <div className="space-y-4" data-key={generatedKey}>
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
            },
          ].map((field) => (
            <div key={field.label} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <Select
                value={field.value}
                onValueChange={(v) => update(field.setter, v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.opts.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {field.label === "Weekday"
                        ? (weekdayLabels[opt] ?? opt)
                        : opt === "*"
                          ? "Any"
                          : opt}
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
