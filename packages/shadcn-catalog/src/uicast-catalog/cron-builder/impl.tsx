import { createComponentImplementation } from "@uicast/react";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useMirror } from "../../lib/use-mirror";
import { CronBuilderDef } from "./def";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "*", then every number from `first` to `last`.
const choices = (first: number, last: number) => [
  "*",
  ...Array.from({ length: last - first + 1 }, (_, i) => String(first + i)),
];

const FIELDS = [
  { label: "Minute", choices: choices(0, 59) },
  { label: "Hour", choices: choices(0, 23) },
  { label: "Day", choices: choices(1, 31) },
  { label: "Month", choices: choices(1, 12) },
  { label: "Weekday", choices: choices(0, 6), names: WEEKDAYS },
];

function describeCron(cron: string): string {
  const [min, hour, day, month, weekday] = cron.split(" ");
  const segments: string[] = [];
  if (min === "*" && hour === "*") segments.push("Every minute");
  else if (hour === "*") segments.push(`At minute ${min} of every hour`);
  else if (min !== "*") segments.push(`At ${hour}:${min.padStart(2, "0")}`);
  else segments.push(`Every minute during hour ${hour}`);
  if (day !== "*") segments.push(`on day ${day} of the month`);
  if (month !== "*") segments.push(`in month ${month}`);
  if (weekday !== "*") segments.push(`on ${WEEKDAYS[Number(weekday)] ?? weekday}`);
  return segments.join(" ");
}

export const CronBuilderImpl = createComponentImplementation({
  def: CronBuilderDef,
  render: ({ value, showPreview, onChange }, { entry }) => {
    const [cron, setCron] = useMirror(value);
    const parts = cron.split(" ");
    const update = (index: number, part: string) => {
      const next = parts.map((current, i) => (i === index ? part : current)).join(" ");
      setCron(next);
      onChange({ value: next });
    };

    return (
      <div className="space-y-4" data-key={entry.key}>
        <div className="grid grid-cols-5 gap-3">
          {FIELDS.map((field, i) => (
            <div key={field.label} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <Select value={parts[i]} onValueChange={(part) => update(i, part)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.choices.map((choice) => (
                    <SelectItem key={choice} value={choice} className="text-xs">
                      {choice === "*" ? "Any" : (field.names?.[Number(choice)] ?? choice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="rounded-md border bg-muted px-3 py-2">
          <code className="text-sm font-mono">{cron}</code>
        </div>
        {showPreview && <p className="text-xs text-muted-foreground">{describeCron(cron)}</p>}
      </div>
    );
  },
});
