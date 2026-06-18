import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { NumberInputDef } from "./def";

export const NumberInputImpl = createComponentImplementation({
  def: NumberInputDef,
  render: ({
    value,
    min,
    max,
    step,
    disabled = false,
    placeholder,
    onChange,
    onKeyDown,
    onKeyUp,
    generatedKey,
  }) => {
    return (
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.({ value: e.target.valueAsNumber || 0 })}
        onKeyDown={(e) => onKeyDown?.(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp?.(pickKeyboardEvent(e))}
        data-key={generatedKey}
      />
    );
  },
});
