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
    box: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
    Icon: Info,
  },
  success: {
    box: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    text: "text-green-800 dark:text-green-200",
    Icon: CheckCircle,
  },
  warning: {
    box: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-800 dark:text-yellow-200",
    Icon: AlertTriangle,
  },
  error: {
    box: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    Icon: XCircle,
  },
};

export const BannerImpl = createComponentImplementation({
  def: BannerDef,
  render: ({ variant, dismissible, icon, onDismiss, children }, { entry }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return <span data-key={entry.key} className="hidden" />;

    const { box, text, Icon: DefaultIcon } = VARIANTS[variant];
    const Icon = icon ? ICONS[icon] : DefaultIcon;
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", box)} data-key={entry.key}>
        <Icon className={cn("size-5 shrink-0", text)} />
        <div className={cn("flex-1 text-sm", text)}>{children}</div>
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
