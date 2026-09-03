import { createComponentImplementation } from "@uicast/react";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
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
  render: ({ variant, title, children}, { entry }) => {
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
        data-key={entry.key}
        variant={variant === "error" ? "destructive" : "default"}
      >
        <IconComp className={`size-4 ${variantColorMap[variant]}`} />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  },
});
