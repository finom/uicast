import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { TimePickerDef } from "./def";

export const TimePickerImpl = createComponentImplementation({
  def: TimePickerDef,
  render: ({ value, min, max, disabled = false, onChange, generatedKey }) => {
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
