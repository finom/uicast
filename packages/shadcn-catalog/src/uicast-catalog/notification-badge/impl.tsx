import { createComponentImplementation } from "@uicast/react";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { NotificationBadgeDef } from "./def";

const DOT_COLORS = { destructive: "bg-destructive", default: "bg-primary", secondary: "bg-secondary" };

export const NotificationBadgeImpl = createComponentImplementation({
  def: NotificationBadgeDef,
  render: ({ count, max, variant, dot, showZero, children }, { entry }) => (
    <div className="relative inline-flex" data-key={entry.key}>
      {children}
      {(count > 0 || showZero) &&
        (dot ? (
          <span className={cn("absolute -top-1 -right-1 size-2.5 rounded-full", DOT_COLORS[variant])} />
        ) : (
          <Badge
            variant={variant}
            className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs font-medium justify-center"
          >
            {count > max ? `${max}+` : count}
          </Badge>
        ))}
    </div>
  ),
});
