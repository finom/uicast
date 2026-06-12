import { createAIComponentRenderer } from "@ui-fired/react";
import { Upload } from "lucide-react";
import { FileUploadDef } from "./def";

export const FileUploadRenderer = createAIComponentRenderer({
  def: FileUploadDef,
  renderer: ({
    accept,
    multiple = false,
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <label
        className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input px-6 py-8 text-center cursor-pointer transition-colors hover:border-ring hover:bg-accent/50 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        data-key={generatedKey}
      >
        <Upload className="size-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Click to upload{multiple ? " files" : " a file"}
        </span>
        <input
          type="file"
          accept={accept}
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
            onChange?.({ files });
          }}
        />
      </label>
    );
  },
});
