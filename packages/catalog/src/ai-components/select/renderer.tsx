import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-fired/catalog/components/ui/select";
import { SelectDef } from "./def";

export const SelectRenderer = createAIComponentRenderer({
  def: SelectDef,
  renderer: ({
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
