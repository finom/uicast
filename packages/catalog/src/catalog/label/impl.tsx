import { createComponentImplementation } from "@ui-fired/react";
import { Label as ShadcnLabel } from "@ui-fired/catalog/components/ui/label";
import { LabelDef } from "./def";

export const LabelImpl = createComponentImplementation({
  def: LabelDef,
  render: ({ children, htmlFor, generatedKey }) => {
    return (
      <ShadcnLabel htmlFor={htmlFor} data-key={generatedKey}>
        {String(children ?? "")}
      </ShadcnLabel>
    );
  },
});
