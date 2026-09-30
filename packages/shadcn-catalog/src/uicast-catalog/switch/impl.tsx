import { use, useId } from "react";
import { createComponentImplementation } from "@uicast/react";
import { Switch as ShadcnSwitch } from "../../components/ui/switch";
import { FieldLabelId } from "../field/impl";
import { SwitchDef } from "./def";

export const SwitchImpl = createComponentImplementation({
  def: SwitchDef,
  render: ({ checked, disabled, label, onChange }, { entry }) => {
    // Per instance, not `entry.key`: list items share one entry key.
    const id = useId();
    const fieldLabelId = use(FieldLabelId);
    return (
      <div className="flex items-center gap-2" data-key={entry.key}>
        <ShadcnSwitch
          id={id}
          aria-labelledby={label ? undefined : fieldLabelId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onChange({ checked: v })}
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
