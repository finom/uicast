import { createComponentImplementation } from "@uicast/react";
import { useContext, useState } from "react";
import { FieldErrors } from "../../lib/form";
import { FieldDef } from "./def";

export const FieldImpl = createComponentImplementation({
  def: FieldDef,
  render: ({ children }, { entry }) => {
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    const errors = useContext(FieldErrors);
    const error = node ? errors.get(node) : undefined;
    return (
      <div
        ref={setNode}
        data-slot="field"
        data-invalid={!!error}
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
