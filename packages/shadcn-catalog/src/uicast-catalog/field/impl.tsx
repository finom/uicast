import { createComponentImplementation } from "@uicast/react";
import { useContext, useEffect, useState } from "react";
import { FieldErrors, REACHABLE } from "../../lib/form";
import { FieldDef } from "./def";

export const FieldImpl = createComponentImplementation({
  def: FieldDef,
  render: ({ children }, { entry }) => {
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    const errors = useContext(FieldErrors);
    const error = node ? errors.get(node) : undefined;
    const invalid = !!error;
    // The control is another entry's element, so the flag goes on through the DOM.
    useEffect(() => {
      const control = invalid ? node?.querySelector(REACHABLE) : null;
      control?.setAttribute("aria-invalid", "true");
      return () => control?.removeAttribute("aria-invalid");
    }, [node, invalid]);
    return (
      <div
        ref={setNode}
        data-slot="field"
        data-invalid={invalid}
        className="group/field flex flex-col gap-2"
        data-key={entry.key}
      >
        {children}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
});
