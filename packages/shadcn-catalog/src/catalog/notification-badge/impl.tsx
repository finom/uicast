import { createComponentImplementation } from "@ui-fired/react";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { NotificationBadgeDef } from "./def";

export const NotificationBadgeImpl = createComponentImplementation({
  def: NotificationBadgeDef,
  render: ({
    count = 0,
    max = 99,
    variant = "destructive",
    dot = false,
    showZero = false,
    children,
    generatedKey,
  }) => {
    const shouldShow = dot || count > 0 || showZero;
    const displayCount = count > max ? `${max}+` : String(count);

    return (
      <div className="relative inline-flex" data-key={generatedKey}>
        {children}
        {shouldShow &&
          (dot ? (
            <span
              className={cn(
                "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
                variant === "destructive" && "bg-destructive",
                variant === "default" && "bg-primary",
                variant === "secondary" && "bg-secondary",
              )}
            />
          ) : (
            <Badge
              variant={variant}
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px] font-medium justify-center"
            >
              {displayCount}
            </Badge>
          ))}
      </div>
    );
  },
});
