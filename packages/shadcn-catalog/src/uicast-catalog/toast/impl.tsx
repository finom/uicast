import { createComponentImplementation } from "@uicast/react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { ToastDef } from "./def";

const POSITIONS = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

// On the Alert, not the icon: Alert sets `*:[svg]:text-current`, which beats a class on the icon.
const VARIANTS = {
  default: { Icon: null, color: undefined },
  success: { Icon: CheckCircle2, color: "*:[svg]:text-success" },
  error: { Icon: AlertCircle, color: "*:[svg]:text-destructive" },
  warning: { Icon: AlertTriangle, color: "*:[svg]:text-warning" },
};

export const ToastImpl = createComponentImplementation({
  def: ToastDef,
  render: ({ open, title, description, variant, position, onClose }, { entry }) => {
    if (!open) return <span data-key={entry.key} className="hidden" />;
    const { Icon, color } = VARIANTS[variant];
    return (
      <Alert
        variant={variant === "error" ? "destructive" : "default"}
        className={cn(
          "fixed z-50 w-auto max-w-sm shadow-lg animate-in slide-in-from-bottom-2",
          POSITIONS[position],
          color,
        )}
        data-key={entry.key}
      >
        {Icon && <Icon className="size-4" />}
        <AlertTitle className="flex items-center justify-between">
          {title}
          <Button
            type="button"
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
    );
  },
});
