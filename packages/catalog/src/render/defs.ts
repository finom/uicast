import { createAIComponentDefs } from "@ui-fired/core/render/create-ai-component-defs";

// Layout & Container
import { CardDef } from "../ai-components/card/def";
import { FlexRowDef } from "../ai-components/flex-row/def";
import { FlexColDef } from "../ai-components/flex-col/def";
import { DividerDef } from "../ai-components/divider/def";
import { AccordionDef } from "../ai-components/accordion/def";
import { AccordionItemDef } from "../ai-components/accordion-item/def";
import { DrawerDef } from "../ai-components/drawer/def";
import { GridDef } from "../ai-components/grid/def";
import { StackDef } from "../ai-components/stack/def";
import { SpacerDef } from "../ai-components/spacer/def";

// Typography & Display
import { HeadingDef } from "../ai-components/heading/def";
import { TextDef } from "../ai-components/text/def";
import { BadgeDef } from "../ai-components/badge/def";
import { LabelDef } from "../ai-components/label/def";
import { IconDef } from "../ai-components/icon/def";
import { TagDef } from "../ai-components/tag/def";
import { StatDef } from "../ai-components/stat/def";

// Tabs
import { TabsDef } from "../ai-components/tabs/def";
import { TabListDef } from "../ai-components/tab-list/def";
import { TabTriggerDef } from "../ai-components/tab-trigger/def";
import { TabContentDef } from "../ai-components/tab-content/def";

// Feedback
import { AlertDef } from "../ai-components/alert/def";
import { SkeletonDef } from "../ai-components/skeleton/def";
import { EmptyStateDef } from "../ai-components/empty-state/def";
import { ToastDef } from "../ai-components/toast/def";
import { SpinnerDef } from "../ai-components/spinner/def";

// Form
import { InputDef } from "../ai-components/input/def";
import { TextareaDef } from "../ai-components/textarea/def";
import { NumberInputDef } from "../ai-components/number-input/def";
import { SelectDef } from "../ai-components/select/def";
import { MultiSelectDef } from "../ai-components/multi-select/def";
import { DatePickerDef } from "../ai-components/date-picker/def";
import { DateRangePickerDef } from "../ai-components/date-range-picker/def";
import { TimePickerDef } from "../ai-components/time-picker/def";
import { CheckboxDef } from "../ai-components/checkbox/def";
import { RadioDef } from "../ai-components/radio/def";
import { SwitchDef } from "../ai-components/switch/def";
import { FileUploadDef } from "../ai-components/file-upload/def";
import { ColorPickerDef } from "../ai-components/color-picker/def";
import { ButtonDef } from "../ai-components/button/def";
import { IconButtonDef } from "../ai-components/icon-button/def";
import { ButtonGroupDef } from "../ai-components/button-group/def";
import { FieldDef } from "../ai-components/field/def";
import { FieldLabelDef } from "../ai-components/field-label/def";
import { FieldDescriptionDef } from "../ai-components/field-description/def";

// Overlay
import { ModalDef } from "../ai-components/modal/def";
import { ConfirmDialogDef } from "../ai-components/confirm-dialog/def";
import { DropdownMenuDef } from "../ai-components/dropdown-menu/def";
import { DropdownMenuItemDef } from "../ai-components/dropdown-menu-item/def";
import { PopoverDef } from "../ai-components/popover/def";

// Data Display
import { ListDef } from "../ai-components/list/def";
import { DataGridDef } from "../ai-components/data-grid/def";
import { AvatarDef } from "../ai-components/avatar/def";
import { TooltipDef } from "../ai-components/tooltip/def";
import { ProgressBarDef } from "../ai-components/progress-bar/def";
import { ImageDef } from "../ai-components/image/def";

// Table
import { TableDef } from "../ai-components/table/def";
import { TableHeaderDef } from "../ai-components/table-header/def";
import { TableBodyDef } from "../ai-components/table-body/def";
import { TableFooterDef } from "../ai-components/table-footer/def";
import { TableRowDef } from "../ai-components/table-row/def";
import { TableHeadDef } from "../ai-components/table-head/def";
import { TableCellDef } from "../ai-components/table-cell/def";

// Navigation
import { PaginationDef } from "../ai-components/pagination/def";
import { BreadcrumbDef } from "../ai-components/breadcrumb/def";
import { StepperDef } from "../ai-components/stepper/def";

// Charts
import { BarChartDef } from "../ai-components/bar-chart/def";
import { LineChartDef } from "../ai-components/line-chart/def";
import { PieChartDef } from "../ai-components/pie-chart/def";
import { AreaChartDef } from "../ai-components/area-chart/def";
import { FunnelChartDef } from "../ai-components/funnel-chart/def";

