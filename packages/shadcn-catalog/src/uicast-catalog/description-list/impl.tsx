import { createComponentImplementation } from "@uicast/react";
import { cn, busyClass } from "../../lib/utils";
import { COLUMNS } from "../../lib/layout";
import { StackSkeleton } from "../../lib/skeletons";
import { DescriptionListDef } from "./def";

export const DescriptionListImpl = createComponentImplementation({
  def: DescriptionListDef,
  render: ({ items, layout, columns }, { entry, busy }) => (
    <dl
      className={cn("grid gap-4", COLUMNS[columns], busyClass(busy))}
      aria-busy={busy || undefined}
      data-key={entry.key}
    >
      {items.map((item, i) => (
        <div key={i} className={layout === "horizontal" ? "flex items-baseline justify-between gap-4" : "space-y-1"}>
          <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  ),
  skeleton: StackSkeleton,
});
