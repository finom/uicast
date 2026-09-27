import { createComponentImplementation } from "@uicast/react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { ICONS } from "../../lib/icons";
import { PanelSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { BannerDef } from "./def";

const VARIANTS = {
  info: {
    box: "bg-info/10 border-info/30",
    color: "text-info",
    Icon: Info,
  },
  success: {
    box: "bg-success/10 border-success/30",
    color: "text-success",
    Icon: CheckCircle,
  },
  warning: {
    box: "bg-warning/10 border-warning/30",
    color: "text-warning",
    Icon: AlertTriangle,
  },
  error: {
    box: "bg-destructive/10 border-destructive/30",
    color: "text-destructive",
    Icon: XCircle,
  },
};

export const BannerImpl = createComponentImplementation({
  def: BannerDef,
  render: ({ variant, dismissible, icon, onDismiss, children }, { entry }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return <span data-key={entry.key} className="hidden" />;

    const { box, color, Icon: DefaultIcon } = VARIANTS[variant];
    const Icon = icon ? ICONS[icon] : DefaultIcon;
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", box)} data-key={entry.key}>
        <Icon className={cn("size-5 shrink-0", color)} />
        <div className="flex-1 text-sm">{children}</div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  },
  skeleton: PanelSkeleton,
});
