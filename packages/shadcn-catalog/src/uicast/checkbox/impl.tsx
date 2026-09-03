import { createComponentImplementation } from "@uicast/react";
import { Checkbox as ShadcnCheckbox } from "../../components/ui/checkbox";
import { CheckboxDef } from "./def";

export const CheckboxImpl = createComponentImplementation({
  def: CheckboxDef,
  render: ({
    checked,
    disabled,
    label,
    onChange,
  }, { entry }) => {
    // entry.key is unique per element, so ids stay unique when several
    // checkboxes (even with the same label) render in one document.
    const id = `checkbox-${entry.key}`;
    return (
      <div className="flex items-center gap-2" data-key={entry.key}>
        <ShadcnCheckbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onChange({ checked: v === true })}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
});
