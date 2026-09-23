import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { Calendar as ShadcnCalendar } from "../../components/ui/calendar";
import { CalendarDef } from "./def";

// `new Date("YYYY-MM-DD")` parses as UTC midnight, the previous day in negative-offset timezones.
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const CalendarImpl = createComponentImplementation({
  def: CalendarDef,
  render: ({ selected, disabled, onSelect }, { entry }) => {
    const selectedDate = selected ? parseLocalDate(selected) : undefined;

    return (
      <div data-key={entry.key}>
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect({
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
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
