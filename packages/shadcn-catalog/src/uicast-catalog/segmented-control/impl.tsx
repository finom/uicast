import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
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
  }, { entry }) => {
    return (
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          if (newValue) onChange({ value: newValue });
        }}
        size={size}
        disabled={disabled}
        data-key={entry.key}
      >
        {options.map((opt) => (
          <ToggleGroupItem key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-row items-center gap-2">{children}</div>,
});
