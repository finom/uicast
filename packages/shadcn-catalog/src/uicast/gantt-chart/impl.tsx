import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { GanttChartDef } from "./def";

const defaultColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
];

export const GanttChartImpl = createComponentImplementation({
  def: GanttChartDef,
  render: ({
    tasks = [],
    totalUnits = 20,
    generatedKey,
  }) => {
    const unitHeaders = Array.from({ length: totalUnits }, (_, i) => i + 1);

    return (
      <ScrollArea className="rounded-md border" data-key={generatedKey}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium min-w-[150px]">
                Task
              </th>
              {unitHeaders.map((u) => (
                <th
                  key={u}
                  className="px-1 py-2 text-center text-xs font-medium text-muted-foreground min-w-[30px]"
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
                    task.color ?? defaultColors[ti % defaultColors.length];

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
                          {task.progress !== undefined && isStart && (
                            <div
                              className="h-full rounded-l-md"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: barColor,
                                opacity: 1,
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
});
