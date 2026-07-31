import { createComponentImplementation } from "@uicast/react";
import { Label as ShadcnLabel } from "../../components/ui/label";
import { LabelDef } from "./def";

export const LabelImpl = createComponentImplementation({
  def: LabelDef,
  render: ({ children, htmlFor, generatedKey }) => {
    return (
      <ShadcnLabel htmlFor={htmlFor} data-key={generatedKey}>
        {children}
      </ShadcnLabel>
    );
  },
});
