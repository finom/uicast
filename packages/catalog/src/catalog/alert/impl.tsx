import { createComponentImplementation } from "@ui-fired/react";
import {
  Alert as ShadcnAlert,
  AlertTitle,
  AlertDescription,
} from "@ui-fired/catalog/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { AlertDef } from "./def";

const iconMap: Record<string, React.ReactNode> = {
  info: <Info className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  error: <AlertCircle className="size-4" />,
};

export const AlertImpl = createComponentImplementation({
  def: AlertDef,
  render: ({ title, description, status = "info", generatedKey }) => {
    const variant = status === "error" ? "destructive" : "default";
    return (
      <ShadcnAlert variant={variant} data-key={generatedKey}>
        {iconMap[status]}
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </ShadcnAlert>
    );
  },
});
