import type { ComponentImplementation } from "@uicast/react";
import { BarChartImpl } from "../uicast-catalog/bar-chart/impl";
import { FunnelChartImpl } from "../uicast-catalog/funnel-chart/impl";
import { GanttChartImpl } from "../uicast-catalog/gantt-chart/impl";
import { GaugeChartImpl } from "../uicast-catalog/gauge-chart/impl";
import { HeatmapImpl } from "../uicast-catalog/heatmap/impl";
import { LineChartImpl } from "../uicast-catalog/line-chart/impl";
import { PieChartImpl } from "../uicast-catalog/pie-chart/impl";
import { RadarChartImpl } from "../uicast-catalog/radar-chart/impl";
import { ScatterChartImpl } from "../uicast-catalog/scatter-chart/impl";
import { SparklineImpl } from "../uicast-catalog/sparkline/impl";
import { TreemapChartImpl } from "../uicast-catalog/treemap-chart/impl";
import { WaterfallChartImpl } from "../uicast-catalog/waterfall-chart/impl";

export {
  BarChartImpl,
  FunnelChartImpl,
  GanttChartImpl,
  GaugeChartImpl,
  HeatmapImpl,
  LineChartImpl,
  PieChartImpl,
  RadarChartImpl,
  ScatterChartImpl,
  SparklineImpl,
  TreemapChartImpl,
  WaterfallChartImpl,
};

export const impls: ComponentImplementation[] = [
  BarChartImpl,
  FunnelChartImpl,
  GanttChartImpl,
  GaugeChartImpl,
  HeatmapImpl,
  LineChartImpl,
  PieChartImpl,
  RadarChartImpl,
  ScatterChartImpl,
  SparklineImpl,
  TreemapChartImpl,
  WaterfallChartImpl,
];
