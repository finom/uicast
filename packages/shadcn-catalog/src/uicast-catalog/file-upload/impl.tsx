import { createComponentImplementation } from "@uicast/react";
import { Upload } from "lucide-react";
import { FileUploadDef } from "./def";
import { acceptAttribute } from "../../lib/file-kinds";
import { cn } from "../../lib/utils";

export const FileUploadImpl = createComponentImplementation({
  def: FileUploadDef,
  render: ({ accept, multiple, disabled, onChange }, { entry }) => (
    <label
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input px-6 py-8 text-center cursor-pointer transition-colors hover:border-ring hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      data-key={entry.key}
    >
      <Upload className="size-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Click to upload{multiple ? " files" : " a file"}</span>
      <input
        type="file"
        accept={accept && acceptAttribute(accept)}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const fileList = e.target.files;
          if (!fileList) return;
          const files = Array.from(fileList).map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          }));
          // So re-selecting the same file fires a change event again.
          e.target.value = "";
          onChange({ files });
        }}
      />
    </label>
  ),
});
