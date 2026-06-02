import { useState, useEffect } from "react";
import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import {
  Accordion as ShadcnAccordion,
  AccordionItem as ShadcnAccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "ui-fired/catalog/components/ui/accordion";
import { AccordionItemDef } from "./def";

export const AccordionItemRenderer = createAIComponentRenderer({
  def: AccordionItemDef,
  renderer: ({ title, open = false, children, onToggle, generatedKey }) => {
    const [isOpen, setIsOpen] = useState(open);

    useEffect(() => {
      setIsOpen(open);
    }, [open]);

    return (
      <ShadcnAccordion
        type="single"
        collapsible
        value={isOpen ? generatedKey : ""}
        onValueChange={(val) => {
          const newOpen = val === generatedKey;
          setIsOpen(newOpen);
          onToggle?.({ open: newOpen });
        }}
        data-key={generatedKey}
      >
        <ShadcnAccordionItem value={generatedKey}>
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionContent>{children}</AccordionContent>
        </ShadcnAccordionItem>
      </ShadcnAccordion>
    );
  },
});
