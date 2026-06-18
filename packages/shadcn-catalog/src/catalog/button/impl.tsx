import { createComponentImplementation } from "@ui-fired/react";
import { Button as ShadcnButton } from "../../components/ui/button";
import { pickMouseEvent } from "../../events/mouse";
import { ButtonDef } from "./def";

export const ButtonImpl = createComponentImplementation({
  def: ButtonDef,
  render: ({
    children,
    variant = "default",
    size = "default",
    disabled = false,
    onClick,
    generatedKey,
  }) => {
    return (
      <ShadcnButton
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={(e) => onClick?.(pickMouseEvent(e))}
        data-key={generatedKey}
      >
        {children}
      </ShadcnButton>
    );
  },
});
