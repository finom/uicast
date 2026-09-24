import {
  createContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createComponentImplementation } from "@uicast/react";
import { Accordion } from "../../components/ui/accordion";
import { AccordionDef } from "./def";

interface AccordionContextValue {
  type: "single" | "multiple";
  collapsible: boolean;
  openKey: string;
  setOpenKey: Dispatch<SetStateAction<string>>;
}

// Under type="single", opening one item closes the others through this.
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
    // "" means all closed.
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
  skeleton: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
});
