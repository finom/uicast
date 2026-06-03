import { createAIComponentRenderer } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@ui-fired/catalog/components/ui/card";
import { CardDef } from "./def";

export const CardRenderer = createAIComponentRenderer({
  def: CardDef,
  renderer: ({ title, description, children, onClick, generatedKey }) => {
    return (
      <ShadcnCard
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </ShadcnCard>
    );
  },
});
