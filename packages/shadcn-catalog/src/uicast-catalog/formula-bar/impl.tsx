import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { FunctionSquare } from "lucide-react";
import { Input } from "../../components/ui/input";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { FormulaBarDef } from "./def";

export const FormulaBarImpl = createComponentImplementation({
  def: FormulaBarDef,
  render: ({ value: initialValue, placeholder, cellReference, disabled, onChange, onSubmit }, { entry }) => {
    const [value, setValue] = useMirror(initialValue);
    return (
      <div className="flex items-center gap-0 border rounded-md" data-key={entry.key}>
        {cellReference && (
          <div className="flex items-center justify-center border-r px-3 py-1.5 bg-muted min-w-15">
            <span className="text-sm font-mono font-medium">{cellReference}</span>
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
          onKeyDown={(e) => e.key === "Enter" && onSubmit({ value })}
          placeholder={placeholder}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          className="border-0 focus-visible:ring-0 font-mono text-sm"
        />
      </div>
    );
  },
});
