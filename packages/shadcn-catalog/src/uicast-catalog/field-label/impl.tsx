import { createComponentImplementation } from "@uicast/react";
import { Label } from "../../components/ui/label";
import { FieldLabelDef } from "./def";

export const FieldLabelImpl = createComponentImplementation({
  def: FieldLabelDef,
  render: ({ text, children }, { entry }) => <Label data-key={entry.key}>{children ?? text}</Label>,
});
