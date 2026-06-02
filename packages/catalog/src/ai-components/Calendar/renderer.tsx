import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Calendar as ShadcnCalendar } from "ui-fired/catalog/components/ui/calendar";
import { CalendarDef } from "./def";

export const CalendarRenderer = createAIComponentRenderer({
  def: CalendarDef,
  renderer: ({ selected, disabled = false, onSelect, generatedKey }) => {
    const selectedDate = selected ? new Date(selected) : undefined;

    return (
      <div data-key={generatedKey}>
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect?.({
                date: date.toISOString().split("T")[0],
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
