import { createComponentImplementation } from "@uicast/react";
import { use, useId } from "react";
import { Progress } from "../../components/ui/progress";
import { FieldLabelId } from "../field/impl";
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
  render: ({ value, max, label, showLabel, color, size }, { entry }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const labelId = useId();
    const fieldLabelId = use(FieldLabelId);
    return (
      <div className="w-full" data-key={entry.key}>
        {(label || showLabel) && (
          <div className="flex justify-between mb-1 text-sm">
            {label && <span id={labelId}>{label}</span>}
            {showLabel && <span className="text-muted-foreground">{Math.round(percentage)}%</span>}
          </div>
        )}
        <Progress
          value={percentage}
          // The ui Progress keeps `value` for its indicator; the progressbar role needs it too.
          aria-valuenow={percentage}
          aria-labelledby={label ? labelId : fieldLabelId}
          className={`${HEIGHTS[size]} ${COLORS[color]}`}
        />
      </div>
    );
  },
});
