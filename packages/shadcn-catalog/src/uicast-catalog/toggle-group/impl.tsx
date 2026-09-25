import { createComponentImplementation } from "@uicast/react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { iconNode } from "../../lib/icon-node";
import { ToggleGroupDef } from "./def";

export const ToggleGroupImpl = createComponentImplementation({
  def: ToggleGroupDef,
  render: ({ type, value, items, variant, size, disabled, onChange }, { entry }) => {
    // Radix pairs `type` with the value's shape, so the two cases are separate elements.
    const shared = {
      onValueChange: (newValue: string | string[]) => onChange({ value: newValue }),
      variant,
      size,
      disabled,
      "data-key": entry.key,
    };
    const children = items.map((item) => (
      <ToggleGroupItem key={item.value} value={item.value}>
        {iconNode(item.icon, "size-4")}
        {item.label && <span className={item.icon ? "ml-1" : ""}>{item.label}</span>}
      </ToggleGroupItem>
    ));

    return type === "multiple" ? (
      <ToggleGroup {...shared} type="multiple" value={Array.isArray(value) ? value : []}>
        {children}
      </ToggleGroup>
    ) : (
      <ToggleGroup {...shared} type="single" value={typeof value === "string" ? value : ""}>
        {children}
      </ToggleGroup>
    );
  },
});