// Navigation & Wayfinding (new)
import { SidebarDef } from "../ai-components/sidebar/def";
import { NavigationMenuDef } from "../ai-components/navigation-menu/def";
import { MenubarDef } from "../ai-components/menubar/def";
import { CommandMenuDef } from "../ai-components/command-menu/def";
import { LinkDef } from "../ai-components/link/def";
import { ContextMenuDef } from "../ai-components/context-menu/def";

// Form & Input (new)
import { ComboboxDef } from "../ai-components/combobox/def";
import { SliderDef } from "../ai-components/slider/def";
import { RangeSliderDef } from "../ai-components/range-slider/def";
import { PasswordInputDef } from "../ai-components/password-input/def";
import { SearchInputDef } from "../ai-components/search-input/def";
import { PhoneInputDef } from "../ai-components/phone-input/def";
import { CurrencyInputDef } from "../ai-components/currency-input/def";
import { MaskedInputDef } from "../ai-components/masked-input/def";
import { PinInputDef } from "../ai-components/pin-input/def";
import { TagInputDef } from "../ai-components/tag-input/def";
import { RatingDef } from "../ai-components/rating/def";
import { RichTextEditorDef } from "../ai-components/rich-text-editor/def";
import { CodeEditorDef } from "../ai-components/code-editor/def";
import { SignaturePadDef } from "../ai-components/signature-pad/def";
import { ToggleDef } from "../ai-components/toggle/def";
import { ToggleGroupDef } from "../ai-components/toggle-group/def";
import { SegmentedControlDef } from "../ai-components/segmented-control/def";
import { FormSectionDef } from "../ai-components/form-section/def";

// Layout & Structure (new)
import { ContainerDef } from "../ai-components/container/def";
import { AspectRatioDef } from "../ai-components/aspect-ratio/def";
import { ScrollAreaDef } from "../ai-components/scroll-area/def";
import { CollapsibleDef } from "../ai-components/collapsible/def";
import { ResizablePanelDef } from "../ai-components/resizable-panel/def";
import { SheetDef } from "../ai-components/sheet/def";
import { StickyHeaderDef } from "../ai-components/sticky-header/def";
import { PageHeaderDef } from "../ai-components/page-header/def";
import { ToolbarDef } from "../ai-components/toolbar/def";

// Data Display (new)
import { CalendarDef } from "../ai-components/calendar/def";
import { TimelineDef } from "../ai-components/timeline/def";
import { TreeViewDef } from "../ai-components/tree-view/def";
import { DescriptionListDef } from "../ai-components/description-list/def";
import { CodeBlockDef } from "../ai-components/code-block/def";
import { MarkdownViewerDef } from "../ai-components/markdown-viewer/def";
import { AvatarGroupDef } from "../ai-components/avatar-group/def";
import { StatusIndicatorDef } from "../ai-components/status-indicator/def";
import { CarouselDef } from "../ai-components/carousel/def";
import { CalloutDef } from "../ai-components/callout/def";
import { KBDDef } from "../ai-components/kbd/def";
import { HighlightDef } from "../ai-components/highlight/def";
import { RelativeTimeDef } from "../ai-components/relative-time/def";
import { TruncatedTextDef } from "../ai-components/truncated-text/def";
import { CopyButtonDef } from "../ai-components/copy-button/def";
import { QRCodeDef } from "../ai-components/qr-code/def";
import { BarcodeDef } from "../ai-components/barcode/def";

// Charts (new)
import { ScatterChartDef } from "../ai-components/scatter-chart/def";
import { RadarChartDef } from "../ai-components/radar-chart/def";
import { DonutChartDef } from "../ai-components/donut-chart/def";
import { GaugeChartDef } from "../ai-components/gauge-chart/def";
import { SparklineDef } from "../ai-components/sparkline/def";
import { HeatmapDef } from "../ai-components/heatmap/def";
import { TreemapChartDef } from "../ai-components/treemap-chart/def";
import { WaterfallChartDef } from "../ai-components/waterfall-chart/def";
import { SankeyChartDef } from "../ai-components/sankey-chart/def";
import { ComboChartDef } from "../ai-components/combo-chart/def";
import { GanttChartDef } from "../ai-components/gantt-chart/def";
import { BubbleChartDef } from "../ai-components/bubble-chart/def";

// Feedback & Status (new)
import { BannerDef } from "../ai-components/banner/def";
import { InlineMessageDef } from "../ai-components/inline-message/def";
import { AlertDialogDef } from "../ai-components/alert-dialog/def";
import { CircularProgressDef } from "../ai-components/circular-progress/def";
import { CountdownTimerDef } from "../ai-components/countdown-timer/def";
import { NotificationBadgeDef } from "../ai-components/notification-badge/def";

