import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { TimePickerDef } from "./def";

export const TimePickerImpl = createComponentImplementation({
  def: TimePickerDef,
  render: ({ value, min, max, disabled, onChange }, { entry }) => {
    return (
      <Input
        type="time"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          // A cleared or partly typed time reads as "", which the payload schema refuses.
          if (e.target.value) onChange({ value: e.target.value });
        }}
        data-key={entry.key}
      />
    );
  },
});
