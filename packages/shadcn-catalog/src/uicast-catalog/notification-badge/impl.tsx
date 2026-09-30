import { createComponentImplementation } from "@uicast/react";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { NotificationBadgeDef } from "./def";

const DOT_COLORS = { destructive: "bg-destructive", default: "bg-primary", secondary: "bg-secondary" };
// The destructive Badge is a translucent tint; over an icon the count needs a solid fill.
const SOLID = { destructive: "bg-destructive text-white dark:bg-destructive", default: "", secondary: "" };

export const NotificationBadgeImpl = createComponentImplementation({
  def: NotificationBadgeDef,
  render: ({ count, max, variant, dot, showZero, children }, { entry }) => (
    <div className="relative inline-flex" data-key={entry.key}>
      {children}
      {(count > 0 || showZero) &&
        (dot ? (
          <span
            className={cn(
              "absolute -top-1 -right-1 z-10 size-2.5 rounded-full ring-2 ring-background",
              DOT_COLORS[variant],
            )}
          >
            <span className="sr-only">{count > max ? `${max}+` : count}</span>
          </span>
        ) : (
          <Badge
            variant={variant}
            className={cn(
              "absolute -top-2 -right-2 z-10 h-5 min-w-5 justify-center px-1 text-xs font-medium ring-2 ring-background",
              SOLID[variant],
            )}
          >
            {count > max ? `${max}+` : count}
          </Badge>
        ))}
    </div>
  ),
});
