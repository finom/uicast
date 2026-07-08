import { createComponentImplementation } from "@ui-fired/react";
import { KBDDef } from "./def";

export const KBDImpl = createComponentImplementation({
  def: KBDDef,
  render: ({ keys = [], generatedKey }) => {
    return (
      <span className="inline-flex items-center gap-1" data-key={generatedKey}>
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-sm border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span className="mx-0.5 text-xs text-muted-foreground">+</span>
            )}
          </span>
        ))}
      </span>
    );
  },
});
