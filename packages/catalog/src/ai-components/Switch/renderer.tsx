import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Switch as ShadcnSwitch } from "ui-fired/catalog/components/ui/switch";
import { SwitchDef } from "./def";

export const SwitchRenderer = createAIComponentRenderer({
  def: SwitchDef,
  renderer: ({
    checked = false,
    disabled = false,
    label,
    onChange,
    generatedKey,
  }) => {
    const id = label
      ? `switch-${label.replace(/\s/g, "-").toLowerCase()}`
      : undefined;
    return (
      <div className="flex items-center gap-2" data-key={generatedKey}>
        <ShadcnSwitch
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onChange?.({ checked: v })}
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
