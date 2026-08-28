import { createComponentImplementation } from "@uicast/react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToggleGroupDef } from "./def";

export const ToggleGroupImpl = createComponentImplementation({
  def: ToggleGroupDef,
  render: ({
    type = "single",
    value,
    items = [],
    variant = "default",
    size = "default",
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    const getIcon = (iconName?: string) => {
      if (!iconName) return null;
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
        iconName
      ];
      return Icon ? <Icon className="size-4" /> : null;
    };

    return (
      <ToggleGroup
        type={type}
        value={value}
        onValueChange={(newValue: string | string[]) =>
          onChange?.({ value: newValue })
        }
        variant={variant}
        size={size}
        disabled={disabled}
        data-key={generatedKey}
      >
        {items.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {getIcon(item.icon)}
            {item.label && (
              <span className={item.icon ? "ml-1" : ""}>{item.label}</span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
});
