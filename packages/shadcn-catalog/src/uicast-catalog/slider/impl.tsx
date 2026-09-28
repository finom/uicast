import { createComponentImplementation } from "@uicast/react";
import { Slider } from "../../components/ui/slider";
import { SliderDef } from "./def";

export const SliderImpl = createComponentImplementation({
  def: SliderDef,
  render: ({ value, min, max, step, disabled, showValue, onChange }, { entry }) => {
    const range = Array.isArray(value);
    const values = range ? value : [value];
    const label = (v: number) => showValue && <span className="min-w-[3ch] text-sm font-medium tabular-nums">{v}</span>;
    return (
      // min-w: a flex row gives the track no width of its own.
      <div className="flex min-w-48 items-center gap-4" data-key={entry.key}>
        {range && label(values[0])}
        <Slider
          value={values}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={(next) => onChange({ value: range ? [next[0], next[1]] : next[0] })}
          className="flex-1"
        />
        {label(values[values.length - 1])}
      </div>
    );
  },
});
