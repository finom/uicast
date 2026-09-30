import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input } from "../../components/ui/input";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { TimePickerDef } from "./def";

export const TimePickerImpl = createComponentImplementation({
  def: TimePickerDef,
  render: ({ value: initialValue, min, max, disabled, onChange }, { entry }) => {
    const [value, setValue] = useMirror(initialValue ?? "");
    return (
      <Input
        type="time"
        value={value}
        min={min}
        max={max}
        aria-labelledby={use(FieldLabelId)}
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          // A cleared or partly typed time reads as "", which the payload schema refuses.
          if (e.target.value) onChange({ value: e.target.value });
        }}
        data-key={entry.key}
      />
    );
  },
});
