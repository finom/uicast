import { createComponentImplementation } from "@uicast/react";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";
import { busy, cn } from "../../lib/utils";
import { GanttChartDef } from "./def";

const STICKY = "sticky left-0 z-10 bg-background px-3 py-2";

export const GanttChartImpl = createComponentImplementation({
  def: GanttChartDef,
  render: ({ tasks, totalUnits }, { entry, loading }) => {
    const units = Array.from({ length: totalUnits }, (_, i) => i + 1);
    return (
      <ScrollArea
        className={cn("rounded-md border", busy(loading))}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className={cn(STICKY, "text-left font-medium min-w-38")}>Task</th>
              {units.map((unit) => (
                <th key={unit} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground min-w-7.5">
                  {unit}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, t) => {
              const color = task.color ? CHART_COLORS[task.color] : defaultChartColors[t % defaultChartColors.length];
              const first = task.start + 1;
              const last = task.start + task.duration;
              return (
                <tr key={t} className="border-b last:border-0">
                  <td className={cn(STICKY, "font-medium whitespace-nowrap")}>{task.name}</td>
                  {units.map((unit) => {
                    // This cell's share of the progress fill.
                    const progress = Math.min(
                      Math.max(((task.progress ?? 0) / 100) * task.duration - (unit - first), 0),
                      1,
                    );
                    return (
                      <td key={unit} className="px-0 py-2 relative">
                        {unit >= first && unit <= last && (
                          <div
                            className={cn(
                              "h-6 w-full",
                              unit === first && "rounded-l-md",
                              unit === last && "rounded-r-md",
                            )}
                            style={{ backgroundColor: color, opacity: 0.8 }}
                          >
                            {progress > 0 && (
                              <div
                                className={cn(
                                  "h-full",
                                  unit === first && "rounded-l-md",
                                  unit === last && progress === 1 && "rounded-r-md",
                                )}
                                // A same-color fill would be invisible under the bar's group opacity.
                                style={{ width: `${progress * 100}%`, backgroundColor: "rgb(0 0 0 / 0.25)" }}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: blockSkeleton(300),
});
