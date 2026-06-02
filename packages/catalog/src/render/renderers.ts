import { createAIComponentRenderers } from "ui-fired/core/render/createAIComponentRenderers";

// Layout & Container
import { CardRenderer } from "../ai-components/Card/renderer";
import { FlexRowRenderer } from "../ai-components/FlexRow/renderer";
import { FlexColRenderer } from "../ai-components/FlexCol/renderer";
import { DividerRenderer } from "../ai-components/Divider/renderer";
import { AccordionRenderer } from "../ai-components/Accordion/renderer";
import { AccordionItemRenderer } from "../ai-components/AccordionItem/renderer";
import { DrawerRenderer } from "../ai-components/Drawer/renderer";
import { GridRenderer } from "../ai-components/Grid/renderer";
import { StackRenderer } from "../ai-components/Stack/renderer";
import { SpacerRenderer } from "../ai-components/Spacer/renderer";

// Typography & Display
import { HeadingRenderer } from "../ai-components/Heading/renderer";
import { TextRenderer } from "../ai-components/Text/renderer";
import { BadgeRenderer } from "../ai-components/Badge/renderer";
import { LabelRenderer } from "../ai-components/Label/renderer";
import { IconRenderer } from "../ai-components/Icon/renderer";
import { TagRenderer } from "../ai-components/Tag/renderer";
import { StatRenderer } from "../ai-components/Stat/renderer";

// Tabs
import { TabsRenderer } from "../ai-components/Tabs/renderer";
import { TabListRenderer } from "../ai-components/TabList/renderer";
import { TabTriggerRenderer } from "../ai-components/TabTrigger/renderer";
import { TabContentRenderer } from "../ai-components/TabContent/renderer";

// Feedback
import { AlertRenderer } from "../ai-components/Alert/renderer";
import { SkeletonRenderer } from "../ai-components/Skeleton/renderer";
import { EmptyStateRenderer } from "../ai-components/EmptyState/renderer";
import { ToastRenderer } from "../ai-components/Toast/renderer";
import { SpinnerRenderer } from "../ai-components/Spinner/renderer";

// Form
import { InputRenderer } from "../ai-components/Input/renderer";
import { TextareaRenderer } from "../ai-components/Textarea/renderer";
import { NumberInputRenderer } from "../ai-components/NumberInput/renderer";
import { SelectRenderer } from "../ai-components/Select/renderer";
import { MultiSelectRenderer } from "../ai-components/MultiSelect/renderer";
import { DatePickerRenderer } from "../ai-components/DatePicker/renderer";
import { DateRangePickerRenderer } from "../ai-components/DateRangePicker/renderer";
import { TimePickerRenderer } from "../ai-components/TimePicker/renderer";
import { CheckboxRenderer } from "../ai-components/Checkbox/renderer";
import { RadioRenderer } from "../ai-components/Radio/renderer";
import { SwitchRenderer } from "../ai-components/Switch/renderer";
import { FileUploadRenderer } from "../ai-components/FileUpload/renderer";
import { ColorPickerRenderer } from "../ai-components/ColorPicker/renderer";
import { ButtonRenderer } from "../ai-components/Button/renderer";
import { IconButtonRenderer } from "../ai-components/IconButton/renderer";
import { ButtonGroupRenderer } from "../ai-components/ButtonGroup/renderer";
import { FieldRenderer } from "../ai-components/Field/renderer";
import { FieldLabelRenderer } from "../ai-components/FieldLabel/renderer";
import { FieldDescriptionRenderer } from "../ai-components/FieldDescription/renderer";

// Overlay
import { ModalRenderer } from "../ai-components/Modal/renderer";
import { ConfirmDialogRenderer } from "../ai-components/ConfirmDialog/renderer";
import { DropdownMenuRenderer } from "../ai-components/DropdownMenu/renderer";
import { DropdownMenuItemRenderer } from "../ai-components/DropdownMenuItem/renderer";
import { PopoverRenderer } from "../ai-components/Popover/renderer";

// Data Display
import { ListRenderer } from "../ai-components/List/renderer";
import { DataGridRenderer } from "../ai-components/DataGrid/renderer";
import { AvatarRenderer } from "../ai-components/Avatar/renderer";
import { TooltipRenderer } from "../ai-components/Tooltip/renderer";
import { ProgressBarRenderer } from "../ai-components/ProgressBar/renderer";
import { ImageRenderer } from "../ai-components/Image/renderer";

