import { createComponentImplementation } from "@uicast/react";
import { Label } from "../../components/ui/label";
import { FieldLabelDef } from "./def";

export const FieldLabelImpl = createComponentImplementation({
  def: FieldLabelDef,
  render: ({ text, children, htmlFor, generatedKey }) => {
    return (
      <Label htmlFor={htmlFor} data-key={generatedKey}>
        {children ?? text}
      </Label>
    );
  },
});
