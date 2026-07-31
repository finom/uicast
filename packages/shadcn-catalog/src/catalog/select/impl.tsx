import { createComponentImplementation } from "@uicast/react";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { SelectDef } from "./def";

export const SelectImpl = createComponentImplementation({
  def: SelectDef,
  render: ({
    value,
    placeholder,
    options = [],
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <ShadcnSelect
        value={value}
        disabled={disabled}
        onValueChange={(v) => onChange?.({ value: v })}
      >
        <SelectTrigger className="w-full" data-key={generatedKey}>
          <SelectValue placeholder={placeholder ?? "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    );
  },
});