// Table
import { TableRenderer } from "../ai-components/Table/renderer";
import { TableHeaderRenderer } from "../ai-components/TableHeader/renderer";
import { TableBodyRenderer } from "../ai-components/TableBody/renderer";
import { TableFooterRenderer } from "../ai-components/TableFooter/renderer";
import { TableRowRenderer } from "../ai-components/TableRow/renderer";
import { TableHeadRenderer } from "../ai-components/TableHead/renderer";
import { TableCellRenderer } from "../ai-components/TableCell/renderer";

// Navigation
import { PaginationRenderer } from "../ai-components/Pagination/renderer";
import { BreadcrumbRenderer } from "../ai-components/Breadcrumb/renderer";
import { StepperRenderer } from "../ai-components/Stepper/renderer";

// Charts
import { BarChartRenderer } from "../ai-components/BarChart/renderer";
import { LineChartRenderer } from "../ai-components/LineChart/renderer";
import { PieChartRenderer } from "../ai-components/PieChart/renderer";
import { AreaChartRenderer } from "../ai-components/AreaChart/renderer";
import { FunnelChartRenderer } from "../ai-components/FunnelChart/renderer";

// Navigation & Wayfinding (new)
import { SidebarRenderer } from "../ai-components/Sidebar/renderer";
import { NavigationMenuRenderer } from "../ai-components/NavigationMenu/renderer";
import { MenubarRenderer } from "../ai-components/Menubar/renderer";
import { CommandMenuRenderer } from "../ai-components/CommandMenu/renderer";
import { LinkRenderer } from "../ai-components/Link/renderer";
import { ContextMenuRenderer } from "../ai-components/ContextMenu/renderer";

// Form & Input (new)
import { ComboboxRenderer } from "../ai-components/Combobox/renderer";
import { SliderRenderer } from "../ai-components/Slider/renderer";
import { RangeSliderRenderer } from "../ai-components/RangeSlider/renderer";
import { PasswordInputRenderer } from "../ai-components/PasswordInput/renderer";
import { SearchInputRenderer } from "../ai-components/SearchInput/renderer";
import { PhoneInputRenderer } from "../ai-components/PhoneInput/renderer";
import { CurrencyInputRenderer } from "../ai-components/CurrencyInput/renderer";
import { MaskedInputRenderer } from "../ai-components/MaskedInput/renderer";
import { PinInputRenderer } from "../ai-components/PinInput/renderer";
import { TagInputRenderer } from "../ai-components/TagInput/renderer";
import { RatingRenderer } from "../ai-components/Rating/renderer";
import { RichTextEditorRenderer } from "../ai-components/RichTextEditor/renderer";
import { CodeEditorRenderer } from "../ai-components/CodeEditor/renderer";
import { SignaturePadRenderer } from "../ai-components/SignaturePad/renderer";
import { ToggleRenderer } from "../ai-components/Toggle/renderer";
import { ToggleGroupRenderer } from "../ai-components/ToggleGroup/renderer";
import { SegmentedControlRenderer } from "../ai-components/SegmentedControl/renderer";
import { FormSectionRenderer } from "../ai-components/FormSection/renderer";

// Layout & Structure (new)
import { ContainerRenderer } from "../ai-components/Container/renderer";
import { AspectRatioRenderer } from "../ai-components/AspectRatio/renderer";
import { ScrollAreaRenderer } from "../ai-components/ScrollArea/renderer";
import { CollapsibleRenderer } from "../ai-components/Collapsible/renderer";
import { ResizablePanelRenderer } from "../ai-components/ResizablePanel/renderer";
import { SheetRenderer } from "../ai-components/Sheet/renderer";
import { StickyHeaderRenderer } from "../ai-components/StickyHeader/renderer";
import { PageHeaderRenderer } from "../ai-components/PageHeader/renderer";
import { ToolbarRenderer } from "../ai-components/Toolbar/renderer";

