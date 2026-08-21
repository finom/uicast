import z from "zod";
import { createComponentDefinition } from "uicast";

export const PaginationDef = createComponentDefinition({
  name: "Pagination",
  description:
    "A pagination control for navigating through pages of data. Shows Previous/Next buttons, page numbers, and optionally first/last page buttons. Use Pagination below tables or lists to navigate through paginated data.",
  props: z.strictObject({
    currentPage: z
      .number()
      .meta({ description: "The current active page number (1-based)" }),
    totalPages: z.number().meta({ description: "The total number of pages" }),
    showFirstLast: z
      .boolean()
      .default(true)
      .meta({ description: "Whether to show first/last page buttons" }),
  }),
  callbacks: {
    onPageChange: z.strictObject({
      page: z
        .number()
        .meta({ description: "The newly selected page number (1-based)" }),
    }),
  },
});
