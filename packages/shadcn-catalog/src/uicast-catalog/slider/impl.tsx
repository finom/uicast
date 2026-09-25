import { createComponentImplementation } from "@uicast/react";
import { Slider } from "../../components/ui/slider";
import { SliderDef } from "./def";

export const SliderImpl = createComponentImplementation({
  def: SliderDef,
  render: ({ value, min, max, step, disabled, showValue, onChange }, { entry }) => (
    // min-w: a flex row gives the track no width of its own.
    <div className="flex min-w-48 items-center gap-4" data-key={entry.key}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(values) => onChange({ value: values[0] })}
        className="flex-1"
      />
      {showValue && (
        <span className="min-w-[3ch] text-sm font-medium tabular-nums">
          {value}
        </span>
      )}
    </div>
  ),
});
