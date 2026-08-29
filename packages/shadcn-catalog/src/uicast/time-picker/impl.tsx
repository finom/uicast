import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { TimePickerDef } from "./def";

export const TimePickerImpl = createComponentImplementation({
  def: TimePickerDef,
  render: ({ value, min, max, disabled, onChange, generatedKey }) => {
    return (
      <Input
        type="time"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange({ value: e.target.value })}
        data-key={generatedKey}
      />
    );
  },
});
