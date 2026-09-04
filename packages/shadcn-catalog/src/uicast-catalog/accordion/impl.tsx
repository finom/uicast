import {
  createContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Accordion } from "../../components/ui/accordion";
import { AccordionDef } from "./def";

export interface AccordionContextValue {
  type: "single" | "multiple";
  collapsible: boolean;
  openKey: string;
  // Functional updates required: two sibling effects can settle the slot in
  // one commit, and a plain set from a stale closure would clobber the winner.
  setOpenKey: Dispatch<SetStateAction<string>>;
}

// consumed by AccordionItem; under type="single" items coordinate through it
// so that opening one closes the others
export const AccordionContext = createContext<AccordionContextValue | null>(
  null,
);

export const AccordionImpl = createComponentImplementation({
  def: AccordionDef,
  render: ({
    type,
    collapsible,
    children,
  }, { entry }) => {
    // key of the open item under type="single"; "" means all closed
    const [openKey, setOpenKey] = useState("");

    return (
      <AccordionContext.Provider
        value={{ type, collapsible, openKey, setOpenKey }}
      >
        <Accordion
          type={type}
          collapsible={type === "single" ? collapsible : undefined}
          data-key={entry.key}
        >
          {children}
        </Accordion>
      </AccordionContext.Provider>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
