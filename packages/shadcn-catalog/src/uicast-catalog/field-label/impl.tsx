import { createComponentImplementation } from "@uicast/react";
import { Label } from "../../components/ui/label";
import { cn } from "../../lib/utils";
import { FieldLabelDef } from "./def";

export const FieldLabelImpl = createComponentImplementation({
  def: FieldLabelDef,
  render: ({ text, children }, { entry }) => (
    <Label
      // In a Field: a red asterisk when its control is required, all red when the control failed a form's check.
      // -ml-1.5 takes the label's gap from 8px down to 2px for the asterisk only.
      className={cn(
        "group-has-required/field:after:-ml-1.5 group-has-required/field:after:text-destructive group-has-required/field:after:content-['*']",
        "group-data-[invalid=true]/field:text-destructive",
      )}
      data-key={entry.key}
    >
      {children ?? text}
    </Label>
  ),
});
