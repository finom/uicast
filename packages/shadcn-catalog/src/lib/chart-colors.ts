import z from "zod";

// The palette a document may name. Hex, not a CSS variable: Recharts writes these into SVG attributes,
// where `var(--x)` does not resolve. Series with no colour cycle through this order.
export const CHART_COLORS = {
	violet: "#8884d8",
	green: "#82ca9d",
	amber: "#ffc658",
	orange: "#ff7300",
	blue: "#0088fe",
	teal: "#00c49f",
	red: "#e45757",
	slate: "#94a3b8",
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

export const CHART_COLOR_NAMES = Object.keys(CHART_COLORS) as [ChartColor, ...ChartColor[]];

// `id` hoists the list into the prompt's shared types, so it is spelled out once.
export const chartColorSchema = z.enum(CHART_COLOR_NAMES).meta({ id: "ChartColor" });

// The cycle a chart uses when the document names no colours.
export const defaultChartColors: string[] = CHART_COLOR_NAMES.slice(0, 6).map((n) => CHART_COLORS[n]);
