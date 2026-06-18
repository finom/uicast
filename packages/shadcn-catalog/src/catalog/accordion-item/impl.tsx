import { useState, useEffect } from "react";
import { createComponentImplementation } from "@ui-fired/react";
import {
  Accordion as ShadcnAccordion,
  AccordionItem as ShadcnAccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../components/ui/accordion";
import { AccordionItemDef } from "./def";

export const AccordionItemImpl = createComponentImplementation({
  def: AccordionItemDef,
  render: ({ title, open = false, children, onToggle, generatedKey }) => {
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
