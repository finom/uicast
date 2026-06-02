import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const FileUploadDef = createAIComponentDef({
  name: "FileUpload",
  description:
    "A file upload input for selecting files from the user's device. Renders a styled file input area. Use FileUpload for document uploads, image uploads, CSV imports, etc. The onChange callback receives file metadata (name, size, type) but not the file content itself.",
  props: z.strictObject({
    accept: z.string().optional().meta({
      description:
        "Comma-separated list of accepted file types, e.g. '.pdf,.doc' or 'image/*'",
    }),
    multiple: z.boolean().default(false).meta({
      description: "Whether multiple files can be selected at once",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the file upload is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      files: z
        .array(
          z.object({
            name: z.string().meta({ description: "The file name" }),
            size: z.number().meta({ description: "The file size in bytes" }),
            type: z.string().meta({ description: "The file MIME type" }),
          }),
        )
        .meta({ description: "Array of selected file metadata objects" }),
    }),
  },
});
