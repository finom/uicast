import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Toggle } from "ui-fired/catalog/components/ui/toggle";
import { ToggleDef } from "./def";

export const ToggleRenderer = createAIComponentRenderer({
  def: ToggleDef,
  renderer: ({
    pressed = false,
    variant = "default",
    size = "default",
    disabled = false,
    children,
    onPressedChange,
    generatedKey,
  }) => {
    return (
      <Toggle
        pressed={pressed}
        onPressedChange={(isPressed) =>
          onPressedChange?.({ pressed: isPressed })
        }
        variant={variant}
        size={size}
        disabled={disabled}
        data-key={generatedKey}
      >
        {children}
      </Toggle>
    );
  },
});
