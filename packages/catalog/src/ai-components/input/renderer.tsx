import { createAIComponentRenderer } from "@ui-fired/react";
import { Input as ShadcnInput } from "@ui-fired/catalog/components/ui/input";
import { InputDef } from "./def";

export const InputRenderer = createAIComponentRenderer({
  def: InputDef,
  renderer: ({
    value,
    type = "text",
    placeholder,
    disabled = false,
    onChange,
    onFocus,
    onBlur,
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
        data-key={generatedKey}
      />
    );
  },
});
