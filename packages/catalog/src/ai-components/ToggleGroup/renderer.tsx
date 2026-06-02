import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { ToggleGroup, ToggleGroupItem } from "@ui-fired/catalog/components/ui/toggle-group";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToggleGroupDef } from "./def";

export const ToggleGroupRenderer = createAIComponentRenderer({
  def: ToggleGroupDef,
  renderer: ({
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
      return Icon ? <Icon className="h-4 w-4" /> : null;
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
