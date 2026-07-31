import { createComponentImplementation } from "@uicast/react";
import { ButtonGroupDef } from "./def";

export const ButtonGroupImpl = createComponentImplementation({
  def: ButtonGroupDef,
  render: ({ attached = true, children, generatedKey }) => {
    return (
      <div
        className={
          attached
            ? "inline-flex *:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px"
            : "inline-flex gap-2"
        }
        role="group"
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
