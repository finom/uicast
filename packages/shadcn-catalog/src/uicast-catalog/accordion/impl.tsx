import { createComponentImplementation } from "@uicast/react";
import { createContext, type Dispatch, type SetStateAction, useState } from "react";
import { Accordion } from "../../components/ui/accordion";
import { StackSkeleton } from "../../lib/skeletons";
import { AccordionDef } from "./def";

type AccordionState = {
  type: "single" | "multiple";
  collapsible: boolean;
  // "" means all closed.
  openKey: string;
  setOpenKey: Dispatch<SetStateAction<string>>;
};

// Under type="single", opening one item closes the others through this.
export const AccordionContext = createContext<AccordionState | null>(null);

export const AccordionImpl = createComponentImplementation({
  def: AccordionDef,
  render: ({ type, collapsible, children }, { entry }) => {
    const [openKey, setOpenKey] = useState("");
    return (
      <AccordionContext.Provider value={{ type, collapsible, openKey, setOpenKey }}>
        <Accordion type={type} collapsible={type === "single" ? collapsible : undefined} data-key={entry.key}>
          {children}
        </Accordion>
      </AccordionContext.Provider>
    );
  },
  skeleton: StackSkeleton,
});
