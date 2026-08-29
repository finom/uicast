import { createComponentImplementation } from "@uicast/react";
import { FieldDescriptionDef } from "./def";

export const FieldDescriptionImpl = createComponentImplementation({
  def: FieldDescriptionDef,
  render: ({ text, children, generatedKey }) => {
    return (
      <p className="text-sm text-muted-foreground" data-key={generatedKey}>
        {children ?? text}
      </p>
    );
  },
});
