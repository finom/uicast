import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FormSectionDef } from "./def";

export const FormSectionImpl = createComponentImplementation({
  def: FormSectionDef,
  render: ({
    title,
    description,
    collapsible,
    defaultCollapsed,
    children,
  }, { entry }) => {
    const [open, setOpen] = useState(!defaultCollapsed);

    if (!collapsible) {
      return (
        <Card data-key={entry.key}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      );
    }

    return (
      <Card data-key={entry.key}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center gap-2">
                {open ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <div>
                  <CardTitle>{title}</CardTitle>
                  {description && (
                    <CardDescription>{description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">{children}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
