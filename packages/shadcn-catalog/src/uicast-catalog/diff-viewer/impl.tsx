import { createComponentImplementation } from "@uicast/react";
import { diffLines } from "diff";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { blockSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { DiffViewerDef } from "./def";

type Row = { type: "unchanged" | "added" | "removed"; line: string; oldLineNum?: number; newLineNum?: number };

const MARKERS = { added: "+", removed: "-", unchanged: " " };
const TONES = {
  added: "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
  removed: "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
  unchanged: "",
};
const TITLE = "border-b px-4 py-2 bg-muted text-xs font-medium";

function computeLineDiff(oldText: string, newText: string): Row[] {
  const rows: Row[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  for (const change of diffLines(oldText, newText)) {
    const lines = change.value.split("\n");
    // A trailing newline yields one empty tail segment — not a real line.
    if (lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      if (change.added) rows.push({ type: "added", line, newLineNum: newLineNum++ });
      else if (change.removed) rows.push({ type: "removed", line, oldLineNum: oldLineNum++ });
      else rows.push({ type: "unchanged", line, oldLineNum: oldLineNum++, newLineNum: newLineNum++ });
    }
  }
  return rows;
}

// One side of the split view: its own lines, numbered, with its own change highlighted.
const Side = ({ title, rows, side }: { title: string; rows: Row[]; side: "old" | "new" }) => (
  <div className={side === "old" ? "border-r" : undefined}>
    <div className={TITLE}>{title}</div>
    {rows.map((row, i) => (
      <div
        key={i}
        className={cn(
          "px-4 py-0.5 font-mono text-sm border-b last:border-0",
          row.type === (side === "old" ? "removed" : "added") && TONES[row.type],
        )}
      >
        <span className="inline-block w-8 text-muted-foreground text-right mr-2 select-none text-xs">
          {side === "old" ? row.oldLineNum : row.newLineNum}
        </span>
        {row.line}
      </div>
    ))}
  </div>
);

export const DiffViewerImpl = createComponentImplementation({
  def: DiffViewerDef,
  render: ({ oldText, newText, oldTitle, newTitle, mode }, { entry }) => {
    const diff = computeLineDiff(oldText, newText);
    return mode === "unified" ? (
      <ScrollArea className="rounded-md border font-mono text-sm" data-key={entry.key}>
        <div className={TITLE}>
          {oldTitle} → {newTitle}
        </div>
        {diff.map((row, i) => (
          <div key={i} className={cn("px-4 py-0.5 border-b last:border-0", TONES[row.type])}>
            <span className="inline-block w-6 text-muted-foreground select-none">{MARKERS[row.type]}</span>
            {row.line}
          </div>
        ))}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    ) : (
      <ScrollArea className="rounded-md border" data-key={entry.key}>
        <div className="grid grid-cols-2 gap-0">
          <Side title={oldTitle} rows={diff.filter((row) => row.type !== "added")} side="old" />
          <Side title={newTitle} rows={diff.filter((row) => row.type !== "removed")} side="new" />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: blockSkeleton(240),
});
