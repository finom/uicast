import { createComponentImplementation } from "@ui-fired/react";
import { Slider } from "../../components/ui/slider";
import { RangeSliderDef } from "./def";

export const RangeSliderImpl = createComponentImplementation({
  def: RangeSliderDef,
  render: ({
    min = 0,
    max = 100,
    step = 1,
    valueLow = 25,
    valueHigh = 75,
    disabled = false,
    showValues = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <div className="flex items-center gap-4" data-key={generatedKey}>
        {showValues && (
          <span className="min-w-[3ch] text-sm font-medium tabular-nums">
            {valueLow}
          </span>
        )}
        <Slider
          value={[valueLow, valueHigh]}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={(values) =>
            onChange?.({
              valueLow: values[0],
              valueHigh: values[1],
            })
          }
          className="flex-1"
        />
        {showValues && (
          <span className="min-w-[3ch] text-sm font-medium tabular-nums">
            {valueHigh}
          </span>
        )}
      </div>
    );
  },
});
