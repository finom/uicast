import { createComponentImplementation } from "@ui-fired/react";
import { RadioGroup, RadioGroupItem } from "@ui-fired/catalog/components/ui/radio-group";
import { Label } from "@ui-fired/catalog/components/ui/label";
import { RadioDef } from "./def";

export const RadioImpl = createComponentImplementation({
  def: RadioDef,
  render: ({
    value,
    options = [],
    orientation = "vertical",
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange?.({ value: v })}
        disabled={disabled}
        className={
          orientation === "horizontal" ? "flex flex-row gap-4" : "grid gap-2"
        }
        data-key={generatedKey}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem
              value={opt.value}
              id={`${generatedKey}-${opt.value}`}
            />
            <Label
              htmlFor={`${generatedKey}-${opt.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  },
});
