// A subset of the catalog: enough to build a page, no more. The prompt a host
// assembles from these is about a quarter the size of the whole catalog's.

import { CardDef } from "./uicast-catalog/card/def";
import { FlexRowDef } from "./uicast-catalog/flex-row/def";
import { FlexColDef } from "./uicast-catalog/flex-col/def";
import { GridDef } from "./uicast-catalog/grid/def";
import { HeadingDef } from "./uicast-catalog/heading/def";
import { TextDef } from "./uicast-catalog/text/def";
import { BadgeDef } from "./uicast-catalog/badge/def";
import { StatDef } from "./uicast-catalog/stat/def";
import { TableDef } from "./uicast-catalog/table/def";
import { TableHeaderDef } from "./uicast-catalog/table-header/def";
import { TableBodyDef } from "./uicast-catalog/table-body/def";
import { TableRowDef } from "./uicast-catalog/table-row/def";
import { TableHeadDef } from "./uicast-catalog/table-head/def";
import { TableCellDef } from "./uicast-catalog/table-cell/def";
import { InputDef } from "./uicast-catalog/input/def";
import { NumberInputDef } from "./uicast-catalog/number-input/def";
import { SelectDef } from "./uicast-catalog/select/def";
import { CheckboxDef } from "./uicast-catalog/checkbox/def";
import { SwitchDef } from "./uicast-catalog/switch/def";
import { SearchInputDef } from "./uicast-catalog/search-input/def";
import { ButtonDef } from "./uicast-catalog/button/def";
import { IconButtonDef } from "./uicast-catalog/icon-button/def";
import { BarChartDef } from "./uicast-catalog/bar-chart/def";
import { LineChartDef } from "./uicast-catalog/line-chart/def";
import { PieChartDef } from "./uicast-catalog/pie-chart/def";
import { AlertDef } from "./uicast-catalog/alert/def";
import { EmptyStateDef } from "./uicast-catalog/empty-state/def";
import { ModalDef } from "./uicast-catalog/modal/def";
import { DescriptionListDef } from "./uicast-catalog/description-list/def";
import { PaginationDef } from "./uicast-catalog/pagination/def";

export const defs = [
  CardDef,
  FlexRowDef,
  FlexColDef,
  GridDef,
  HeadingDef,
  TextDef,
  BadgeDef,
  StatDef,
  TableDef,
  TableHeaderDef,
  TableBodyDef,
  TableRowDef,
  TableHeadDef,
  TableCellDef,
  InputDef,
  NumberInputDef,
  SelectDef,
  CheckboxDef,
  SwitchDef,
  SearchInputDef,
  ButtonDef,
  IconButtonDef,
  BarChartDef,
  LineChartDef,
  PieChartDef,
  AlertDef,
  EmptyStateDef,
  ModalDef,
  DescriptionListDef,
  PaginationDef,
];
