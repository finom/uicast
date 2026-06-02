import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Alert, AlertTitle, AlertDescription } from "ui-fired/catalog/components/ui/alert";
import { Button } from "ui-fired/catalog/components/ui/button";
import { Card } from "ui-fired/catalog/components/ui/card";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "ui-fired/core/lib/utils";
import { ToastDef } from "./def";

export const ToastRenderer = createAIComponentRenderer({
  def: ToastDef,
  renderer: ({
    open = false,
    title,
    description,
    variant = "default",
    position = "bottom-right",
    onClose,
    generatedKey,
  }) => {
    if (!open) return <span data-key={generatedKey} />;

    const positionMap: Record<string, string> = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
    };

    const iconMap: Record<string, React.ReactNode> = {
      default: null,
      success: <CheckCircle2 className="size-4 text-green-500" />,
      error: <AlertCircle className="size-4 text-red-500" />,
      warning: <AlertTriangle className="size-4 text-yellow-500" />,
    };

    return (
      <Card
        className={cn(
          "fixed z-50 max-w-sm shadow-lg animate-in slide-in-from-bottom-2 p-0",
          positionMap[position],
        )}
        data-key={generatedKey}
      >
        <Alert variant={variant === "error" ? "destructive" : "default"}>
          {iconMap[variant]}
          <AlertTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 size-6 -mr-1 -mt-1"
              onClick={() => onClose?.({})}
            >
              <X className="size-4" />
            </Button>
          </AlertTitle>
          {description && <AlertDescription>{description}</AlertDescription>}
        </Alert>
      </Card>
    );
  },
});
