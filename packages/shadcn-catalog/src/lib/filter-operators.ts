import z from "zod";

// Which ones apply depends on the field's `type`.
const FILTER_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "starts_with",
  "ends_with",
  "gt",
  "gte",
  "lt",
  "lte",
  "before",
  "after",
] as const;

export const filterOperatorSchema = z.enum(FILTER_OPERATORS).meta({ id: "FilterOperator" });
