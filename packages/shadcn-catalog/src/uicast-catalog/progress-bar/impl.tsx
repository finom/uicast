import { createComponentImplementation } from "@uicast/react";
import { Progress } from "../../components/ui/progress";
import { ProgressBarDef } from "./def";

const COLORS = {
  default: "[&>[data-slot=progress-indicator]]:bg-primary",
  success: "[&>[data-slot=progress-indicator]]:bg-success",
  warning: "[&>[data-slot=progress-indicator]]:bg-warning",
  error: "[&>[data-slot=progress-indicator]]:bg-destructive",
};
const HEIGHTS = { sm: "h-1", md: "h-2", lg: "h-3" };

export const ProgressBarImpl = createComponentImplementation({
  def: ProgressBarDef,
  render: ({ value, max, showLabel, color, size }, { entry }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="w-full" data-key={entry.key}>
        {showLabel && (
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
        )}
        <Progress value={percentage} className={`${HEIGHTS[size]} ${COLORS[color]}`} />
      </div>
    );
  },
});
