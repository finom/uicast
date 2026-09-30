import { createComponentImplementation } from "@uicast/react";
import { Calendar as ShadcnCalendar } from "../../components/ui/calendar";
import { blockSkeleton } from "../../lib/skeletons";
import { CalendarDef } from "./def";

// `new Date("YYYY-MM-DD")` parses as UTC midnight, the previous day in negative-offset timezones.
const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const pad = (n: number) => String(n).padStart(2, "0");

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const CalendarImpl = createComponentImplementation({
  def: CalendarDef,
  render: ({ selected, min, max, disabled, onSelect }, { entry }) => {
    // Opens on the selected month, else on the earliest selectable one.
    const month = selected ?? min;
    return (
      <div data-key={entry.key}>
        <ShadcnCalendar
          mode="single"
          selected={selected ? parseLocalDate(selected) : undefined}
          defaultMonth={month ? parseLocalDate(month) : undefined}
          onSelect={(date) => date && onSelect({ date: formatLocalDate(date) })}
          disabled={[
            disabled,
            ...(min ? [{ before: parseLocalDate(min) }] : []),
            ...(max ? [{ after: parseLocalDate(max) }] : []),
          ]}
          className="rounded-md border"
        />
      </div>
    );
  },
  skeleton: blockSkeleton(300),
});
