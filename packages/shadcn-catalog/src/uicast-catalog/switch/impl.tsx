import { useId } from "react";
import { createComponentImplementation } from "@uicast/react";
import { Switch as ShadcnSwitch } from "../../components/ui/switch";
import { SwitchDef } from "./def";

export const SwitchImpl = createComponentImplementation({
  def: SwitchDef,
  render: ({
    checked,
    disabled,
    label,
    onChange,
  }, { entry }) => {
    // Per instance, not `entry.key`: list items share one entry key.
    const id = useId();
    return (
      <div className="flex items-center gap-2" data-key={entry.key}>
        <ShadcnSwitch
          id={id}
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
