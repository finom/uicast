import { createComponentImplementation } from "@uicast/react";
import { AlertTriangle, Info, Lightbulb, StickyNote, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { PanelSkeleton } from "../../lib/skeletons";
import { CalloutDef } from "./def";

// On the Alert, not the icon: Alert sets `*:[svg]:text-current`, which beats a class on the icon.
const VARIANTS = {
  info: { Icon: Info, color: "*:[svg]:text-info" },
  tip: { Icon: Lightbulb, color: "*:[svg]:text-success" },
  warning: { Icon: AlertTriangle, color: "*:[svg]:text-warning" },
  error: { Icon: XCircle, color: "*:[svg]:text-destructive" },
  note: { Icon: StickyNote, color: undefined },
};

export const CalloutImpl = createComponentImplementation({
  def: CalloutDef,
  render: ({ variant, title, children }, { entry }) => {
    const { Icon, color } = VARIANTS[variant];
    return (
      <Alert data-key={entry.key} variant={variant === "error" ? "destructive" : "default"} className={color}>
        <Icon className="size-4" />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  },
  skeleton: ({ knownProps, children }) => (
    <PanelSkeleton title={knownProps?.title && <AlertTitle>{knownProps.title}</AlertTitle>}>{children}</PanelSkeleton>
  ),
});
