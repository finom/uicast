import { createAIComponentRenderer } from "@ui-fired/react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { TimePickerDef } from "./def";

export const TimePickerRenderer = createAIComponentRenderer({
  def: TimePickerDef,
  renderer: ({ value, min, max, disabled = false, onChange, generatedKey }) => {
    return (
      <Input
        type="time"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange?.({ value: e.target.value })}
        data-key={generatedKey}
      />
    );
  },
});
