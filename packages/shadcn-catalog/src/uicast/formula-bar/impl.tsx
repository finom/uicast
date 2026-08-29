import { createComponentImplementation } from "@uicast/react";
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { FunctionSquare } from "lucide-react";
import { FormulaBarDef } from "./def";

export const FormulaBarImpl = createComponentImplementation({
  def: FormulaBarDef,
  render: ({
    value: initialValue = "",
    placeholder,
    cellReference,
    disabled,
    onChange,
    onSubmit,
    generatedKey,
  }) => {
    const [value, setValue] = useState(initialValue);

    return (
      <div
        className="flex items-center gap-0 border rounded-md"
        data-key={generatedKey}
      >
        {cellReference && (
          <div className="flex items-center justify-center border-r px-3 py-1.5 bg-muted min-w-15">
            <span className="text-sm font-mono font-medium">
              {cellReference}
            </span>
          </div>
        )}
        <div className="flex items-center px-2">
          <FunctionSquare className="size-4 text-muted-foreground" />
        </div>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange({ value: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit({ value });
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 focus-visible:ring-0 font-mono text-sm"
        />
      </div>
    );
  },
});
