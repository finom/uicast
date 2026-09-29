import { createComponentImplementation } from "@uicast/react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useState } from "react";
import { AlertAction, AlertDescription, AlertTitle, Alert as ShadcnAlert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { ICONS } from "../../lib/icons";
import { PanelSkeleton } from "../../lib/skeletons";
import { AlertDef } from "./def";

// On the Alert, not the icon: Alert sets `*:[svg]:text-current`, which beats a class on the icon.
const STATUSES = {
  info: { Icon: Info, color: "*:[svg]:text-info" },
  success: { Icon: CheckCircle2, color: "*:[svg]:text-success" },
  warning: { Icon: AlertTriangle, color: "*:[svg]:text-warning" },
  error: { Icon: AlertCircle, color: "*:[svg]:text-destructive" },
};

export const AlertImpl = createComponentImplementation({
  def: AlertDef,
  render: ({ title, description, status, icon, dismissible, onDismiss, children }, { entry }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return <span data-key={entry.key} className="hidden" />;
    const { Icon: StatusIcon, color } = STATUSES[status];
    const Icon = icon ? ICONS[icon] : StatusIcon;
    return (
      <ShadcnAlert variant={status === "error" ? "destructive" : "default"} className={color} data-key={entry.key}>
        <Icon className="size-4" />
        {title && <AlertTitle>{title}</AlertTitle>}
        {(description || children) && (
          <AlertDescription>
            {description && <p>{description}</p>}
            {children}
          </AlertDescription>
        )}
        {dismissible && (
          <AlertAction>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
            >
              <X />
            </Button>
          </AlertAction>
        )}
      </ShadcnAlert>
    );
  },
  skeleton: ({ knownProps, children }) => (
    <PanelSkeleton title={knownProps?.title && <AlertTitle>{knownProps.title}</AlertTitle>}>{children}</PanelSkeleton>
  ),
});
