import z from "zod";

// No prop takes a raw CSS length.
const WIDTHS = { xs: "4rem", sm: "8rem", md: "12rem", lg: "16rem", xl: "24rem", full: "100%", auto: "auto" } as const;
const HEIGHTS = { xs: "1rem", sm: "2rem", md: "4rem", lg: "8rem", xl: "16rem", full: "100%", auto: "auto" } as const;
// Never "auto": an unset column width already means auto.
const COLUMN_WIDTHS = { xs: "4rem", sm: "6rem", md: "8rem", lg: "12rem", xl: "16rem" } as const;

type WidthName = keyof typeof WIDTHS;
type HeightName = keyof typeof HEIGHTS;
type ColumnWidthName = keyof typeof COLUMN_WIDTHS;

export const width = (name: WidthName): string => WIDTHS[name];
export const height = (name: HeightName): string => HEIGHTS[name];
export const columnWidth = (name: ColumnWidthName): string => COLUMN_WIDTHS[name];

export const widthSchema = z.enum(Object.keys(WIDTHS) as [WidthName, ...WidthName[]]).meta({ id: "Width" });
export const heightSchema = z.enum(Object.keys(HEIGHTS) as [HeightName, ...HeightName[]]).meta({ id: "Height" });
export const columnWidthSchema = z
	.enum(Object.keys(COLUMN_WIDTHS) as [ColumnWidthName, ...ColumnWidthName[]])
	.meta({ id: "ColumnWidth" });
