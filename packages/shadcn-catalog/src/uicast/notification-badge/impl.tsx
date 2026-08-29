import { createComponentImplementation } from "@uicast/react";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { NotificationBadgeDef } from "./def";

export const NotificationBadgeImpl = createComponentImplementation({
  def: NotificationBadgeDef,
  render: ({
    count,
    max,
    variant,
    dot,
    showZero,
    children,
    generatedKey,
  }) => {
    // dot only changes presentation — a zero count stays hidden unless
    // showZero asks for it.
    const shouldShow = count > 0 || showZero;
    const displayCount = count > max ? `${max}+` : String(count);

    return (
      <div className="relative inline-flex" data-key={generatedKey}>
        {children}
        {shouldShow &&
          (dot ? (
            <span
              className={cn(
                "absolute -top-1 -right-1 size-2.5 rounded-full",
                variant === "destructive" && "bg-destructive",
                variant === "default" && "bg-primary",
                variant === "secondary" && "bg-secondary",
              )}
            />
          ) : (
            <Badge
              variant={variant}
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs font-medium justify-center"
            >
              {displayCount}
            </Badge>
          ))}
      </div>
    );
  },
});
