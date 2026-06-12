import { createAIComponentRenderer } from "@ui-fired/react";
import { ToggleGroup, ToggleGroupItem } from "@ui-fired/catalog/components/ui/toggle-group";
import { SegmentedControlDef } from "./def";

export const SegmentedControlRenderer = createAIComponentRenderer({
  def: SegmentedControlDef,
  renderer: ({
    value,
    options = [],
    disabled = false,
    size = "default",
    onChange,
    generatedKey,
  }) => {
    return (
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          if (newValue) onChange?.({ value: newValue });
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
