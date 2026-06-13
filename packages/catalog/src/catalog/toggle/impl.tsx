import { createComponentImplementation } from "@ui-fired/react";
import { Toggle } from "@ui-fired/catalog/components/ui/toggle";
import { ToggleDef } from "./def";

export const ToggleImpl = createComponentImplementation({
  def: ToggleDef,
  render: ({
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
