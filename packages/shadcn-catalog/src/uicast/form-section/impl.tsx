import { createComponentImplementation } from "@uicast/react";
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
    generatedKey,
  }) => {
    const [open, setOpen] = useState(!defaultCollapsed);

    if (!collapsible) {
      return (
        <Card data-key={generatedKey}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      );
    }

    return (
      <Card data-key={generatedKey}>
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
});
