import { createComponentImplementation } from "@uicast/react";
import { Badge as ShadcnBadge } from "../../components/ui/badge";
import { BadgeDef } from "./def";

export const BadgeImpl = createComponentImplementation({
  def: BadgeDef,
  render: ({ text, children, variant}, { entry }) => {
    return (
      <ShadcnBadge variant={variant} data-key={entry.key}>
        {children ?? text}
      </ShadcnBadge>
    );
  },
});
