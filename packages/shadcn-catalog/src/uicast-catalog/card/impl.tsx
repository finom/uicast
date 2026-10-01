import { createComponentImplementation } from "@uicast/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { pickMouseEvent } from "../../events/mouse";
import { busyClass, clickByKeyboard, cn } from "../../lib/utils";
import { CardDef } from "./def";

export const CardImpl = createComponentImplementation({
  def: CardDef,
  render: ({ title, description, children, onClick }, { entry, busy }) => (
    <Card
      // min-w-0: intrinsic content width (charts, tables) must not win over the track size.
      className={cn("min-w-0 [content-visibility:auto] [contain-intrinsic-size:auto_16rem]", busyClass(busy))}
      onClick={(e) => onClick(pickMouseEvent(e))}
      {...clickByKeyboard(!!entry.callbacks?.onClick)}
      aria-busy={busy || undefined}
      data-key={entry.key}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  ),
  skeleton: ({ knownProps, children }) => (
    <Card className="min-w-0">
      <CardHeader>
        {knownProps?.title ? <CardTitle>{knownProps.title}</CardTitle> : <Skeleton className="h-4 w-40" />}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  ),
});
