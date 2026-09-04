import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { busy, cn } from "../../lib/utils";
import { pickMouseEvent } from "../../events/mouse";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { CardDef } from "./def";

export const CardImpl = createComponentImplementation({
  def: CardDef,
  render: ({ title, description, children, onClick}, { entry, loading }) => {
    return (
      <Card
        // min-w-0: as a grid/flex item, never let intrinsic content width
        // (charts, tables) win over the track size. Off-screen cards skip layout and paint.
        className={cn("min-w-0 [content-visibility:auto] [contain-intrinsic-size:auto_16rem]", busy(loading))}
        onClick={(e) => onClick(pickMouseEvent(e))}
        aria-busy={loading || undefined}
        data-key={entry.key}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => (
    <Card className="min-w-0">
      <CardHeader>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  ),
});
