import { createComponentImplementation } from "@uicast/react";
import { ListDef } from "./def";

export const ListImpl = createComponentImplementation({
  def: ListDef,
  render: ({
    ordered,
    styleType,
    children,
    generatedKey,
  }) => {
    const styleMap: Record<string, string> = {
      disc: "list-disc",
      decimal: "list-decimal",
      none: "list-none",
    };
    const Tag = ordered ? "ol" : "ul";
    return (
      <Tag
        className={`${styleMap[styleType]} pl-5 space-y-1 text-sm *:list-item`}
        data-key={generatedKey}
      >
        {children}
      </Tag>
    );
  },
});
