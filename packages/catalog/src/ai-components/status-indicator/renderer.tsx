import { createAIComponentRenderer } from "@ui-fired/react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { StatusIndicatorDef } from "./def";

export const StatusIndicatorRenderer = createAIComponentRenderer({
  def: StatusIndicatorDef,
  renderer: ({
    status = "default",
    label,
    pulse = false,
    size = "default",
    generatedKey,
  }) => {
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
      <div className="inline-flex items-center gap-2" data-key={generatedKey}>
        <span className="relative flex">
          <span
            className={cn(
              "rounded-full",
              sizeMap[size],
              colorMap[status],
              pulse &&
                "animate-ping absolute inline-flex h-full w-full opacity-75 rounded-full",
            )}
          />
          {pulse && (
            <span
              className={cn(
                "relative inline-flex rounded-full",
                sizeMap[size],
                colorMap[status],
              )}
            />
          )}
          {!pulse && (
            <span
              className={cn(
                "relative inline-flex rounded-full",
                sizeMap[size],
                colorMap[status],
              )}
            />
          )}
        </span>
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  },
});
