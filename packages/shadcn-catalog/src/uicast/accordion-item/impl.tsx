import { useState, useEffect, useContext } from "react";
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
  render: ({ title, open, children, onToggle, generatedKey }) => {
    const ctx = useContext(AccordionContext);
    // non-null under a type="single" Accordion, where siblings share one open
    // slot; standalone and type="multiple" items keep their own state
    const single = ctx?.type === "single" ? ctx : null;
    const [localOpen, setLocalOpen] = useState(open);
    const isOpen = single ? single.openKey === generatedKey : localOpen;

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-sync only when the document-driven open changes; single is read from the syncing render on purpose
    useEffect(() => {
      if (single) {
        // Functional close: when the document opens one item and closes
        // another in the same commit, the closing effect must not clobber the
        // opener's write with a stale openKey.
        if (open) single.setOpenKey(generatedKey);
        else single.setOpenKey((key) => (key === generatedKey ? "" : key));
      } else {
        setLocalOpen(open);
      }
    }, [open]);

    // A sibling taking the single-slot closes this item without its trigger
    // firing — tell the document, or its mirrored open state goes stale.
    // biome-ignore lint/correctness/useExhaustiveDependencies: fire only when the slot owner changes
    useEffect(() => {
      if (single && open && single.openKey !== "" && single.openKey !== generatedKey) {
        onToggle({ open: false });
      }
    }, [single?.openKey]);

    return (
      <ShadcnAccordion
        type="single"
        collapsible={single ? single.collapsible : true}
        value={isOpen ? generatedKey : ""}
        onValueChange={(val) => {
          const newOpen = val === generatedKey;
          if (single) single.setOpenKey(newOpen ? generatedKey : "");
          else setLocalOpen(newOpen);
          onToggle({ open: newOpen });
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
