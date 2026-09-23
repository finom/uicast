import { useContext, useEffect, useId, useState } from "react";
import { createComponentImplementation } from "@uicast/react";
import {
  Accordion as ShadcnAccordion,
  AccordionItem as ShadcnAccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../components/ui/accordion";
import { AccordionContext } from "../accordion/impl";
import { AccordionItemDef } from "./def";

export const AccordionItemImpl = createComponentImplementation({
  def: AccordionItemDef,
  render: ({ title, open, children, onToggle }, { entry }) => {
    const ctx = useContext(AccordionContext);
    // Non-null under a type="single" Accordion, where siblings share one open slot.
    const single = ctx?.type === "single" ? ctx : null;
    // Per instance, not `entry.key`: list items share one entry key.
    const id = useId();
    const [localOpen, setLocalOpen] = useState(open);
    const isOpen = single ? single.openKey === id : localOpen;

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync only when the document-driven open changes; single is read from the syncing render on purpose
    useEffect(() => {
      if (single) {
        // Functional: the document can open one item and close another in the same commit.
        if (open) single.setOpenKey(id);
        else single.setOpenKey((key) => (key === id ? "" : key));
      } else {
        setLocalOpen(open);
      }
    }, [open]);

    // A sibling taking the slot closes this item without its trigger firing; the document must hear it.
    // biome-ignore lint/correctness/useExhaustiveDependencies: fire only when the slot owner changes
    useEffect(() => {
      if (single && open && single.openKey !== "" && single.openKey !== id) {
        onToggle({ open: false });
      }
    }, [single?.openKey]);

    return (
      <ShadcnAccordion
        type="single"
        collapsible={single ? single.collapsible : true}
        value={isOpen ? id : ""}
        onValueChange={(val) => {
          const newOpen = val === id;
          if (single) single.setOpenKey(newOpen ? id : "");
          else setLocalOpen(newOpen);
          onToggle({ open: newOpen });
        }}
        data-key={entry.key}
      >
        <ShadcnAccordionItem value={id}>
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionContent>{children}</AccordionContent>
        </ShadcnAccordionItem>
      </ShadcnAccordion>
    );
  },
  placeholder: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
});
