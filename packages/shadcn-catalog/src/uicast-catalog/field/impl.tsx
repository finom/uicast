import { createComponentImplementation } from "@uicast/react";
import { FieldDef } from "./def";

export const FieldImpl = createComponentImplementation({
  def: FieldDef,
  render: ({ children }, { entry }) => (
    <div className="flex flex-col gap-2" data-key={entry.key}>
      {children}
    </div>
  ),
});
