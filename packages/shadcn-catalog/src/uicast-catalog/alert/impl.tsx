import { createComponentImplementation } from "@uicast/react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { AlertDescription, AlertTitle, Alert as ShadcnAlert } from "../../components/ui/alert";
import { PanelSkeleton } from "../../lib/skeletons";
import { AlertDef } from "./def";

const STATUS_ICONS = {
  info: <Info className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  error: <AlertCircle className="size-4" />,
};

export const AlertImpl = createComponentImplementation({
  def: AlertDef,
  render: ({ title, description, status }, { entry }) => (
    <ShadcnAlert variant={status === "error" ? "destructive" : "default"} data-key={entry.key}>
      {STATUS_ICONS[status]}
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </ShadcnAlert>
  ),
  skeleton: ({ knownProps, children }) => (
    <PanelSkeleton title={knownProps?.title && <AlertTitle>{knownProps.title}</AlertTitle>}>{children}</PanelSkeleton>
  ),
});
