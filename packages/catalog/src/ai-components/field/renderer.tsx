import { createAIComponentRenderer } from "@ui-fired/react";
import { FieldDef } from "./def";

export const FieldRenderer = createAIComponentRenderer({
  def: FieldDef,
  renderer: ({ disabled = false, children, generatedKey }) => {
    return (
      <div
        className="flex flex-col gap-2"
        data-disabled={disabled || undefined}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
