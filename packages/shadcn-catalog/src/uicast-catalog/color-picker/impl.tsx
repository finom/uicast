import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { ColorPickerDef, HEX_COLOR } from "./def";

export const ColorPickerImpl = createComponentImplementation({
  def: ColorPickerDef,
  render: ({
    value,
    disabled,
    onChange,
  }, { entry }) => {
    return (
      <div className="flex items-center gap-2" data-key={entry.key}>
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange({ value: e.target.value })}
          className="size-9 cursor-pointer rounded-md border border-input p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            if (HEX_COLOR.test(e.target.value)) onChange({ value: e.target.value });
          }}
          className="w-28"
        />
      </div>
    );
  },
});
