import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { DatePickerDef } from "./def";

export const DatePickerRenderer = createAIComponentRenderer({
  def: DatePickerDef,
  renderer: ({ value, min, max, disabled = false, onChange, generatedKey }) => {
    return (
      <Input
        type="date"
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
