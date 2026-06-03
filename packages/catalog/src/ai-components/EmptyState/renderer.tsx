import { createAIComponentRenderer } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { InboxIcon } from "lucide-react";
import { EmptyStateDef } from "./def";

export const EmptyStateRenderer = createAIComponentRenderer({
  def: EmptyStateDef,
  renderer: ({
    title = "No data",
    description,
    children,
    onClick,
    generatedKey,
  }) => {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        <InboxIcon className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  },
});
