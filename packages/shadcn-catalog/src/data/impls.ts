import type { ComponentImplementation } from "@uicast/react";
import { DataGridImpl } from "../uicast-catalog/data-grid/impl";
import { KanbanBoardImpl } from "../uicast-catalog/kanban-board/impl";
import { OrgChartImpl } from "../uicast-catalog/org-chart/impl";
import { TableImpl } from "../uicast-catalog/table/impl";
import { TableBodyImpl } from "../uicast-catalog/table-body/impl";
import { TableCellImpl } from "../uicast-catalog/table-cell/impl";
import { TableFooterImpl } from "../uicast-catalog/table-footer/impl";
import { TableHeadImpl } from "../uicast-catalog/table-head/impl";
import { TableHeaderImpl } from "../uicast-catalog/table-header/impl";
import { TableRowImpl } from "../uicast-catalog/table-row/impl";
import { VirtualListImpl } from "../uicast-catalog/virtual-list/impl";

export {
  DataGridImpl,
  KanbanBoardImpl,
  OrgChartImpl,
  TableImpl,
  TableBodyImpl,
  TableCellImpl,
  TableFooterImpl,
  TableHeadImpl,
  TableHeaderImpl,
  TableRowImpl,
  VirtualListImpl,
};

export const impls: ComponentImplementation[] = [
  DataGridImpl,
  KanbanBoardImpl,
  OrgChartImpl,
  TableImpl,
  TableBodyImpl,
  TableCellImpl,
  TableFooterImpl,
  TableHeadImpl,
  TableHeaderImpl,
  TableRowImpl,
  VirtualListImpl,
];
