import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Textarea as ShadcnTextarea } from "../../components/ui/textarea";
import { pickKeyboardEvent } from "../../events/keyboard";
import { FieldLabelId } from "../field/impl";
import { TextareaDef } from "./def";

export const TextareaImpl = createComponentImplementation({
  def: TextareaDef,
  render: (
    { value, placeholder, disabled, required, rows, onChange, onFocus, onBlur, onKeyDown, onKeyUp },
    { entry },
  ) => (
    <ShadcnTextarea
      value={value}
      placeholder={placeholder}
      aria-labelledby={use(FieldLabelId)}
      disabled={disabled}
      required={required}
      rows={rows}
      onChange={(e) => onChange({ value: e.target.value })}
      onFocus={() => onFocus()}
      onBlur={(e) => onBlur({ value: e.target.value })}
      onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
      onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
      data-key={entry.key}
    />
  ),
});
