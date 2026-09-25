import { createComponentImplementation } from "@uicast/react";
import { TypographyDef } from "./def";

const STYLES = {
  body: "text-base",
  muted: "text-sm text-muted-foreground",
  lead: "text-xl text-muted-foreground",
  small: "text-sm font-medium leading-none",
  large: "text-lg font-semibold",
};

export const TypographyImpl = createComponentImplementation({
  def: TypographyDef,
  render: ({ text, children, variant, as: Tag }, { entry }) => (
    <Tag className={STYLES[variant]} data-key={entry.key}>
      {children ?? text}
    </Tag>
  ),
});