// Specialized / Business-Specific (new)
import { KanbanBoardDef } from "../ai-components/kanban-board/def";
import { SortableListDef } from "../ai-components/sortable-list/def";
import { VirtualListDef } from "../ai-components/virtual-list/def";
import { MapDef } from "../ai-components/map/def";
import { OrgChartDef } from "../ai-components/org-chart/def";
import { FlowDiagramDef } from "../ai-components/flow-diagram/def";
import { ChatBubbleDef } from "../ai-components/chat-bubble/def";
import { VideoPlayerDef } from "../ai-components/video-player/def";
import { CronBuilderDef } from "../ai-components/cron-builder/def";
import { FilterBuilderDef } from "../ai-components/filter-builder/def";
import { FormulaBarDef } from "../ai-components/formula-bar/def";
import { DiffViewerDef } from "../ai-components/diff-viewer/def";

export const componentDefs = createAIComponentDefs([
  // Layout & Container
  CardDef,
  FlexRowDef,
  FlexColDef,
  DividerDef,
  AccordionDef,
  AccordionItemDef,
  DrawerDef,
  GridDef,
  StackDef,
  SpacerDef,
  // Typography & Display
  HeadingDef,
  TextDef,
  BadgeDef,
  LabelDef,
  IconDef,
  TagDef,
  StatDef,
  // Tabs
  TabsDef,
  TabListDef,
  TabTriggerDef,
  TabContentDef,
  // Feedback
  AlertDef,
  SkeletonDef,
  EmptyStateDef,
  ToastDef,
  SpinnerDef,
  // Form
  InputDef,
  TextareaDef,
  NumberInputDef,
  SelectDef,
  MultiSelectDef,
  DatePickerDef,
  DateRangePickerDef,
  TimePickerDef,
  CheckboxDef,
  RadioDef,
  SwitchDef,
  FileUploadDef,
  ColorPickerDef,
  ButtonDef,
  IconButtonDef,
  ButtonGroupDef,
  FieldDef,
  FieldLabelDef,
  FieldDescriptionDef,
  // Overlay
  ModalDef,
  ConfirmDialogDef,
  DropdownMenuDef,
  DropdownMenuItemDef,
  PopoverDef,
  // Data Display
  ListDef,
  DataGridDef,
  AvatarDef,
  TooltipDef,
  ProgressBarDef,
  ImageDef,
  // Table
  TableDef,
  TableHeaderDef,
  TableBodyDef,
  TableFooterDef,
  TableRowDef,
  TableHeadDef,
  TableCellDef,
  // Navigation
  PaginationDef,
  BreadcrumbDef,
  StepperDef,
  // Charts
  BarChartDef,
  LineChartDef,
  PieChartDef,
  AreaChartDef,
  FunnelChartDef,
  // Navigation & Wayfinding (new)
  SidebarDef,
  NavigationMenuDef,
  MenubarDef,
  CommandMenuDef,
  LinkDef,
  ContextMenuDef,
  // Form & Input (new)
  ComboboxDef,
  SliderDef,
  RangeSliderDef,
  PasswordInputDef,
  SearchInputDef,
  PhoneInputDef,
  CurrencyInputDef,
  MaskedInputDef,
  PinInputDef,
  TagInputDef,
  RatingDef,
  RichTextEditorDef,
  CodeEditorDef,
  SignaturePadDef,
  ToggleDef,
  ToggleGroupDef,
  SegmentedControlDef,
  FormSectionDef,
  // Layout & Structure (new)
  ContainerDef,
  AspectRatioDef,
  ScrollAreaDef,
  CollapsibleDef,
  ResizablePanelDef,
  SheetDef,
  StickyHeaderDef,
  PageHeaderDef,
  ToolbarDef,
  // Data Display (new)
  CalendarDef,
  TimelineDef,
  TreeViewDef,
  DescriptionListDef,
  CodeBlockDef,
  MarkdownViewerDef,
  AvatarGroupDef,
  StatusIndicatorDef,
  CarouselDef,
  CalloutDef,
  KBDDef,
  HighlightDef,
  RelativeTimeDef,
  TruncatedTextDef,
  CopyButtonDef,
  QRCodeDef,
  BarcodeDef,
  // Charts (new)
  ScatterChartDef,
  RadarChartDef,
  DonutChartDef,
  GaugeChartDef,
  SparklineDef,
  HeatmapDef,
  TreemapChartDef,
  WaterfallChartDef,
  SankeyChartDef,
  ComboChartDef,
  GanttChartDef,
  BubbleChartDef,
  // Feedback & Status (new)
  BannerDef,
  InlineMessageDef,
  AlertDialogDef,
  CircularProgressDef,
  CountdownTimerDef,
  NotificationBadgeDef,
  // Specialized / Business-Specific (new)
  KanbanBoardDef,
  SortableListDef,
  VirtualListDef,
  MapDef,
  OrgChartDef,
  FlowDiagramDef,
  ChatBubbleDef,
  VideoPlayerDef,
  CronBuilderDef,
  FilterBuilderDef,
  FormulaBarDef,
  DiffViewerDef,
]);
