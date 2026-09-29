import { createComponentImplementation } from "@uicast/react";
import { Input as ShadcnInput } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { InputDef } from "./def";

const reading = (input: HTMLInputElement) => ({ value: input.value, valueAsNumber: input.valueAsNumber || 0 });

export const InputImpl = createComponentImplementation({
  def: InputDef,
  render: (
    { value, type, placeholder, disabled, required, onChange, onFocus, onBlur, onKeyDown, onKeyUp },
    { entry },
  ) => (
    <ShadcnInput
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      onChange={(e) => onChange(reading(e.target))}
      onFocus={() => onFocus()}
      onBlur={(e) => onBlur(reading(e.target))}
      onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
      onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
      data-key={entry.key}
    />
  ),
});
