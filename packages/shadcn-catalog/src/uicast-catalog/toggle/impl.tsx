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
    onChange,
  }, { entry }) => {
    return (
      <Toggle
        pressed={pressed}
        onPressedChange={(isPressed) => onChange({ pressed: isPressed })}
        variant={variant}
        size={size}
        disabled={disabled}
        data-key={entry.key}
      >
        {children}
      </Toggle>
    );
  },
});
