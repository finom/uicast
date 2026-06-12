import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { FunctionSquare } from "lucide-react";
import { FormulaBarDef } from "./def";

export const FormulaBarRenderer = createAIComponentRenderer({
  def: FormulaBarDef,
  renderer: ({
    value: initialValue = "",
    placeholder = "Enter formula (e.g. =SUM(A1:A10))",
    cellReference,
    disabled = false,
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
          <div className="flex items-center justify-center border-r px-3 py-1.5 bg-muted min-w-[60px]">
            <span className="text-sm font-mono font-medium">
              {cellReference}
            </span>
          </div>
        )}
        <div className="flex items-center px-2">
          <FunctionSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.({ value: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit?.({ value });
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
