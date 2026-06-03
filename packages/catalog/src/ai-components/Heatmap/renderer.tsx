import { createAIComponentRenderer } from "@ui-fired/react";
import { ScrollArea, ScrollBar } from "@ui-fired/catalog/components/ui/scroll-area";
import { HeatmapDef } from "./def";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function interpolateColor(min: string, max: string, t: number) {
  const c1 = hexToRgb(min);
  const c2 = hexToRgb(max);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const HeatmapRenderer = createAIComponentRenderer({
  def: HeatmapDef,
  renderer: ({
    data = [],
    rows = [],
    cols = [],
    minColor = "#f0f9ff",
    maxColor = "#1e40af",
    showValues = true,
    generatedKey,
  }) => {
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const valueMap = new Map<string, number>();
    data.forEach((d) => valueMap.set(`${d.row}|${d.col}`, d.value));

    return (
      <ScrollArea data-key={generatedKey}>
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
                  const bg = interpolateColor(minColor, maxColor, t);
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
});
