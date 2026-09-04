import { createComponentImplementation } from "@uicast/react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { InlineMessageDef } from "./def";

export const InlineMessageImpl = createComponentImplementation({
  def: InlineMessageDef,
  render: ({ variant, message}, { entry }) => {
    const iconMap = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
    };

    const IconComp = iconMap[variant];

    return (
      <Alert
        variant={variant === "error" ? "destructive" : "default"}
        className="py-2 px-3"
        data-key={entry.key}
      >
        <IconComp className="size-3.5" />
        <AlertDescription className="text-xs">{message}</AlertDescription>
      </Alert>
    );
  },
});
