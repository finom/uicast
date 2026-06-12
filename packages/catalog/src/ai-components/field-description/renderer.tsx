import { createAIComponentRenderer } from "@ui-fired/react";
import { FieldDescriptionDef } from "./def";

export const FieldDescriptionRenderer = createAIComponentRenderer({
  def: FieldDescriptionDef,
  renderer: ({ children, generatedKey }) => {
    return (
      <p className="text-sm text-muted-foreground" data-key={generatedKey}>
        {String(children ?? "")}
      </p>
    );
  },
});
