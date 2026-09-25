import { createComponentImplementation } from "@uicast/react";
import { Button as ShadcnButton } from "../../components/ui/button";
import { pickMouseEvent } from "../../events/mouse";
import { ButtonDef } from "./def";

export const ButtonImpl = createComponentImplementation({
  def: ButtonDef,
  render: ({ text, children, variant, size, disabled, onClick }, { entry }) => (
    <ShadcnButton
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={(e) => onClick(pickMouseEvent(e))}
      data-key={entry.key}
    >
      {children ?? text}
    </ShadcnButton>
  ),
});
