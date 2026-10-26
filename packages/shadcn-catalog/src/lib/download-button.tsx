import { Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "./utils";
import { downloadCsv } from "./csv";

// For the table's wrapper: the button is placed against it, and the first row's last cell leaves room for it.
export const CSV_HOST = "group/csv relative [&_table>:first-child>tr:first-child>:last-child]:pr-10";

// In the first row's right end, outside the horizontal scroll: a table that scrolls sideways slides under its fade.
// Shows on hover or focus where there is hover, always on touch screens.
export const DownloadCsvButton = ({
  name,
  rows,
  surface,
}: {
  name: string;
  rows: () => string[][];
  // The color behind the first row, so the button blends in.
  surface: "background" | "muted";
}) => (
  <div
    className={cn(
      "pointer-events-none absolute top-0 right-0 z-20 flex h-10 items-center pr-1 pl-5 opacity-0 transition-opacity group-hover/csv:opacity-100 group-focus-within/csv:opacity-100 [@media(hover:none)]:opacity-100",
      surface === "muted"
        ? "bg-[linear-gradient(to_right,transparent,var(--muted)_1rem)]"
        : "bg-[linear-gradient(to_right,transparent,var(--background)_1rem)]",
    )}
  >
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Download as CSV"
      title="Download as CSV"
      className="pointer-events-auto cursor-pointer text-muted-foreground"
      onClick={() => downloadCsv(name, rows())}
    >
      <Download />
    </Button>
  </div>
);
