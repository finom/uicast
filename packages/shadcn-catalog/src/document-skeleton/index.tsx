import type { ComponentEntry } from "@uicast/core";
import type { ReactElement } from "react";
import { cn } from "../lib/utils";

// A document's shape before anything runs. Literal props are known from the
// entries themselves; expression props are not, so they become bars. Nothing
// is evaluated here — no expressions, no host functions, no scopes.

// How a component fills space. A number is a block of that pixel height.
// Only components that occupy area need an entry: a child-bearing entry
// defaults to a stack, a leaf to a bar.
type Shape = "frame" | "stack" | "row" | "grid" | "table" | "stat" | "text" | number;

const SHAPES: Record<string, Shape> = {
  Card: "frame",
  Container: "frame",
  FormSection: "frame",
  PageHeader: "frame",
  Banner: "frame",
  Callout: "frame",
  Alert: "frame",
  Sidebar: "frame",
  FlexRow: "row",
  ButtonGroup: "row",
  Toolbar: "row",
  Breadcrumb: "row",
  SegmentedControl: "row",
  TabList: "row",
  FlexCol: "stack",
  Stack: "stack",
  Grid: "grid",
  Tabs: "stack",
  Accordion: "stack",
  AccordionItem: "stack",
  Collapsible: "stack",
  TabContent: "stack",
  List: "stack",
  Timeline: "stack",
  DescriptionList: "stack",
  Table: "table",
  DataGrid: 320,
  VirtualList: 320,
  KanbanBoard: 320,
  GanttChart: 320,
  OrgChart: 320,
  TreeView: 240,
  FlowDiagram: 300,
  Calendar: 300,
  Map: 300,
  CodeEditor: 240,
  DiffViewer: 240,
  Image: 200,
  VideoPlayer: 240,
  Carousel: 240,
  ChatThread: 320,
  MarkdownViewer: 160,
  Stat: "stat",
  Gauge: 160,
  GaugeChart: 160,
  CircularProgress: 120,
  Sparkline: 40,
  Heading: "text",
  Text: "text",
  Badge: "text",
  Button: "text",
  IconButton: "text",
  Label: "text",
  Link: "text",
  Tag: "text",
  StatusIndicator: "text",
  RelativeTime: "text",
  Divider: "text",
  Spacer: "text",
};

// Every chart draws the same way.
const CHART_HEIGHT = 220;
const isChart = (component: string) => component.endsWith("Chart");

// The props worth showing as text, in the order a component would use them.
const TEXT_KEYS = ["title", "heading", "label", "text", "children", "name", "placeholder"] as const;

function literalProps(entry: ComponentEntry): Record<string, unknown> {
  const source = entry.props;
  if (!source || !("literal" in source)) return {};
  const value = source.literal;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textOf(props: Record<string, unknown>, keys: readonly string[] = TEXT_KEYS): string | null {
  for (const key of keys) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function Bar({ className }: { className?: string }) {
  return <div className={cn("h-4 w-24 animate-pulse rounded bg-muted", className)} />;
}

function Block({ height }: { height: number }) {
  return <div className="animate-pulse rounded-md bg-muted" style={{ height }} />;
}

function TableRows() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 border-b pb-2">
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} className="h-3 flex-1" />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex gap-3">
          {[0, 1, 2, 3].map((cell) => (
            <Bar key={cell} className="h-3 flex-1 opacity-70" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Stat({ label }: { label: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {label ? <span className="truncate text-muted-foreground text-sm">{label}</span> : <Bar className="h-3 w-16" />}
      <Bar className="h-7 w-24" />
    </div>
  );
}

// A list renders this many rows: enough to read as a list, few enough to stay cheap.
const LIST_ROWS = 3;
const MAX_DEPTH = 12;

function Node({
  entry,
  byKey,
  seen,
  depth,
}: {
  entry: ComponentEntry;
  byKey: Map<string, ComponentEntry>;
  seen: Set<string>;
  depth: number;
}): ReactElement | null {
  if (depth > MAX_DEPTH || seen.has(entry.key)) return null;
  const nextSeen = new Set(seen).add(entry.key);
  const props = literalProps(entry);
  const shape = SHAPES[entry.component] ?? (isChart(entry.component) ? CHART_HEIGHT : entry.children?.length ? "stack" : "text");

  const children = (entry.children ?? [])
    .map((key) => byKey.get(key))
    .filter((child): child is ComponentEntry => child !== undefined)
    .map((child) => <Node key={child.key} entry={child} byKey={byKey} seen={nextSeen} depth={depth + 1} />);

  // A list repeats its subtree; one child rendered a few times reads as rows.
  const body = entry.each ? Array.from({ length: LIST_ROWS }, (_, row) => <div key={row}>{children}</div>) : children;

  if (typeof shape === "number") return <Block height={shape} />;

  switch (shape) {
    case "frame":
      return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          {textOf(props, ["title", "heading"]) ? (
            <span className="font-medium text-sm">{textOf(props, ["title", "heading"])}</span>
          ) : (
            <Bar className="h-4 w-40" />
          )}
          {typeof props.description === "string" && (
            <span className="text-muted-foreground text-xs">{props.description}</span>
          )}
          {body}
        </div>
      );
    case "row":
      return <div className="flex flex-wrap items-center gap-3">{body}</div>;
    case "grid":
      return <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">{body}</div>;
    case "stack":
      return <div className="flex flex-col gap-3">{body}</div>;
    case "table":
      return <TableRows />;
    case "stat":
      return <Stat label={textOf(props, ["label", "title"])} />;
    default: {
      const text = textOf(props);
      return text ? <span className="text-muted-foreground text-sm">{text}</span> : <Bar />;
    }
  }
}

/**
 * The document's shape while the renderer boots, built from the entries alone.
 * Throwaway markup: the real tree replaces it, so nothing has to match.
 */
export function DocumentSkeleton({ entries, className }: { entries: ComponentEntry[]; className?: string }): ReactElement | null {
  if (entries.length === 0) return null;
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const referenced = new Set(entries.flatMap((entry) => entry.children ?? []));
  const roots = entries.filter((entry) => !referenced.has(entry.key));

  return (
    <div aria-busy aria-hidden className={cn("flex flex-col gap-4", className)}>
      {roots.map((root) => (
        <Node key={root.key} entry={root} byKey={byKey} seen={new Set()} depth={0} />
      ))}
    </div>
  );
}
