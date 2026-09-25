import { createComponentImplementation } from "@uicast/react";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { HeatmapDef } from "./def";
import { CHART_COLORS } from "../../lib/chart-colors";
import { blockSkeleton } from "../../lib/skeletons";

// `hex` is one of CHART_COLORS: `#rrggbb`.
function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function interpolateColor(min: string, max: string, t: number) {
  const c1 = hexToRgb(min);
  const c2 = hexToRgb(max);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const HeatmapImpl = createComponentImplementation({
  def: HeatmapDef,
  render: ({ data, rows, cols, minColor, maxColor, showValues }, { entry }) => {
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const valueMap = new Map<string, number>();
    for (const d of data) valueMap.set(`${d.row}|${d.col}`, d.value);

    return (
      <ScrollArea data-key={entry.key}>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2" />
              {cols.map((col) => (
                <th
                  key={col}
                  className="p-2 text-xs font-medium text-muted-foreground text-center"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="p-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {row}
                </td>
                {cols.map((col) => {
                  const val = valueMap.get(`${row}|${col}`) ?? 0;
                  const t = (val - minVal) / range;
                  const bg = interpolateColor(CHART_COLORS[minColor], CHART_COLORS[maxColor], t);
                  return (
                    <td
                      key={col}
                      className="p-2 text-center text-xs border"
                      style={{
                        backgroundColor: bg,
                        color: t > 0.5 ? "#fff" : "#000",
                        minWidth: 40,
                      }}
                    >
                      {showValues ? val : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
  skeleton: blockSkeleton(300),
});
