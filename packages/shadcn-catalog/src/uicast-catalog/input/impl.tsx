import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input as ShadcnInput } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { InputDef } from "./def";

const reading = (input: HTMLInputElement) => ({ value: input.value, valueAsNumber: input.valueAsNumber || 0 });

export const InputImpl = createComponentImplementation({
  def: InputDef,
  render: (
    { value: initialValue, type, placeholder, disabled, required, onChange, onFocus, onBlur, onKeyDown, onKeyUp },
    { entry },
  ) => {
    const [value, setValue] = useMirror(initialValue ?? "");
    return (
      <ShadcnInput
        type={type}
        value={value}
        placeholder={placeholder}
        aria-labelledby={use(FieldLabelId)}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(reading(e.target));
        }}
        onFocus={() => onFocus()}
        onBlur={(e) => onBlur(reading(e.target))}
        onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        data-key={entry.key}
      />
    );
  },
});
