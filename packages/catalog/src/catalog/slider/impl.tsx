import { createComponentImplementation } from "@ui-fired/react";
import { Slider } from "@ui-fired/catalog/components/ui/slider";
import { SliderDef } from "./def";

export const SliderImpl = createComponentImplementation({
  def: SliderDef,
  render: ({
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showValue = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <div className="flex items-center gap-4" data-key={generatedKey}>
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={(values) => onChange?.({ value: values[0] })}
          className="flex-1"
        />
        {showValue && (
          <span className="min-w-[3ch] text-sm font-medium tabular-nums">
            {value}
          </span>
        )}
      </div>
    );
  },
});
