import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { StatusIndicatorDef } from "./def";

export const StatusIndicatorImpl = createComponentImplementation({
  def: StatusIndicatorDef,
  render: ({
    status,
    label,
    pulse,
    size,
  }, { entry }) => {
    const colorMap: Record<string, string> = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
      error: "bg-destructive",
      warning: "bg-yellow-500",
      success: "bg-green-500",
      default: "bg-gray-400",
    };

    const sizeMap = {
      sm: "h-2 w-2",
      default: "h-2.5 w-2.5",
      lg: "h-3.5 w-3.5",
    };

    return (
      <div className="inline-flex items-center gap-2" data-key={entry.key}>
        <span className="relative flex">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex size-full rounded-full opacity-75",
                colorMap[status],
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full",
              sizeMap[size],
              colorMap[status],
            )}
          />
        </span>
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  },
});
