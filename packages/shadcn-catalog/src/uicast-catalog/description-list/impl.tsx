import { createComponentImplementation } from "@uicast/react";
import { cn, busy } from "../../lib/utils";
import { COLUMNS } from "../../lib/layout";
import { DescriptionListDef } from "./def";

export const DescriptionListImpl = createComponentImplementation({
  def: DescriptionListDef,
  render: ({
    items,
    layout,
    columns,
  }, { entry, loading }) => {
    return (
      <dl
        className={cn(
          "grid gap-4",
          COLUMNS[columns],
          busy(loading),
        )}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={
              layout === "horizontal" ? "flex items-baseline justify-between gap-4" : "space-y-1"
            }
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-sm font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  },
  skeleton: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
});
