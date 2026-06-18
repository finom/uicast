import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { DatePickerDef } from "./def";

export const DatePickerImpl = createComponentImplementation({
  def: DatePickerDef,
  render: ({ value, min, max, disabled = false, onChange, generatedKey }) => {
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
