import type { ComponentEntry } from "@uicast/core";
import { asyncLines } from "./async-lines";
import { chartLines } from "./chart-lines";
import { countLines } from "./count-lines";
import { demoLines } from "./demo-lines";
import { formLines } from "./form-lines";
import { listLines } from "./list-lines";
import { nastenkaLines } from "./nastenka-lines";
import { tableLines } from "./table-lines";

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
  lines: ComponentEntry[];
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
