import { createAIComponentDefs } from "ui-fired/core/render/createAIComponentDefs";

// Layout & Container
import { CardDef } from "../ai-components/Card/def";
import { FlexRowDef } from "../ai-components/FlexRow/def";
import { FlexColDef } from "../ai-components/FlexCol/def";
import { DividerDef } from "../ai-components/Divider/def";
import { AccordionDef } from "../ai-components/Accordion/def";
import { AccordionItemDef } from "../ai-components/AccordionItem/def";
import { DrawerDef } from "../ai-components/Drawer/def";
import { GridDef } from "../ai-components/Grid/def";
import { StackDef } from "../ai-components/Stack/def";
import { SpacerDef } from "../ai-components/Spacer/def";

// Typography & Display
import { HeadingDef } from "../ai-components/Heading/def";
import { TextDef } from "../ai-components/Text/def";
import { BadgeDef } from "../ai-components/Badge/def";
import { LabelDef } from "../ai-components/Label/def";
import { IconDef } from "../ai-components/Icon/def";
import { TagDef } from "../ai-components/Tag/def";
import { StatDef } from "../ai-components/Stat/def";

// Tabs
import { TabsDef } from "../ai-components/Tabs/def";
import { TabListDef } from "../ai-components/TabList/def";
import { TabTriggerDef } from "../ai-components/TabTrigger/def";
import { TabContentDef } from "../ai-components/TabContent/def";

// Feedback
import { AlertDef } from "../ai-components/Alert/def";
import { SkeletonDef } from "../ai-components/Skeleton/def";
import { EmptyStateDef } from "../ai-components/EmptyState/def";
import { ToastDef } from "../ai-components/Toast/def";
import { SpinnerDef } from "../ai-components/Spinner/def";

// Form
import { InputDef } from "../ai-components/Input/def";
import { TextareaDef } from "../ai-components/Textarea/def";
import { NumberInputDef } from "../ai-components/NumberInput/def";
import { SelectDef } from "../ai-components/Select/def";
import { MultiSelectDef } from "../ai-components/MultiSelect/def";
import { DatePickerDef } from "../ai-components/DatePicker/def";
import { DateRangePickerDef } from "../ai-components/DateRangePicker/def";
import { TimePickerDef } from "../ai-components/TimePicker/def";
import { CheckboxDef } from "../ai-components/Checkbox/def";
import { RadioDef } from "../ai-components/Radio/def";
import { SwitchDef } from "../ai-components/Switch/def";
import { FileUploadDef } from "../ai-components/FileUpload/def";
import { ColorPickerDef } from "../ai-components/ColorPicker/def";
import { ButtonDef } from "../ai-components/Button/def";
import { IconButtonDef } from "../ai-components/IconButton/def";
import { ButtonGroupDef } from "../ai-components/ButtonGroup/def";
import { FieldDef } from "../ai-components/Field/def";
import { FieldLabelDef } from "../ai-components/FieldLabel/def";
import { FieldDescriptionDef } from "../ai-components/FieldDescription/def";

// Overlay
import { ModalDef } from "../ai-components/Modal/def";
import { ConfirmDialogDef } from "../ai-components/ConfirmDialog/def";
import { DropdownMenuDef } from "../ai-components/DropdownMenu/def";
import { DropdownMenuItemDef } from "../ai-components/DropdownMenuItem/def";
import { PopoverDef } from "../ai-components/Popover/def";

// Data Display
import { ListDef } from "../ai-components/List/def";
import { DataGridDef } from "../ai-components/DataGrid/def";
import { AvatarDef } from "../ai-components/Avatar/def";
import { TooltipDef } from "../ai-components/Tooltip/def";
import { ProgressBarDef } from "../ai-components/ProgressBar/def";
import { ImageDef } from "../ai-components/Image/def";

// Table
import { TableDef } from "../ai-components/Table/def";
import { TableHeaderDef } from "../ai-components/TableHeader/def";
import { TableBodyDef } from "../ai-components/TableBody/def";
import { TableFooterDef } from "../ai-components/TableFooter/def";
import { TableRowDef } from "../ai-components/TableRow/def";
import { TableHeadDef } from "../ai-components/TableHead/def";
import { TableCellDef } from "../ai-components/TableCell/def";

// Navigation
import { PaginationDef } from "../ai-components/Pagination/def";
import { BreadcrumbDef } from "../ai-components/Breadcrumb/def";
import { StepperDef } from "../ai-components/Stepper/def";

// Charts
import { BarChartDef } from "../ai-components/BarChart/def";
import { LineChartDef } from "../ai-components/LineChart/def";
import { PieChartDef } from "../ai-components/PieChart/def";
import { AreaChartDef } from "../ai-components/AreaChart/def";
import { FunnelChartDef } from "../ai-components/FunnelChart/def";

// Navigation & Wayfinding (new)
import { SidebarDef } from "../ai-components/Sidebar/def";
import { NavigationMenuDef } from "../ai-components/NavigationMenu/def";
import { MenubarDef } from "../ai-components/Menubar/def";
import { CommandMenuDef } from "../ai-components/CommandMenu/def";
import { LinkDef } from "../ai-components/Link/def";
import { ContextMenuDef } from "../ai-components/ContextMenu/def";