// Data Display (new)
import { CalendarRenderer } from "../ai-components/Calendar/renderer";
import { TimelineRenderer } from "../ai-components/Timeline/renderer";
import { TreeViewRenderer } from "../ai-components/TreeView/renderer";
import { DescriptionListRenderer } from "../ai-components/DescriptionList/renderer";
import { CodeBlockRenderer } from "../ai-components/CodeBlock/renderer";
import { MarkdownViewerRenderer } from "../ai-components/MarkdownViewer/renderer";
import { AvatarGroupRenderer } from "../ai-components/AvatarGroup/renderer";
import { StatusIndicatorRenderer } from "../ai-components/StatusIndicator/renderer";
import { CarouselRenderer } from "../ai-components/Carousel/renderer";
import { CalloutRenderer } from "../ai-components/Callout/renderer";
import { KBDRenderer } from "../ai-components/KBD/renderer";
import { HighlightRenderer } from "../ai-components/Highlight/renderer";
import { RelativeTimeRenderer } from "../ai-components/RelativeTime/renderer";
import { TruncatedTextRenderer } from "../ai-components/TruncatedText/renderer";
import { CopyButtonRenderer } from "../ai-components/CopyButton/renderer";
import { QRCodeRenderer } from "../ai-components/QRCode/renderer";
import { BarcodeRenderer } from "../ai-components/Barcode/renderer";

// Charts (new)
import { ScatterChartRenderer } from "../ai-components/ScatterChart/renderer";
import { RadarChartRenderer } from "../ai-components/RadarChart/renderer";
import { DonutChartRenderer } from "../ai-components/DonutChart/renderer";
import { GaugeChartRenderer } from "../ai-components/GaugeChart/renderer";
import { SparklineRenderer } from "../ai-components/Sparkline/renderer";
import { HeatmapRenderer } from "../ai-components/Heatmap/renderer";
import { TreemapChartRenderer } from "../ai-components/TreemapChart/renderer";
import { WaterfallChartRenderer } from "../ai-components/WaterfallChart/renderer";
import { SankeyChartRenderer } from "../ai-components/SankeyChart/renderer";
import { ComboChartRenderer } from "../ai-components/ComboChart/renderer";
import { GanttChartRenderer } from "../ai-components/GanttChart/renderer";
import { BubbleChartRenderer } from "../ai-components/BubbleChart/renderer";

// Feedback & Status (new)
import { BannerRenderer } from "../ai-components/Banner/renderer";
import { InlineMessageRenderer } from "../ai-components/InlineMessage/renderer";
import { AlertDialogRenderer } from "../ai-components/AlertDialog/renderer";
import { CircularProgressRenderer } from "../ai-components/CircularProgress/renderer";
import { CountdownTimerRenderer } from "../ai-components/CountdownTimer/renderer";
import { NotificationBadgeRenderer } from "../ai-components/NotificationBadge/renderer";

// Specialized / Business-Specific (new)
import { KanbanBoardRenderer } from "../ai-components/KanbanBoard/renderer";
import { SortableListRenderer } from "../ai-components/SortableList/renderer";
import { VirtualListRenderer } from "../ai-components/VirtualList/renderer";
import { MapRenderer } from "../ai-components/Map/renderer";
import { OrgChartRenderer } from "../ai-components/OrgChart/renderer";
import { FlowDiagramRenderer } from "../ai-components/FlowDiagram/renderer";
import { ChatBubbleRenderer } from "../ai-components/ChatBubble/renderer";
import { VideoPlayerRenderer } from "../ai-components/VideoPlayer/renderer";
import { CronBuilderRenderer } from "../ai-components/CronBuilder/renderer";
import { FilterBuilderRenderer } from "../ai-components/FilterBuilder/renderer";
import { FormulaBarRenderer } from "../ai-components/FormulaBar/renderer";
import { DiffViewerRenderer } from "../ai-components/DiffViewer/renderer";

