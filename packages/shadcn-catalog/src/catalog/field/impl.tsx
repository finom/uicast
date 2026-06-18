import { createComponentImplementation } from "@ui-fired/react";
import { FieldDef } from "./def";

export const FieldImpl = createComponentImplementation({
  def: FieldDef,
  render: ({ disabled = false, children, generatedKey }) => {
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
