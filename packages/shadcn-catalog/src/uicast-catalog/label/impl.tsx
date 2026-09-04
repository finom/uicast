import { createComponentImplementation } from "@uicast/react";
import { Label as ShadcnLabel } from "../../components/ui/label";
import { LabelDef } from "./def";

export const LabelImpl = createComponentImplementation({
  def: LabelDef,
  render: ({ text, children, htmlFor}, { entry }) => {
    return (
      <ShadcnLabel htmlFor={htmlFor} data-key={entry.key}>
        {children ?? text}
      </ShadcnLabel>
    );
  },
});
