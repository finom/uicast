import { createComponentImplementation } from "@uicast/react";
import { StackSkeleton } from "../../lib/skeletons";
import { ListDef } from "./def";

const MARKERS = { disc: "list-disc", decimal: "list-decimal", none: "list-none" };

export const ListImpl = createComponentImplementation({
  def: ListDef,
  render: ({ ordered, styleType, children }, { entry }) => {
    const Tag = ordered ? "ol" : "ul";
    return (
      <Tag
        className={`${MARKERS[styleType ?? (ordered ? "decimal" : "disc")]} pl-5 space-y-1 text-sm *:list-item`}
        data-key={entry.key}
      >
        {children}
      </Tag>
    );
  },
  skeleton: StackSkeleton,
});
