import { createComponentImplementation } from "@uicast/react";
import { Textarea as ShadcnTextarea } from "../../components/ui/textarea";
import { pickKeyboardEvent } from "../../events/keyboard";
import { TextareaDef } from "./def";

export const TextareaImpl = createComponentImplementation({
  def: TextareaDef,
  render: ({
    value,
    placeholder,
    disabled,
    rows,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
  }, { entry }) => {
    return (
      <ShadcnTextarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        onChange={(e) =>
          onChange({
            value: e.target.value,
          })
        }
        onFocus={() => onFocus()}
        onBlur={(e) =>
          onBlur({
            value: e.target.value,
          })
        }
        onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        data-key={entry.key}
      />
    );
  },
});
