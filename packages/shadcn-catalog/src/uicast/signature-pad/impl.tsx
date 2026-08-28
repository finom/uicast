import { createComponentImplementation } from "@uicast/react";
import { useRef, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Eraser } from "lucide-react";
import { cn } from "../../lib/utils";
import { SignaturePadDef } from "./def";

export const SignaturePadImpl = createComponentImplementation({
  def: SignaturePadDef,
  render: ({
    width = 400,
    height = 200,
    penColor = "#000000",
    disabled = false,
    label,
    onEnd,
    onClear,
    generatedKey,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

    // biome-ignore lint/correctness/useExhaustiveDependencies: getCtx reads a ref — stable identity, not a reactive input
    const startDraw = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        isDrawingRef.current = true;
        const ctx = getCtx();
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      },
      [disabled],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: getCtx reads a ref — stable identity, not a reactive input
    const draw = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || disabled) return;
        const ctx = getCtx();
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      },
      [disabled, penColor],
    );

    const endDraw = useCallback(() => {
      isDrawingRef.current = false;
      onEnd?.({ isEmpty: false });
    }, [onEnd]);

    const clearCanvas = () => {
      const ctx = getCtx();
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        onClear?.({});
      }
    };

    return (
      <div className="space-y-2" data-key={generatedKey}>
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
              "block cursor-crosshair rounded-t-md",
              disabled && "cursor-default opacity-50",
            )}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
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
});
