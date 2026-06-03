import { createAIComponentRenderer } from "@ui-fired/react";
import { Badge as ShadcnBadge } from "@ui-fired/catalog/components/ui/badge";
import { BadgeDef } from "./def";

export const BadgeRenderer = createAIComponentRenderer({
  def: BadgeDef,
  renderer: ({ children, variant = "default", generatedKey }) => {
    return (
      <ShadcnBadge variant={variant} data-key={generatedKey}>
        {String(children ?? "")}
      </ShadcnBadge>
    );
  },
});
