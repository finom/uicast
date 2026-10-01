import { createComponentImplementation } from "@uicast/react";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { CHART_COLORS, defaultChartColors } from "../../lib/chart-colors";
import { BlockSkeleton } from "../../lib/skeletons";
import { busyClass, cn } from "../../lib/utils";
import { GanttChartDef } from "./def";

const STICKY = "sticky left-0 z-10 bg-background px-3 py-2";

export const GanttChartImpl = createComponentImplementation({
  def: GanttChartDef,
  render: ({ tasks, totalUnits }, { entry, busy }) => {
    const units = Array.from({ length: totalUnits }, (_, i) => i + 1);
    return (
      <ScrollArea
        className={cn("rounded-md border", busyClass(busy))}
        aria-busy={busy || undefined}
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
              // One cell spans the task, so the bar has no seams; a task past `totalUnits` is cut there.
              const from = Math.min(task.start, totalUnits);
              const span = Math.min(task.duration, totalUnits - from);
              return (
                <tr key={t} className="border-b last:border-0">
                  <td className={cn(STICKY, "font-medium whitespace-nowrap")}>{task.name}</td>
                  {units.slice(0, from).map((unit) => (
                    <td key={unit} />
                  ))}
                  {span > 0 && (
                    <td colSpan={span} className="px-0 py-2">
                      <div className="h-6 overflow-hidden rounded-md" style={{ backgroundColor: color, opacity: 0.8 }}>
                        <div
                          className="h-full"
                          // A same-color fill would be invisible under the bar's group opacity.
                          style={{ width: `${task.progress ?? 0}%`, backgroundColor: "rgb(0 0 0 / 0.25)" }}
                        />
                      </div>
                    </td>
                  )}
                  {units.slice(from + span).map((unit) => (
                    <td key={unit} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: () => <BlockSkeleton height={300} />,
});
