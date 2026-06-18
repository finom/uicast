import { createComponentImplementation } from "@ui-fired/react";
import { Label } from "../../components/ui/label";
import { FieldLabelDef } from "./def";

export const FieldLabelImpl = createComponentImplementation({
  def: FieldLabelDef,
  render: ({ children, htmlFor, generatedKey }) => {
    return (
      <Label htmlFor={htmlFor} data-key={generatedKey}>
        {String(children ?? "")}
      </Label>
    );
  },
});
