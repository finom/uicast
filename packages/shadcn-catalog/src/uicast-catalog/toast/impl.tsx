import type { ReactNode } from "react";
import { createComponentImplementation } from "@uicast/react";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import { ToastDef } from "./def";

export const ToastImpl = createComponentImplementation({
  def: ToastDef,
  render: ({
    open,
    title,
    description,
    variant,
    position,
    onClose,
  }, { entry }) => {
    if (!open) return <span data-key={entry.key} />;

    const positionMap: Record<string, string> = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
    };

    const iconMap: Record<string, ReactNode> = {
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
        data-key={entry.key}
      >
        <Alert variant={variant === "error" ? "destructive" : "default"}>
          {iconMap[variant]}
          <AlertTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 size-6 -mr-1 -mt-1"
              onClick={() => onClose()}
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
