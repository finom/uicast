import { createComponentImplementation } from "@uicast/react";
import { Toggle } from "../../components/ui/toggle";
import { ToggleDef } from "./def";

export const ToggleImpl = createComponentImplementation({
  def: ToggleDef,
  render: ({
    pressed,
    variant,
    size,
    disabled,
    children,
    onPressedChange,
    generatedKey,
  }) => {
    return (
      <Toggle
        pressed={pressed}
        onPressedChange={(isPressed) =>
          onPressedChange({ pressed: isPressed })
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
