import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatDef } from "./def";

export const StatImpl = createComponentImplementation({
  def: StatDef,
  render: ({ label, value, trend, trendValue, helpText}, { entry, loading }) => {
    const trendIcon =
      trend === "up" ? (
        <TrendingUp className="size-4 text-green-600" />
      ) : trend === "down" ? (
        <TrendingDown className="size-4 text-red-600" />
      ) : trend === "neutral" ? (
        <Minus className="size-4 text-muted-foreground" />
      ) : null;

    const trendColor =
      trend === "up"
        ? "text-green-600"
        : trend === "down"
          ? "text-red-600"
          : "text-muted-foreground";

    return (
      <div className={cn("flex flex-col gap-1", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {String(value)}
          </span>
          {(trendIcon || trendValue) && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}
            >
              {trendIcon}
              {trendValue}
            </span>
          )}
        </div>
        {helpText && (
          <span className="text-xs text-muted-foreground">{helpText}</span>
        )}
      </div>
    );
  },
  placeholder: () => (
    <div className="flex min-w-0 flex-col gap-1">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-28" />
    </div>
  ),
});
