import { createComponentImplementation } from "@ui-fired/react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { ArrowDown, ArrowRight } from "lucide-react";
import { FlowDiagramDef } from "./def";

export const FlowDiagramImpl = createComponentImplementation({
  def: FlowDiagramDef,
  render: ({
    nodes = [],
    edges = [],
    direction = "vertical",
    onNodeClick,
    generatedKey,
  }) => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const isVertical = direction === "vertical";

    const shapeClasses = {
      start:
        "rounded-full bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
      end: "rounded-full bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
      process: "rounded-lg bg-background border-border",
      decision:
        "rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 rotate-0",
    };

    return (
      <div
        className={cn(
          "flex items-center gap-2",
          isVertical ? "flex-col" : "flex-row flex-wrap",
        )}
        data-key={generatedKey}
      >
        {nodes.map((node, i) => {
          const edge = edges.find((e) => e.from === node.id);

          return (
            <div
              key={node.id}
              className={cn(
                "flex items-center gap-2",
                isVertical ? "flex-col" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center border-2 px-6 py-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow min-w-[120px] text-center",
                  shapeClasses[node.type ?? "process"],
                )}
                onClick={() =>
                  onNodeClick?.({ id: node.id, label: node.label })
                }
              >
                <span className="text-sm font-medium">{node.label}</span>
              </div>
              {i < nodes.length - 1 && edge && (
                <div
                  className={cn(
                    "flex items-center gap-1",
                    isVertical ? "flex-col" : "flex-row",
                  )}
                >
                  {edge.label && (
                    <span className="text-xs text-muted-foreground">
                      {edge.label}
                    </span>
                  )}
                  {isVertical ? (
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
});
