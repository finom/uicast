import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { iconNode } from "../../lib/icon-node";
import { useMirror } from "../../lib/use-mirror";
import { FieldLabelId } from "../field/impl";
import { ToggleGroupDef } from "./def";

export const ToggleGroupImpl = createComponentImplementation({
  def: ToggleGroupDef,
  render: ({ type, value: initialValue, items, variant, size, disabled, onChange }, { entry }) => {
    // Props parse anew on every render, so an array compares by content.
    const [value, setValue] = useMirror(initialValue, JSON.stringify(initialValue));
    // Radix pairs `type` with the value's shape, so the two cases are separate elements.
    const shared = {
      onValueChange: (newValue: string | string[]) => {
        setValue(newValue);
        onChange({ value: newValue });
      },
      variant,
      size,
      disabled,
      "aria-labelledby": use(FieldLabelId),
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
