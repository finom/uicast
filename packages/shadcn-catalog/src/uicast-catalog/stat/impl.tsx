import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatDef } from "./def";

const TREND_ICONS = {
  up: <TrendingUp className="size-4" />,
  down: <TrendingDown className="size-4" />,
  neutral: <Minus className="size-4" />,
};

const TREND_COLORS = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-muted-foreground",
};

export const StatImpl = createComponentImplementation({
  def: StatDef,
  render: ({ label, value, trend, trendValue, helpText }, { entry, loading }) => {
    return (
      <div className={cn("flex flex-col gap-1", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {value}
          </span>
          {(trend || trendValue) && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${TREND_COLORS[trend ?? "neutral"]}`}
            >
              {trend && TREND_ICONS[trend]}
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
  skeleton: () => (
    <div className="flex min-w-0 flex-col gap-1">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-28" />
    </div>
  ),
});