export const componentRenderers = createAIComponentRenderers([
  // Layout & Container
  CardRenderer,
  FlexRowRenderer,
  FlexColRenderer,
  DividerRenderer,
  AccordionRenderer,
  AccordionItemRenderer,
  DrawerRenderer,
  GridRenderer,
  StackRenderer,
  SpacerRenderer,
  // Typography & Display
  HeadingRenderer,
  TextRenderer,
  BadgeRenderer,
  LabelRenderer,
  IconRenderer,
  TagRenderer,
  StatRenderer,
  // Tabs
  TabsRenderer,
  TabListRenderer,
  TabTriggerRenderer,
  TabContentRenderer,
  // Feedback
  AlertRenderer,
  SkeletonRenderer,
  EmptyStateRenderer,
  ToastRenderer,
  SpinnerRenderer,
  // Form
  InputRenderer,
  TextareaRenderer,
  NumberInputRenderer,
  SelectRenderer,
  MultiSelectRenderer,
  DatePickerRenderer,
  DateRangePickerRenderer,
  TimePickerRenderer,
  CheckboxRenderer,
  RadioRenderer,
  SwitchRenderer,
  FileUploadRenderer,
  ColorPickerRenderer,
  ButtonRenderer,
  IconButtonRenderer,
  ButtonGroupRenderer,
  FieldRenderer,
  FieldLabelRenderer,
  FieldDescriptionRenderer,
  // Overlay
  ModalRenderer,
  ConfirmDialogRenderer,
  DropdownMenuRenderer,
  DropdownMenuItemRenderer,
  PopoverRenderer,
  // Data Display
  ListRenderer,
  DataGridRenderer,
  AvatarRenderer,
  TooltipRenderer,
  ProgressBarRenderer,
  ImageRenderer,
  // Table
  TableRenderer,
  TableHeaderRenderer,
  TableBodyRenderer,
  TableFooterRenderer,
  TableRowRenderer,
  TableHeadRenderer,
  TableCellRenderer,
  // Navigation
  PaginationRenderer,
  BreadcrumbRenderer,
  StepperRenderer,
  // Charts
  BarChartRenderer,
  LineChartRenderer,
  PieChartRenderer,
  AreaChartRenderer,
  FunnelChartRenderer,
  // Navigation & Wayfinding (new)
  SidebarRenderer,
  NavigationMenuRenderer,
  MenubarRenderer,
  CommandMenuRenderer,
  LinkRenderer,
  ContextMenuRenderer,
  // Form & Input (new)
  ComboboxRenderer,
  SliderRenderer,
  RangeSliderRenderer,
  PasswordInputRenderer,
  SearchInputRenderer,
  PhoneInputRenderer,
  CurrencyInputRenderer,
  MaskedInputRenderer,
  PinInputRenderer,
  TagInputRenderer,
  RatingRenderer,
  RichTextEditorRenderer,
  CodeEditorRenderer,
  SignaturePadRenderer,
  ToggleRenderer,
  ToggleGroupRenderer,
  SegmentedControlRenderer,
  FormSectionRenderer,
  // Layout & Structure (new)
  ContainerRenderer,
  AspectRatioRenderer,
  ScrollAreaRenderer,
  CollapsibleRenderer,
  ResizablePanelRenderer,
  SheetRenderer,
  StickyHeaderRenderer,
  PageHeaderRenderer,
  ToolbarRenderer,
  // Data Display (new)
  CalendarRenderer,
  TimelineRenderer,
  TreeViewRenderer,
  DescriptionListRenderer,
  CodeBlockRenderer,
  MarkdownViewerRenderer,
  AvatarGroupRenderer,
  StatusIndicatorRenderer,
  CarouselRenderer,
  CalloutRenderer,
  KBDRenderer,
  HighlightRenderer,
  RelativeTimeRenderer,
  TruncatedTextRenderer,
  CopyButtonRenderer,
  QRCodeRenderer,
  BarcodeRenderer,
  // Charts (new)
  ScatterChartRenderer,
  RadarChartRenderer,
  DonutChartRenderer,
  GaugeChartRenderer,
  SparklineRenderer,
  HeatmapRenderer,
  TreemapChartRenderer,
  WaterfallChartRenderer,
  SankeyChartRenderer,
  ComboChartRenderer,
  GanttChartRenderer,
  BubbleChartRenderer,
  // Feedback & Status (new)
  BannerRenderer,
  InlineMessageRenderer,
  AlertDialogRenderer,
  CircularProgressRenderer,
  CountdownTimerRenderer,
  NotificationBadgeRenderer,
  // Specialized / Business-Specific (new)
  KanbanBoardRenderer,
  SortableListRenderer,
  VirtualListRenderer,
  MapRenderer,
  OrgChartRenderer,
  FlowDiagramRenderer,
  ChatBubbleRenderer,
  VideoPlayerRenderer,
  CronBuilderRenderer,
  FilterBuilderRenderer,
  FormulaBarRenderer,
  DiffViewerRenderer,
]);
