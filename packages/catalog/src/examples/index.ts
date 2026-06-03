import type { Fired } from "@ui-fired/core/types";
import { asyncLines } from "./asyncLines";
import { chartLines } from "./chartLines";
import { countLines } from "./countLines";
import { demoLines } from "./demoLines";
import { formLines } from "./formLines";
import { listLines } from "./listLines";
import { nastenkaLines } from "./nastenkaLines";
import { tableLines } from "./tableLines";

export {
  asyncLines,
  chartLines,
  countLines,
  demoLines,
  formLines,
  listLines,
  nastenkaLines,
  tableLines,
};

type PromptExample = {
  title: string;
  sourcePrompt: string;
  lines: Fired.Element[];
};

export const catalogExamples: PromptExample[] = [
  {
    title: "Counter",
    sourcePrompt: "Create a counter with an increment button",
    lines: countLines,
  },
  {
    title: "Form with Input",
    sourcePrompt: "Create a form with a number input field",
    lines: formLines,
  },
  {
    title: "Dynamic List",
    sourcePrompt: "Create a dynamic list where I can add items",
    lines: listLines,
  },
  {
    title: "Table with Computed Columns, Add/Remove Rows",
    sourcePrompt:
      "Create a table with columns A and B, a computed Sum column, ability to add and delete rows, and a footer showing the total sum",
    lines: tableLines,
  },
  {
    title: "Async Data Fetching (Users Table)",
    sourcePrompt:
      "Show a table of users with their name and email fetched from the server",
    lines: asyncLines,
  },
];
