import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { InboxIcon } from "lucide-react";
import { EmptyStateDef } from "./def";

export const EmptyStateImpl = createComponentImplementation({
  def: EmptyStateDef,
  render: ({
    title,
    description,
    children,
    onClick,
    generatedKey,
  }) => {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        onClick={(e) => onClick(pickMouseEvent(e))}
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
