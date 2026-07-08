import { createComponentImplementation } from "@ui-fired/react";
import { Calendar as ShadcnCalendar } from "../../components/ui/calendar";
import { CalendarDef } from "./def";

// Date-only strings must round-trip through LOCAL dates: `new Date("YYYY-MM-DD")`
// parses as UTC midnight, which lands on the previous day in negative-offset
// timezones (and `toISOString()` has the mirror problem in positive offsets).
function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const CalendarImpl = createComponentImplementation({
  def: CalendarDef,
  render: ({ selected, disabled = false, onSelect, generatedKey }) => {
    const selectedDate = selected ? parseLocalDate(selected) : undefined;

    return (
      <div data-key={generatedKey}>
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect?.({
                date: formatLocalDate(date),
              });
            }
          }}
          disabled={disabled}
          className="rounded-md border"
        />
      </div>
    );
  },
});
