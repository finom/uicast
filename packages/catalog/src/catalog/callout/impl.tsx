import { createComponentImplementation } from "@ui-fired/react";
import { Alert, AlertTitle, AlertDescription } from "@ui-fired/catalog/components/ui/alert";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  XCircle,
  StickyNote,
} from "lucide-react";
import { CalloutDef } from "./def";

export const CalloutImpl = createComponentImplementation({
  def: CalloutDef,
  render: ({ variant = "info", title, children, generatedKey }) => {
    const iconMap = {
      info: Info,
      tip: Lightbulb,
      warning: AlertTriangle,
      error: XCircle,
      note: StickyNote,
    };

    const variantColorMap = {
      info: "text-blue-600 dark:text-blue-400",
      tip: "text-green-600 dark:text-green-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      error: "text-red-600 dark:text-red-400",
      note: "text-foreground",
    };

    const IconComp = iconMap[variant];

    return (
      <Alert
        data-key={generatedKey}
        variant={variant === "error" ? "destructive" : "default"}
      >
        <IconComp className={`h-4 w-4 ${variantColorMap[variant]}`} />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  },
});
