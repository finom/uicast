import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { DateRangePickerDef } from "./def";

export const DateRangePickerImpl = createComponentImplementation({
  def: DateRangePickerDef,
  render: ({
    startDate,
    endDate,
    min,
    max,
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <div className="flex items-center gap-2" data-key={generatedKey}>
        <Input
          type="date"
          value={startDate ?? ""}
          min={min}
          max={endDate || max}
          disabled={disabled}
          onChange={(e) =>
            onChange?.({
              startDate: e.target.value,
              endDate: endDate ?? "",
            })
          }
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate ?? ""}
          min={startDate || min}
          max={max}
          disabled={disabled}
          onChange={(e) =>
            onChange?.({
              startDate: startDate ?? "",
              endDate: e.target.value,
            })
          }
        />
      </div>
    );
  },
});
