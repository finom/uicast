import { createComponentImplementation } from "@uicast/react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { FieldErrors } from "../../lib/form";
import { FormDef } from "./def";

const FIELD = '[data-slot="field"]';
const INVALID = "input:invalid, select:invalid, textarea:invalid";
// Select and Checkbox are checked through a hidden stand-in, so focus goes to what the user can reach.
const REACHABLE = ":is(input, select, textarea, button):not([tabindex='-1'])";

// The message of the first failing control in each Field.
const fieldErrors = (form: HTMLFormElement) => {
  const errors = new Map<Element, string>();
  for (const control of form.querySelectorAll<HTMLInputElement>(INVALID)) {
    const field = control.closest(FIELD);
    if (field && !errors.has(field)) errors.set(field, control.validationMessage);
  }
  return errors;
};

export const FormImpl = createComponentImplementation({
  def: FormDef,
  render: ({ children, submitText, onSubmit }, { entry }) => {
    const [errors, setErrors] = useState<ReadonlyMap<Element, string>>(new Map());
    const [submitting, setSubmitting] = useState(false);
    return (
      <form
        noValidate
        className="flex flex-col gap-4"
        // After a failed submit, the messages follow the edits.
        onChangeCapture={(e) => {
          if (errors.size) setErrors(fieldErrors(e.currentTarget));
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setErrors(fieldErrors(form));
          const invalid = form.querySelector<HTMLElement>(INVALID);
          if (invalid) {
            (invalid.closest(FIELD)?.querySelector<HTMLElement>(REACHABLE) ?? invalid).focus();
            return;
          }
          setSubmitting(true);
          await onSubmit();
          setSubmitting(false);
        }}
        data-key={entry.key}
      >
        <FieldErrors value={errors}>{children}</FieldErrors>
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
          {submitText}
        </Button>
      </form>
    );
  },
});
