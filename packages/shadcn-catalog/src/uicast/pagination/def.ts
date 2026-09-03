import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const PaginationDef = createComponentDefinition({
  name: "Pagination",
  description:
    "A pagination control below a paged table or list. With `totalPages` it shows Previous/Next, page numbers and optionally first/last; without it, Previous/Next only, and `hasNext` says whether Next is enabled.",
  props: z.strictObject({
    currentPage: z.number().int().min(1).meta({ description: "The current page, 1-based" }),
    totalPages: z
      .number()
      .int()
      .min(1)
      .optional()
      .meta({ description: "The page count, when known" }),
    hasNext: z
      .boolean()
      .default(true)
      .meta({ description: "Whether a next page exists when `totalPages` is unknown, e.g. `rows.length === limit`" }),
    showFirstLast: z
      .boolean()
      .default(true)
      .meta({ description: "Whether to show first/last page buttons; needs `totalPages`" }),
  }),
  callbacks: {
    onPageChange: z.strictObject({
      page: z.number().int().min(1).meta({ description: "The newly selected page, 1-based" }),
    }),
  },
});
