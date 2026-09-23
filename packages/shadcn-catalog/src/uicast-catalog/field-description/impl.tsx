import { createComponentImplementation } from "@uicast/react";
import { FieldDescriptionDef } from "./def";

export const FieldDescriptionImpl = createComponentImplementation({
  def: FieldDescriptionDef,
  render: ({ text, children }, { entry }) => {
    return (
      <p className="text-sm text-muted-foreground" data-key={entry.key}>
        {children ?? text}
      </p>
    );
  },
});
