import type { ComponentDefinition } from "@uicast/core";
import { DataGridDef } from "../uicast-catalog/data-grid/def";
import { KanbanBoardDef } from "../uicast-catalog/kanban-board/def";
import { OrgChartDef } from "../uicast-catalog/org-chart/def";
import { TableDef } from "../uicast-catalog/table/def";
import { TableBodyDef } from "../uicast-catalog/table-body/def";
import { TableCellDef } from "../uicast-catalog/table-cell/def";
import { TableFooterDef } from "../uicast-catalog/table-footer/def";
import { TableHeadDef } from "../uicast-catalog/table-head/def";
import { TableHeaderDef } from "../uicast-catalog/table-header/def";
import { TableRowDef } from "../uicast-catalog/table-row/def";
import { VirtualListDef } from "../uicast-catalog/virtual-list/def";

export {
  DataGridDef,
  KanbanBoardDef,
  OrgChartDef,
  TableDef,
  TableBodyDef,
  TableCellDef,
  TableFooterDef,
  TableHeadDef,
  TableHeaderDef,
  TableRowDef,
  VirtualListDef,
};

export const defs: ComponentDefinition[] = [
  DataGridDef,
  KanbanBoardDef,
  OrgChartDef,
  TableDef,
  TableBodyDef,
  TableCellDef,
  TableFooterDef,
  TableHeadDef,
  TableHeaderDef,
  TableRowDef,
  VirtualListDef,
];
