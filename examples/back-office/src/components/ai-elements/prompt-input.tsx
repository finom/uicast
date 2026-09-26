"use client";

import type { ChatStatus } from "ai";
import { CornerDownLeftIcon, SquareIcon, XIcon } from "lucide-react";
import { type DragEvent, type FormEvent, type KeyboardEvent, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type PromptInputProps = {
  placeholder: string;
  status: ChatStatus;
  onStop: () => void;
  onSubmit: (text: string) => void;
};

// A file dropped on the form is ignored rather than opened by the browser.
const ignoreFiles = (event: DragEvent) => {
  if (event.dataTransfer.types.includes("Files")) event.preventDefault();
};

// Enter sends, Shift+Enter breaks the line. While a run is in flight the button stops it.
export function PromptInput({ placeholder, status, onStop, onSubmit }: PromptInputProps) {
  const [composing, setComposing] = useState(false);
  const generating = status === "submitted" || status === "streaming";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = (new FormData(form).get("message") as string) || "";
    form.reset();
    onSubmit(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || composing || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const { form } = event.currentTarget;
    if (form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled) return;
    form?.requestSubmit();
  };

  return (
    <form className="w-full" onSubmit={submit} onDragOver={ignoreFiles} onDrop={ignoreFiles}>
      <InputGroup className="overflow-hidden">
        <div className="contents">
          <InputGroupTextarea
            className="field-sizing-content max-h-48 min-h-16"
            name="message"
            onCompositionEnd={() => setComposing(false)}
            onCompositionStart={() => setComposing(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
          />
        </div>
        <InputGroupAddon align="block-end" className="justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1" />
          <InputGroupButton
            aria-label={generating ? "Stop" : "Submit"}
            onClick={(event) => {
              if (!generating) return;
              event.preventDefault();
              onStop();
            }}
            size="icon-sm"
            type={generating ? "button" : "submit"}
            variant="default"
          >
            {status === "submitted" ? (
              <Spinner />
            ) : status === "streaming" ? (
              <SquareIcon className="size-4" />
            ) : status === "error" ? (
              <XIcon className="size-4" />
            ) : (
              <CornerDownLeftIcon className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
