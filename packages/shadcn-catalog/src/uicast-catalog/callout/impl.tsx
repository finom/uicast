import { createComponentImplementation } from "@uicast/react";
import { AlertTriangle, Info, Lightbulb, StickyNote, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { PanelSkeleton } from "../../lib/skeletons";
import { CalloutDef } from "./def";

const VARIANTS = {
  info: { Icon: Info, color: "text-blue-600 dark:text-blue-400" },
  tip: { Icon: Lightbulb, color: "text-green-600 dark:text-green-400" },
  warning: { Icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400" },
  error: { Icon: XCircle, color: "text-red-600 dark:text-red-400" },
  note: { Icon: StickyNote, color: "text-foreground" },
};

export const CalloutImpl = createComponentImplementation({
  def: CalloutDef,
  render: ({ variant, title, children }, { entry }) => {
    const { Icon, color } = VARIANTS[variant];
    return (
      <Alert data-key={entry.key} variant={variant === "error" ? "destructive" : "default"}>
        <Icon className={`size-4 ${color}`} />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  },
  skeleton: ({ knownProps, children }) => (
    <PanelSkeleton title={knownProps?.title && <AlertTitle>{knownProps.title}</AlertTitle>}>{children}</PanelSkeleton>
  ),
});
