import { createComponentImplementation } from "@uicast/react";
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
  render: ({ title, description, children, onClick, generatedKey }) => {
    return (
      <Card
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={generatedKey}
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
});
