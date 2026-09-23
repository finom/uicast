import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { type PointerEvent, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Eraser } from "lucide-react";
import { cn } from "../../lib/utils";
import { SignaturePadDef } from "./def";

const INKS = { black: "#000000", blue: "#1d4ed8" } as const;

export const SignaturePadImpl = createComponentImplementation({
  def: SignaturePadDef,
  render: ({
    width,
    height,
    penColor,
    disabled,
    label,
    onEnd,
    onClear,
  }, { entry }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const hasInkRef = useRef(false);

    const pointOf = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
      const rect = e.currentTarget.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    const startDraw = (e: PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      isDrawingRef.current = true;
      const ctx = e.currentTarget.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(...pointOf(e));
    };

    const draw = (e: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || disabled) return;
      const ctx = e.currentTarget.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = INKS[penColor];
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineTo(...pointOf(e));
      ctx.stroke();
      hasInkRef.current = true;
    };

    const endDraw = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      onEnd({ isEmpty: !hasInkRef.current });
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      hasInkRef.current = false;
      onClear();
    };

    return (
      <div className="space-y-2" data-key={entry.key}>
        {label && (
          <div className="text-sm font-medium text-muted-foreground">
            {label}
          </div>
        )}
        <div className="inline-block rounded-md border border-input bg-background">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={cn(
              "block cursor-crosshair touch-none rounded-t-md",
              disabled && "cursor-default touch-auto opacity-50",
            )}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
          <div className="flex justify-end border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              disabled={disabled}
            >
              <Eraser className="mr-1 size-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 160 }} />,
});
