import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Progress } from "@ui-fired/catalog/components/ui/progress";
import { ProgressBarDef } from "./def";

export const ProgressBarRenderer = createAIComponentRenderer({
  def: ProgressBarDef,
  renderer: ({
    value = 0,
    max = 100,
    showLabel = false,
    color = "default",
    size = "md",
    generatedKey,
  }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const colorMap: Record<string, string> = {
      default: "[&>[data-slot=progress-indicator]]:bg-primary",
      success: "[&>[data-slot=progress-indicator]]:bg-green-500",
      warning: "[&>[data-slot=progress-indicator]]:bg-yellow-500",
      error: "[&>[data-slot=progress-indicator]]:bg-red-500",
    };
    const sizeMap: Record<string, string> = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };
    return (
      <div className="w-full" data-key={generatedKey}>
        {showLabel && (
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <Progress
          value={percentage}
          className={`${sizeMap[size]} ${colorMap[color]}`}
        />
      </div>
    );
  },
});
