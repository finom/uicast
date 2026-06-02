import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatDef } from "./def";

export const StatRenderer = createAIComponentRenderer({
  def: StatDef,
  renderer: ({ label, value, trend, trendValue, helpText, generatedKey }) => {
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
      <div className="flex flex-col gap-1" data-key={generatedKey}>
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
});
