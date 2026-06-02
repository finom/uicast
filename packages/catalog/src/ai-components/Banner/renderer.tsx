import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { useState } from "react";
import { cn } from "@ui-fired/core/lib/utils";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BannerDef } from "./def";

export const BannerRenderer = createAIComponentRenderer({
  def: BannerDef,
  renderer: ({
    variant = "info",
    dismissible = true,
    icon,
    onDismiss,
    children,
    generatedKey,
  }) => {
    const [visible, setVisible] = useState(true);

    if (!visible) return <span data-key={generatedKey} className="hidden" />;

    const variantConfig = {
      info: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-200",
        defaultIcon: Info,
      },
      success: {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-800 dark:text-green-200",
        defaultIcon: CheckCircle,
      },
      warning: {
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-800 dark:text-yellow-200",
        defaultIcon: AlertTriangle,
      },
      error: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        defaultIcon: XCircle,
      },
    };

    const config = variantConfig[variant];
    const CustomIcon = icon
      ? (LucideIcons as unknown as Record<string, LucideIcon>)[icon]
      : null;
    const IconComp = CustomIcon ?? config.defaultIcon;

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3",
          config.bg,
          config.border,
        )}
        data-key={generatedKey}
      >
        <IconComp className={cn("h-5 w-5 shrink-0", config.text)} />
        <div className={cn("flex-1 text-sm", config.text)}>{children}</div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              setVisible(false);
              onDismiss?.({});
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  },
});
