import type { ComponentImplementation } from "@uicast/react";
import { AreaChartImpl } from "../uicast-catalog/area-chart/impl";
import { BarChartImpl } from "../uicast-catalog/bar-chart/impl";
import { BubbleChartImpl } from "../uicast-catalog/bubble-chart/impl";
import { ComboChartImpl } from "../uicast-catalog/combo-chart/impl";
import { FunnelChartImpl } from "../uicast-catalog/funnel-chart/impl";
import { GanttChartImpl } from "../uicast-catalog/gantt-chart/impl";
import { GaugeChartImpl } from "../uicast-catalog/gauge-chart/impl";
import { HeatmapImpl } from "../uicast-catalog/heatmap/impl";
import { LineChartImpl } from "../uicast-catalog/line-chart/impl";
import { PieChartImpl } from "../uicast-catalog/pie-chart/impl";
import { RadarChartImpl } from "../uicast-catalog/radar-chart/impl";
import { SankeyChartImpl } from "../uicast-catalog/sankey-chart/impl";
import { ScatterChartImpl } from "../uicast-catalog/scatter-chart/impl";
import { SparklineImpl } from "../uicast-catalog/sparkline/impl";
import { TreemapChartImpl } from "../uicast-catalog/treemap-chart/impl";
import { WaterfallChartImpl } from "../uicast-catalog/waterfall-chart/impl";

export {
  AreaChartImpl,
  BarChartImpl,
  BubbleChartImpl,
  ComboChartImpl,
  FunnelChartImpl,
  GanttChartImpl,
  GaugeChartImpl,
  HeatmapImpl,
  LineChartImpl,
  PieChartImpl,
  RadarChartImpl,
  SankeyChartImpl,
  ScatterChartImpl,
  SparklineImpl,
  TreemapChartImpl,
  WaterfallChartImpl,
};

export const impls: ComponentImplementation[] = [
  AreaChartImpl,
  BarChartImpl,
  BubbleChartImpl,
  ComboChartImpl,
  FunnelChartImpl,
  GanttChartImpl,
  GaugeChartImpl,
  HeatmapImpl,
  LineChartImpl,
  PieChartImpl,
  RadarChartImpl,
  SankeyChartImpl,
  ScatterChartImpl,
  SparklineImpl,
  TreemapChartImpl,
  WaterfallChartImpl,
];
