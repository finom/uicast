import { createComponentImplementation } from "@uicast/react";
import { Table as ShadcnTable, TableBody } from "../../components/ui/table";
import { SKELETON_ROWS, tableSkeleton } from "../../lib/table-skeleton";
import { busyClass } from "../../lib/utils";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children }, { entry, busy }) => (
    // Off-screen tables skip layout and paint; the intrinsic size keeps the scroll height until the first render.
    <div className="[content-visibility:auto] [contain-intrinsic-size:auto_24rem]" data-key={entry.key}>
      <ShadcnTable className={busyClass(busy)} aria-busy={busy || undefined}>
        {children}
      </ShadcnTable>
    </div>
  ),
  skeleton: tableSkeleton(ShadcnTable, <TableBody>{SKELETON_ROWS}</TableBody>),
});
