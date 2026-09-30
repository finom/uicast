import { createComponentImplementation } from "@uicast/react";
import { createContext, useContext, useEffect, useId, useState } from "react";
import { FieldErrors, REACHABLE } from "../../lib/form";
import { FieldDef } from "./def";

// The FieldLabel's id, for the control's `aria-labelledby`. A context, not the DOM: both can stream in after the Field.
export const FieldLabelId = createContext<string | undefined>(undefined);

export const FieldImpl = createComponentImplementation({
  def: FieldDef,
  render: ({ children }, { entry }) => {
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    const errors = useContext(FieldErrors);
    const error = node ? errors.get(node) : undefined;
    const invalid = !!error;
    const labelId = useId();
    const errorId = useId();
    // The control and the description are other entries' elements and can stream in after the Field,
    // so the flag and the links go on through the DOM, again on every change inside the Field.
    useEffect(() => {
      if (!node) return;
      let control: Element | null = null;
      const link = () => {
        control = node.querySelector(REACHABLE);
        const description = node.querySelector("[data-slot=field-description]")?.id;
        const describedBy = [description, invalid && errorId].filter(Boolean).join(" ");
        if (invalid) control?.setAttribute("aria-invalid", "true");
        if (describedBy) control?.setAttribute("aria-describedby", describedBy);
      };
      link();
      const observer = new MutationObserver(link);
      observer.observe(node, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        control?.removeAttribute("aria-invalid");
        control?.removeAttribute("aria-describedby");
      };
    }, [node, invalid, errorId]);
    return (
      <div
        ref={setNode}
        data-slot="field"
        data-invalid={invalid}
        className="group/field flex flex-col gap-2"
        data-key={entry.key}
      >
        <FieldLabelId value={labelId}>{children}</FieldLabelId>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
});
