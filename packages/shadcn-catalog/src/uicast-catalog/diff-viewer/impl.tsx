import { diffLines } from "diff";
import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { cn } from "../../lib/utils";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { DiffViewerDef } from "./def";

const MARKERS = { added: "+", removed: "-", unchanged: " " };

function computeLineDiff(oldText: string, newText: string) {
  const result: {
    type: "unchanged" | "added" | "removed";
    line: string;
    oldLineNum?: number;
    newLineNum?: number;
  }[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const change of diffLines(oldText, newText)) {
    const lines = change.value.split("\n");
    // A trailing newline yields one empty tail segment — not a real line.
    if (lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      if (change.added) {
        result.push({ type: "added", line, newLineNum: newLineNum++ });
      } else if (change.removed) {
        result.push({ type: "removed", line, oldLineNum: oldLineNum++ });
      } else {
        result.push({
          type: "unchanged",
          line,
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++,
        });
      }
    }
  }

  return result;
}

export const DiffViewerImpl = createComponentImplementation({
  def: DiffViewerDef,
  render: ({
    oldText,
    newText,
    oldTitle,
    newTitle,
    mode,
  }, { entry }) => {
    const diff = computeLineDiff(oldText, newText);

    if (mode === "unified") {
      return (
        <ScrollArea
          className="rounded-md border font-mono text-sm"
          data-key={entry.key}
        >
          <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
            {oldTitle} → {newTitle}
          </div>
          {diff.map((row, i) => (
            <div
              key={i}
              className={cn(
                "px-4 py-0.5 border-b last:border-0",
                row.type === "added" &&
                  "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
                row.type === "removed" &&
                  "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
              )}
            >
              <span className="inline-block w-6 text-muted-foreground select-none">
                {MARKERS[row.type]}
              </span>
              {row.line}
            </div>
          ))}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );
    }

    const oldDiffs = diff.filter((d) => d.type !== "added");
    const newDiffs = diff.filter((d) => d.type !== "removed");

    return (
      <ScrollArea className="rounded-md border" data-key={entry.key}>
        <div className="grid grid-cols-2 gap-0">
          <div className="border-r">
            <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
              {oldTitle}
            </div>
            {oldDiffs.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "px-4 py-0.5 font-mono text-sm border-b last:border-0",
                  row.type === "removed" &&
                    "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
                )}
              >
                <span className="inline-block w-8 text-muted-foreground text-right mr-2 select-none text-xs">
                  {row.oldLineNum}
                </span>
                {row.line}
              </div>
            ))}
          </div>
          <div>
            <div className="border-b px-4 py-2 bg-muted text-xs font-medium">
              {newTitle}
            </div>
            {newDiffs.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "px-4 py-0.5 font-mono text-sm border-b last:border-0",
                  row.type === "added" &&
                    "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
                )}
              >
                <span className="inline-block w-8 text-muted-foreground text-right mr-2 select-none text-xs">
                  {row.newLineNum}
                </span>
                {row.line}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: () => <Skeleton className="w-full" style={{ height: 240 }} />,
});