// Form & Input (new)
import { ComboboxDef } from "../ai-components/Combobox/def";
import { SliderDef } from "../ai-components/Slider/def";
import { RangeSliderDef } from "../ai-components/RangeSlider/def";
import { PasswordInputDef } from "../ai-components/PasswordInput/def";
import { SearchInputDef } from "../ai-components/SearchInput/def";
import { PhoneInputDef } from "../ai-components/PhoneInput/def";
import { CurrencyInputDef } from "../ai-components/CurrencyInput/def";
import { MaskedInputDef } from "../ai-components/MaskedInput/def";
import { PinInputDef } from "../ai-components/PinInput/def";
import { TagInputDef } from "../ai-components/TagInput/def";
import { RatingDef } from "../ai-components/Rating/def";
import { RichTextEditorDef } from "../ai-components/RichTextEditor/def";
import { CodeEditorDef } from "../ai-components/CodeEditor/def";
import { SignaturePadDef } from "../ai-components/SignaturePad/def";
import { ToggleDef } from "../ai-components/Toggle/def";
import { ToggleGroupDef } from "../ai-components/ToggleGroup/def";
import { SegmentedControlDef } from "../ai-components/SegmentedControl/def";
import { FormSectionDef } from "../ai-components/FormSection/def";

// Layout & Structure (new)
import { ContainerDef } from "../ai-components/Container/def";
import { AspectRatioDef } from "../ai-components/AspectRatio/def";
import { ScrollAreaDef } from "../ai-components/ScrollArea/def";
import { CollapsibleDef } from "../ai-components/Collapsible/def";
import { ResizablePanelDef } from "../ai-components/ResizablePanel/def";
import { SheetDef } from "../ai-components/Sheet/def";
import { StickyHeaderDef } from "../ai-components/StickyHeader/def";
import { PageHeaderDef } from "../ai-components/PageHeader/def";
import { ToolbarDef } from "../ai-components/Toolbar/def";

// Data Display (new)
import { CalendarDef } from "../ai-components/Calendar/def";
import { TimelineDef } from "../ai-components/Timeline/def";
import { TreeViewDef } from "../ai-components/TreeView/def";
import { DescriptionListDef } from "../ai-components/DescriptionList/def";
import { CodeBlockDef } from "../ai-components/CodeBlock/def";
import { MarkdownViewerDef } from "../ai-components/MarkdownViewer/def";
import { AvatarGroupDef } from "../ai-components/AvatarGroup/def";
import { StatusIndicatorDef } from "../ai-components/StatusIndicator/def";
import { CarouselDef } from "../ai-components/Carousel/def";
import { CalloutDef } from "../ai-components/Callout/def";
import { KBDDef } from "../ai-components/KBD/def";
import { HighlightDef } from "../ai-components/Highlight/def";
import { RelativeTimeDef } from "../ai-components/RelativeTime/def";
import { TruncatedTextDef } from "../ai-components/TruncatedText/def";
import { CopyButtonDef } from "../ai-components/CopyButton/def";
import { QRCodeDef } from "../ai-components/QRCode/def";
import { BarcodeDef } from "../ai-components/Barcode/def";

// Charts (new)
import { ScatterChartDef } from "../ai-components/ScatterChart/def";
import { RadarChartDef } from "../ai-components/RadarChart/def";
import { DonutChartDef } from "../ai-components/DonutChart/def";
import { GaugeChartDef } from "../ai-components/GaugeChart/def";
import { SparklineDef } from "../ai-components/Sparkline/def";
import { HeatmapDef } from "../ai-components/Heatmap/def";
import { TreemapChartDef } from "../ai-components/TreemapChart/def";
import { WaterfallChartDef } from "../ai-components/WaterfallChart/def";
import { SankeyChartDef } from "../ai-components/SankeyChart/def";
import { ComboChartDef } from "../ai-components/ComboChart/def";
import { GanttChartDef } from "../ai-components/GanttChart/def";
import { BubbleChartDef } from "../ai-components/BubbleChart/def";

// Feedback & Status (new)
import { BannerDef } from "../ai-components/Banner/def";
import { InlineMessageDef } from "../ai-components/InlineMessage/def";
import { AlertDialogDef } from "../ai-components/AlertDialog/def";
import { CircularProgressDef } from "../ai-components/CircularProgress/def";
import { CountdownTimerDef } from "../ai-components/CountdownTimer/def";
import { NotificationBadgeDef } from "../ai-components/NotificationBadge/def";

// Specialized / Business-Specific (new)
import { KanbanBoardDef } from "../ai-components/KanbanBoard/def";
import { SortableListDef } from "../ai-components/SortableList/def";
import { VirtualListDef } from "../ai-components/VirtualList/def";
import { MapDef } from "../ai-components/Map/def";
import { OrgChartDef } from "../ai-components/OrgChart/def";
import { FlowDiagramDef } from "../ai-components/FlowDiagram/def";
import { ChatBubbleDef } from "../ai-components/ChatBubble/def";
import { VideoPlayerDef } from "../ai-components/VideoPlayer/def";
import { CronBuilderDef } from "../ai-components/CronBuilder/def";
import { FilterBuilderDef } from "../ai-components/FilterBuilder/def";
import { FormulaBarDef } from "../ai-components/FormulaBar/def";
import { DiffViewerDef } from "../ai-components/DiffViewer/def";

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
