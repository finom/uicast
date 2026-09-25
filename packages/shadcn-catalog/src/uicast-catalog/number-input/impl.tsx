import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { NumberInputDef } from "./def";

export const NumberInputImpl = createComponentImplementation({
  def: NumberInputDef,
  render: ({ value, min, max, step, disabled, placeholder, onChange, onKeyDown, onKeyUp }, { entry }) => (
    <Input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange({ value: e.target.valueAsNumber || 0 })}
      onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
      onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
      // Never narrower than its digits: a table column gives a bare input no width.
      className="min-w-20"
      data-key={entry.key}
    />
  ),
});
