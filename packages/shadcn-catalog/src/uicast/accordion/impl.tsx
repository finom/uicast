import { createComponentImplementation } from "@uicast/react";
import { Accordion } from "../../components/ui/accordion";
import { AccordionDef } from "./def";

export const AccordionImpl = createComponentImplementation({
  def: AccordionDef,
  render: ({
    type,
    collapsible,
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
