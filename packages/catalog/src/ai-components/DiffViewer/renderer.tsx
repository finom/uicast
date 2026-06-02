import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { cn } from "ui-fired/core/lib/utils";
import { ScrollArea, ScrollBar } from "ui-fired/catalog/components/ui/scroll-area";
import { DiffViewerDef } from "./def";

function computeSimpleDiff(oldLines: string[], newLines: string[]) {
  const result: {
    type: "unchanged" | "added" | "removed";
    line: string;
    oldLineNum?: number;
    newLineNum?: number;
  }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let oldIdx = 0;
  let newIdx = 0;

  // Simple line-by-line comparison (not a full LCS algorithm but sufficient for display)
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (
      oldIdx < oldLines.length &&
      newIdx < newLines.length &&
      oldLines[oldIdx] === newLines[newIdx]
    ) {
      result.push({
        type: "unchanged",
        line: oldLines[oldIdx],
        oldLineNum: oldIdx + 1,
        newLineNum: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else if (
      oldIdx < oldLines.length &&
      (newIdx >= newLines.length || !newLines.includes(oldLines[oldIdx]))
    ) {
      result.push({
        type: "removed",
        line: oldLines[oldIdx],
        oldLineNum: oldIdx + 1,
      });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      result.push({
        type: "added",
        line: newLines[newIdx],
        newLineNum: newIdx + 1,
      });
      newIdx++;
    }
  }

  return result;
}

export const DiffViewerRenderer = createAIComponentRenderer({
  def: DiffViewerDef,
  renderer: ({
    oldText,
    newText,
    oldTitle = "Original",
    newTitle = "Modified",
    mode = "split",
    generatedKey,
  }) => {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const diff = computeSimpleDiff(oldLines, newLines);

    if (mode === "unified") {
      return (
        <ScrollArea
          className="rounded-md border font-mono text-sm"
          data-key={generatedKey}
        >
          <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
            {oldTitle} → {newTitle}
          </div>
          {diff.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "px-4 py-0.5 border-b last:border-0",
                entry.type === "added" &&
                  "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
                entry.type === "removed" &&
                  "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
              )}
            >
              <span className="inline-block w-6 text-muted-foreground select-none">
                {entry.type === "added"
                  ? "+"
                  : entry.type === "removed"
                    ? "-"
                    : " "}
              </span>
              {entry.line}
            </div>
          ))}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );
    }

    // Split mode
    const oldDiffs = diff.filter((d) => d.type !== "added");
    const newDiffs = diff.filter((d) => d.type !== "removed");

    return (
      <ScrollArea className="rounded-md border" data-key={generatedKey}>
        <div className="grid grid-cols-2 gap-0">
          <div className="border-r">
            <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
              {oldTitle}
            </div>
            {oldDiffs.map((entry, i) => (
              <div
                key={i}
                className={cn(
                  "px-4 py-0.5 font-mono text-sm border-b last:border-0",
                  entry.type === "removed" &&
                    "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
                )}
              >
                <span className="inline-block w-8 text-muted-foreground text-right mr-2 select-none text-xs">
                  {entry.oldLineNum ?? ""}
                </span>
                {entry.line}
              </div>
            ))}
          </div>
          <div>
            <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
              {newTitle}
            </div>
            {newDiffs.map((entry, i) => (
              <div
                key={i}
                className={cn(
                  "px-4 py-0.5 font-mono text-sm border-b last:border-0",
                  entry.type === "added" &&
                    "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
                )}
              >
                <span className="inline-block w-8 text-muted-foreground text-right mr-2 select-none text-xs">
                  {entry.newLineNum ?? ""}
                </span>
                {entry.line}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
});
