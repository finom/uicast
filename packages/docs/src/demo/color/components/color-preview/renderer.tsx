"use client";
import { createComponentImplementation } from "@uicast/react";
import { ColorPreviewDef } from "./def";

const CHECKER =
  "linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%)";

export const ColorPreviewRenderer = createComponentImplementation({
  def: ColorPreviewDef,
  render: ({ hex = "#000000", alpha = 100, label, generatedKey }) => {
    return (
      <div
        data-key={generatedKey}
        className="relative h-28 w-full overflow-hidden rounded-lg border border-border"
        style={{
          backgroundImage: CHECKER,
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: hex, opacity: alpha / 100 }}
        />
        <span className="absolute bottom-2 left-2 rounded-sm bg-background/80 px-2 py-0.5 font-mono text-xs text-foreground">
          {label || hex}
        </span>
      </div>
    );
  },
});
