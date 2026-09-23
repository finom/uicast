import z from "zod";

// Hex, not CSS variables: Recharts writes these into SVG attributes, where `var(--x)` does not resolve.
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

type ChartColor = keyof typeof CHART_COLORS;

// `id` hoists the list into the prompt's shared types.
export const chartColorSchema = z.enum(Object.keys(CHART_COLORS) as [ChartColor, ...ChartColor[]]).meta({ id: "ChartColor" });

const DEFAULT_CYCLE: ChartColor[] = ["violet", "green", "amber", "orange", "blue", "teal"];

export const defaultChartColors: string[] = DEFAULT_CYCLE.map((n) => CHART_COLORS[n]);
