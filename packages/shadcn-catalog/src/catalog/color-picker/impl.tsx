import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { ColorPickerDef } from "./def";

export const ColorPickerImpl = createComponentImplementation({
  def: ColorPickerDef,
  render: ({
    value = "#000000",
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <div className="flex items-center gap-2" data-key={generatedKey}>
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.({ value: e.target.value })}
          className="h-9 w-9 cursor-pointer rounded-md border border-input p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.({ value: e.target.value })}
          className="w-28"
        />
      </div>
    );
  },
});
