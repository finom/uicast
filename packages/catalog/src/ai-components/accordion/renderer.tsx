import { createAIComponentRenderer } from "@ui-fired/react";
import { Accordion } from "@ui-fired/catalog/components/ui/accordion";
import { AccordionDef } from "./def";

export const AccordionRenderer = createAIComponentRenderer({
  def: AccordionDef,
  renderer: ({
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
