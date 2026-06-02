import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { DateRangePickerDef } from "./def";

export const DateRangePickerRenderer = createAIComponentRenderer({
  def: DateRangePickerDef,
  renderer: ({
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
