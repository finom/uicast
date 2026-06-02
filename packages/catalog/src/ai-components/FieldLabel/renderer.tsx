import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Label } from "@ui-fired/catalog/components/ui/label";
import { FieldLabelDef } from "./def";

export const FieldLabelRenderer = createAIComponentRenderer({
  def: FieldLabelDef,
  renderer: ({ children, htmlFor, generatedKey }) => {
    return (
      <Label htmlFor={htmlFor} data-key={generatedKey}>
        {String(children ?? "")}
      </Label>
    );
  },
});
