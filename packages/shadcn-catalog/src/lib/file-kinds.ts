import z from "zod";

const FILE_KINDS = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: ".pdf",
  csv: ".csv",
  json: ".json",
  text: ".txt,.md",
  document: ".doc,.docx,.odt,.rtf",
  spreadsheet: ".xls,.xlsx,.ods",
  presentation: ".ppt,.pptx,.odp",
  archive: ".zip,.tar,.gz",
} as const;

type FileKind = keyof typeof FILE_KINDS;

export const fileKindSchema = z.enum(Object.keys(FILE_KINDS) as [FileKind, ...FileKind[]]).meta({ id: "FileKind" });

export const acceptAttribute = (kinds: readonly FileKind[]): string => kinds.map((k) => FILE_KINDS[k]).join(",");
