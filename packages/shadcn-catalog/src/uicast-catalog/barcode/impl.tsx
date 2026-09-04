import { createComponentImplementation } from "@uicast/react";
import { Card, CardContent } from "../../components/ui/card";
import { BarcodeDef } from "./def";

// Simple barcode renderer using a CSS bars pattern; swap in `JsBarcode` for real use.
export const BarcodeImpl = createComponentImplementation({
  def: BarcodeDef,
  render: ({ value, height, showText}, { entry }) => {
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
        data-key={entry.key}
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
