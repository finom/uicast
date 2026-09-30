import { createComponentImplementation } from "@uicast/react";
import { useId } from "react";
import { FieldDescriptionDef } from "./def";

export const FieldDescriptionImpl = createComponentImplementation({
  def: FieldDescriptionDef,
  render: ({ text, children }, { entry }) => {
    const id = useId();
    return (
      <p id={id} data-slot="field-description" className="text-sm text-muted-foreground" data-key={entry.key}>
        {children ?? text}
      </p>
    );
  },
});
