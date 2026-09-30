import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { NumberInputDef } from "./def";

export const NumberInputImpl = createComponentImplementation({
  def: NumberInputDef,
  render: (
    { value: initialValue, min, max, step, disabled, required, placeholder, onChange, onKeyDown, onKeyUp },
    { entry },
  ) => {
    const [value, setValue] = useMirror(initialValue);
    return (
      <Input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-labelledby={use(FieldLabelId)}
        onChange={(e) => {
          // An empty field, or one partly typed ("-"), reads as NaN.
          const next = Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber;
          setValue(next);
          onChange({ value: next });
        }}
        onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        // Never narrower than its digits: a table column gives a bare input no width.
        className="min-w-20"
        data-key={entry.key}
      />
    );
  },
});
