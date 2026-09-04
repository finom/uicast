import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { cn, busy } from "../../lib/utils";
import { defaultChartColors } from "../../lib/chart-colors";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { GanttChartDef } from "./def";

export const GanttChartImpl = createComponentImplementation({
  def: GanttChartDef,
  render: ({
    tasks = [],
    totalUnits,
  }, { entry, loading }) => {
    const unitHeaders = Array.from({ length: totalUnits }, (_, i) => i + 1);

    return (
      <ScrollArea className={cn("rounded-md border", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium min-w-38">
                Task
              </th>
              {unitHeaders.map((u) => (
                <th
                  key={u}
                  className="px-1 py-2 text-center text-xs font-medium text-muted-foreground min-w-7.5"
                >
                  {u}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, ti) => (
              <tr key={ti} className="border-b last:border-0">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium whitespace-nowrap">
                  {task.name}
                </td>
                {unitHeaders.map((u) => {
                  const isInRange =
                    u >= task.start + 1 && u <= task.start + task.duration;
                  const isStart = u === task.start + 1;
                  const isEnd = u === task.start + task.duration;
                  const barColor =
                    task.color ??
                    defaultChartColors[ti % defaultChartColors.length];
                  // this cell's share of the progress fill: 1 before the
                  // boundary, fractional at it, 0 after
                  const progressFill = Math.min(
                    Math.max(
                      ((task.progress ?? 0) / 100) * task.duration -
                        (u - task.start - 1),
                      0,
                    ),
                    1,
                  );

                  return (
                    <td key={u} className="px-0 py-2 relative">
                      {isInRange && (
                        <div
                          className={cn(
                            "h-6 w-full",
                            isStart && "rounded-l-md",
                            isEnd && "rounded-r-md",
                          )}
                          style={{ backgroundColor: barColor, opacity: 0.8 }}
                        >
                          {task.progress !== undefined && progressFill > 0 && (
                            <div
                              className={cn(
                                "h-full",
                                isStart && "rounded-l-md",
                                isEnd && progressFill === 1 && "rounded-r-md",
                              )}
                              style={{
                                width: `${progressFill * 100}%`,
                                // darkens the bar; a same-color fill would be
                                // invisible under the bar's group opacity
                                backgroundColor: "rgb(0 0 0 / 0.25)",
                              }}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 300 }} />,
});
