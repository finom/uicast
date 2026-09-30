import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input } from "../../components/ui/input";
import { FieldLabelId } from "../field/impl";
import { DatePickerDef } from "./def";

export const DatePickerImpl = createComponentImplementation({
  def: DatePickerDef,
  render: ({ value, min, max, disabled, onChange }, { entry }) => (
    <Input
      type="date"
      value={value ?? ""}
      min={min}
      max={max}
      aria-labelledby={use(FieldLabelId)}
      disabled={disabled}
      onChange={(e) => {
        // A cleared or partly typed date reads as "", which the payload schema refuses.
        if (e.target.value) onChange({ value: e.target.value });
      }}
      data-key={entry.key}
    />
  ),
});
