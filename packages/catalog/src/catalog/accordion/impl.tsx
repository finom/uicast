import { createComponentImplementation } from "@ui-fired/react";
import { Accordion } from "@ui-fired/catalog/components/ui/accordion";
import { AccordionDef } from "./def";

export const AccordionImpl = createComponentImplementation({
  def: AccordionDef,
  render: ({
    type = "single",
    collapsible = true,
    children,
    generatedKey,
  }) => {
    return (
      <Accordion
        type={type}
        collapsible={type === "single" ? collapsible : undefined}
        data-key={generatedKey}
      >
        {children}
      </Accordion>
    );
  },
});
