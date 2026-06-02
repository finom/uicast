import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Input } from "ui-fired/catalog/components/ui/input";
import { NumberInputDef } from "./def";

export const NumberInputRenderer = createAIComponentRenderer({
  def: NumberInputDef,
  renderer: ({
    value,
    min,
    max,
    step,
    disabled = false,
    placeholder,
    onChange,
    generatedKey,
  }) => {
    return (
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.({ value: e.target.valueAsNumber || 0 })}
        data-key={generatedKey}
      />
    );
  },
});
