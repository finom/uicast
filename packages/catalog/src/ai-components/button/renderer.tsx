import { createAIComponentRenderer } from "@ui-fired/react";
import { Button as ShadcnButton } from "@ui-fired/catalog/components/ui/button";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { ButtonDef } from "./def";

export const ButtonRenderer = createAIComponentRenderer({
  def: ButtonDef,
  renderer: ({
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
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </ShadcnButton>
    );
  },
});
