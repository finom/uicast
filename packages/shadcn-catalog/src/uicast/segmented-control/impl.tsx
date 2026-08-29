import { createComponentImplementation } from "@uicast/react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { SegmentedControlDef } from "./def";

export const SegmentedControlImpl = createComponentImplementation({
  def: SegmentedControlDef,
  render: ({
    value,
    options = [],
    disabled,
    size,
    onChange,
    generatedKey,
  }) => {
    return (
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          if (newValue) onChange({ value: newValue });
        }}
        size={size}
        disabled={disabled}
        data-key={generatedKey}
      >
        {options.map((opt) => (
          <ToggleGroupItem key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
});
