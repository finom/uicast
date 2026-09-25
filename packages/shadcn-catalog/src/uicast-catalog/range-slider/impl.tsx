import { createComponentImplementation } from "@uicast/react";
import { Slider } from "../../components/ui/slider";
import { RangeSliderDef } from "./def";

export const RangeSliderImpl = createComponentImplementation({
  def: RangeSliderDef,
  render: ({ min, max, step, valueLow, valueHigh, disabled, showValues, onChange }, { entry }) => (
    <div className="flex items-center gap-4" data-key={entry.key}>
      {showValues && <span className="min-w-[3ch] text-sm font-medium tabular-nums">{valueLow}</span>}
      <Slider
        value={[valueLow, valueHigh]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(values) =>
          onChange({
            valueLow: values[0],
            valueHigh: values[1],
          })
        }
        className="flex-1"
      />
      {showValues && <span className="min-w-[3ch] text-sm font-medium tabular-nums">{valueHigh}</span>}
    </div>
  ),
});
