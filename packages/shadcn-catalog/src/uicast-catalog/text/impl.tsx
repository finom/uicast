import { createComponentImplementation } from "@uicast/react";
import { TextDef } from "./def";

export const TextImpl = createComponentImplementation({
  def: TextDef,
  render: ({
    text,
    children,
    variant,
    as: Tag = "span",
  }, { entry }) => {
    const styles: Record<string, string> = {
      body: "text-base",
      muted: "text-sm text-muted-foreground",
      lead: "text-xl text-muted-foreground",
      small: "text-sm font-medium leading-none",
      large: "text-lg font-semibold",
    };
    return (
      <Tag className={styles[variant]} data-key={entry.key}>
        {children ?? text}
      </Tag>
    );
  },
});
