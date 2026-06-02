import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Input } from "ui-fired/catalog/components/ui/input";
import { ColorPickerDef } from "./def";

export const ColorPickerRenderer = createAIComponentRenderer({
  def: ColorPickerDef,
  renderer: ({
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
