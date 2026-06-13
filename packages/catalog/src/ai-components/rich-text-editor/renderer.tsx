import { createAIComponentRenderer } from "@ui-fired/react";
import { useRef } from "react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { RichTextEditorDef } from "./def";

export const RichTextEditorRenderer = createAIComponentRenderer({
  def: RichTextEditorDef,
  renderer: ({
    value = "",
    placeholder = "Start writing...",
    disabled = false,
    minHeight = "200px",
    onChange,
    generatedKey,
  }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const execCommand = (command: string, val?: string) => {
      document.execCommand(command, false, val);
      if (editorRef.current) {
        onChange?.({ value: editorRef.current.innerHTML });
      }
    };

    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background",
          disabled && "opacity-50 pointer-events-none",
        )}
        data-key={generatedKey}
      >
        <div className="flex flex-wrap gap-1 border-b p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("bold")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("italic")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("underline")}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("formatBlock", "H2")}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("insertUnorderedList")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("insertOrderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("undo")}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("redo")}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          className="prose prose-sm max-w-none p-4 focus:outline-none dark:prose-invert"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={() => {
            if (editorRef.current) {
              onChange?.({ value: editorRef.current.innerHTML });
            }
          }}
          data-placeholder={placeholder}
        />
      </div>
    );
  },
});
