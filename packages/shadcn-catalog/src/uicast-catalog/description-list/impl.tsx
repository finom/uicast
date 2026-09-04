import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { cn, busy } from "../../lib/utils";
import { DescriptionListDef } from "./def";

export const DescriptionListImpl = createComponentImplementation({
  def: DescriptionListDef,
  render: ({
    items = [],
    layout,
    columns,
  }, { entry, loading }) => {
    return (
      <dl
        className={cn(
          "grid gap-4",
          columns === "1" && "grid-cols-1",
          columns === "2" && "grid-cols-1 sm:grid-cols-2",
          columns === "3" && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
          busy(loading),
        )}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              layout === "horizontal"
                ? "flex items-baseline justify-between gap-4"
                : "space-y-1",
            )}
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
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
