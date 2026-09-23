import { createComponentImplementation } from "@uicast/react";
import { ListDef } from "./def";

export const ListImpl = createComponentImplementation({
  def: ListDef,
  render: ({
    ordered,
    styleType,
    children,
  }, { entry }) => {
    const styleMap: Record<string, string> = {
      disc: "list-disc",
      decimal: "list-decimal",
      none: "list-none",
    };
    const Tag = ordered ? "ol" : "ul";
    return (
      <Tag
        className={`${styleMap[styleType ?? (ordered ? "decimal" : "disc")]} pl-5 space-y-1 text-sm *:list-item`}
        data-key={entry.key}
      >
        {children}
      </Tag>
    );
  },
  placeholder: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
});
