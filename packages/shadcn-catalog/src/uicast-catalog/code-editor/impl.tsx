import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { cn } from "../../lib/utils";
import { blockSkeleton } from "../../lib/skeletons";
import { FieldLabelId } from "../field/impl";
import { CodeEditorDef } from "./def";

export const CodeEditorImpl = createComponentImplementation({
  def: CodeEditorDef,
  render: ({ value, placeholder, disabled, minHeight, showLineNumbers, onChange }, { entry }) => {
    const lineCount = value.split("\n").length;

    return (
      <div
        className={cn("flex rounded-md border border-input bg-background font-mono text-sm", disabled && "opacity-50")}
        data-key={entry.key}
      >
        {showLineNumbers && (
          <div className="select-none border-r bg-muted/50 p-3 text-right text-muted-foreground" style={{ minHeight }}>
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          value={value}
          placeholder={placeholder}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          onChange={(e) => onChange({ value: e.target.value })}
          className="flex-1 resize-none bg-transparent p-3 leading-6 focus:outline-none text-foreground placeholder:text-muted-foreground"
          style={{ minHeight }}
          spellCheck={false}
        />
      </div>
    );
  },
  skeleton: blockSkeleton(240),
});
