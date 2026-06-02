import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { cn } from "@ui-fired/core/lib/utils";
import { DescriptionListDef } from "./def";

export const DescriptionListRenderer = createAIComponentRenderer({
  def: DescriptionListDef,
  renderer: ({
    items = [],
    layout = "vertical",
    columns = "1",
    generatedKey,
  }) => {
    return (
      <dl
        className={cn(
          "grid gap-4",
          columns === "1" && "grid-cols-1",
          columns === "2" && "grid-cols-1 sm:grid-cols-2",
          columns === "3" && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
        )}
        data-key={generatedKey}
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
});
