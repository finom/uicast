import { createComponentImplementation } from "@uicast/react";
import { useRef } from "react";
import { Table as ShadcnTable, TableBody } from "../../components/ui/table";
import { tableToRows } from "../../lib/csv";
import { CSV_HOST, DownloadCsvButton } from "../../lib/download-button";
import { SKELETON_ROWS, tableSkeleton } from "../../lib/table-skeleton";
import { busyClass, cn } from "../../lib/utils";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children }, { entry, busy }) => {
    const ref = useRef<HTMLDivElement>(null);
    const shown = () => {
      const table = ref.current?.querySelector("table");
      return table ? tableToRows(table) : [];
    };
    return (
      // Off-screen tables skip layout and paint; the intrinsic size keeps the scroll height until the first render.
      <div
        ref={ref}
        className={cn("[content-visibility:auto] [contain-intrinsic-size:auto_24rem]", CSV_HOST)}
        data-key={entry.key}
      >
        <ShadcnTable className={busyClass(busy)} aria-busy={busy || undefined}>
          {children}
        </ShadcnTable>
        <DownloadCsvButton name={entry.key} rows={shown} surface="background" />
      </div>
    );
  },
  skeleton: tableSkeleton(ShadcnTable, <TableBody>{SKELETON_ROWS}</TableBody>),
});
