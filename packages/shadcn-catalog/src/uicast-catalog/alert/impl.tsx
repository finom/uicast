import type { ReactNode } from "react";
import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Alert as ShadcnAlert,
  AlertTitle,
  AlertDescription,
} from "../../components/ui/alert";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { AlertDef } from "./def";

const iconMap: Record<string, ReactNode> = {
  info: <Info className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  error: <AlertCircle className="size-4" />,
};

export const AlertImpl = createComponentImplementation({
  def: AlertDef,
  render: ({ title, description, status }, { entry }) => {
    const variant = status === "error" ? "destructive" : "default";
    return (
      <ShadcnAlert variant={variant} data-key={entry.key}>
        {iconMap[status]}
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </ShadcnAlert>
    );
  },
  placeholder: ({ children }) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
