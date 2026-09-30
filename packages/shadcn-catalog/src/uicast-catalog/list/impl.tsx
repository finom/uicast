import { createComponentImplementation } from "@uicast/react";
import { Children } from "react";
import { StackSkeleton } from "../../lib/skeletons";
import { ListDef } from "./def";

const MARKERS = { disc: "list-disc", decimal: "list-decimal", none: "list-none" };

export const ListImpl = createComponentImplementation({
  def: ListDef,
  render: ({ ordered, styleType, children }, { entry }) => {
    const Tag = ordered ? "ol" : "ul";
    // A hidden child renders nothing, so its item hides too.
    return (
      <Tag
        className={`${MARKERS[styleType ?? (ordered ? "decimal" : "disc")]} pl-5 space-y-1 text-sm`}
        data-key={entry.key}
      >
        {Children.map(children, (child) => (
          <li className="empty:hidden">{child}</li>
        ))}
      </Tag>
    );
  },
  skeleton: StackSkeleton,
});
