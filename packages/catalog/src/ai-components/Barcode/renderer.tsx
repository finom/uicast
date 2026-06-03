import { createAIComponentRenderer } from "@ui-fired/react";
import { Card, CardContent } from "@ui-fired/catalog/components/ui/card";
import { BarcodeDef } from "./def";

/**
 * Simple barcode renderer using CSS bars pattern.
 * In production, integrate a library like `react-barcode` or `JsBarcode`.
 */
export const BarcodeRenderer = createAIComponentRenderer({
  def: BarcodeDef,
  renderer: ({ value, height = 100, showText = true, generatedKey }) => {
    // Generate a simple visual representation using alternating bars
    const bars: boolean[] = [];
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      for (let b = 7; b >= 0; b--) {
        bars.push(Boolean(charCode & (1 << b)));
      }
      bars.push(false); // separator
    }

    return (
      <Card
        className="inline-flex flex-col items-center gap-1 bg-white p-4"
        data-key={generatedKey}
      >
        <CardContent className="p-0 flex flex-col items-center gap-1">
          <div className="flex" style={{ height }}>
            {bars.map((filled, i) => (
              <div
                key={i}
                style={{
                  width: filled ? 2 : 1,
                  height: "100%",
                  backgroundColor: filled ? "#000" : "#fff",
                }}
              />
            ))}
          </div>
          {showText && (
            <span className="mt-1 font-mono text-sm text-black">{value}</span>
          )}
        </CardContent>
      </Card>
    );
  },
});
