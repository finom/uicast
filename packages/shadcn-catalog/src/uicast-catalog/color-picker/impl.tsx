import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input } from "../../components/ui/input";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { ColorPickerDef, HEX_COLOR } from "./def";

export const ColorPickerImpl = createComponentImplementation({
  def: ColorPickerDef,
  render: ({ value, disabled, onChange }, { entry }) => {
    const [text, setText] = useMirror(value);
    // The color input takes only a full hex; while the text is partial it keeps the last one.
    const color = HEX_COLOR.test(text) ? text : value;
    return (
      <div className="flex items-center gap-2" data-key={entry.key}>
        <input
          type="color"
          value={color}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            onChange({ value: e.target.value });
          }}
          className="size-9 cursor-pointer rounded-md border border-input p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="text"
          value={text}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            if (HEX_COLOR.test(e.target.value)) onChange({ value: e.target.value });
          }}
          className="w-28"
        />
      </div>
    );
  },
});
