import { createComponentImplementation } from "@ui-fired/react";
import { Input as ShadcnInput } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { InputDef } from "./def";

export const InputImpl = createComponentImplementation({
  def: InputDef,
  render: ({
    value,
    type = "text",
    placeholder,
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    generatedKey,
  }) => {
    return (
      <ShadcnInput
        type={type}
        value={value as string | number | readonly string[] | undefined}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) =>
          onChange?.({
            value: e.target.value,
            valueAsNumber: e.target.valueAsNumber || 0,
          })
        }
        onFocus={() => onFocus?.({})}
        onBlur={(e) =>
          onBlur?.({
            value: e.target.value,
            valueAsNumber: e.target.valueAsNumber || 0,
          })
        }
        onKeyDown={(e) => onKeyDown?.(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp?.(pickKeyboardEvent(e))}
        data-key={generatedKey}
      />
    );
  },
});
