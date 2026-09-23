import { createComponentImplementation } from "@uicast/react";
import { HeadingDef } from "./def";

export const HeadingImpl = createComponentImplementation({
  def: HeadingDef,
  render: ({ level, text, children }, { entry }) => {
    const Tag = `h${level}` as const;
    const sizes: Record<string, string> = {
      "1": "text-4xl font-extrabold tracking-tight",
      "2": "text-3xl font-semibold tracking-tight",
      "3": "text-2xl font-semibold tracking-tight",
      "4": "text-xl font-semibold tracking-tight",
      "5": "text-lg font-medium",
      "6": "text-base font-medium",
    };
    return (
      <Tag className={sizes[level]} data-key={entry.key}>
        {children ?? text}
      </Tag>
    );
  },
});
