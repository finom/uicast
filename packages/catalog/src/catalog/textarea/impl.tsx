import { createComponentImplementation } from "@ui-fired/react";
import { Textarea as ShadcnTextarea } from "@ui-fired/catalog/components/ui/textarea";
import { TextareaDef } from "./def";

export const TextareaImpl = createComponentImplementation({
  def: TextareaDef,
  render: ({
    value,
    placeholder,
    disabled = false,
    rows = 3,
    onChange,
    onFocus,
    onBlur,
    generatedKey,
  }) => {
    return (
      <ShadcnTextarea
        value={value as string | undefined}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        onChange={(e) =>
          onChange?.({
            value: e.target.value,
          })
        }
        onFocus={() => onFocus?.({})}
        onBlur={(e) =>
          onBlur?.({
            value: e.target.value,
          })
        }
        data-key={generatedKey}
      />
    );
  },
});
