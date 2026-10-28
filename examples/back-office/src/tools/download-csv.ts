import { standardTool } from "standard-tool";
import { z } from "zod";

const cell = (value: unknown) => {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// Runs in the browser: the file is saved on the user's machine.
export const downloadCsv = standardTool({
  name: "downloadCsv",
  description: "Saves rows as a CSV file on the user's machine. Columns are the first row's fields.",
  inputSchema: z.object({
    filename: z.string().describe('File name, e.g. "products.csv"'),
    rows: z.array(z.record(z.string(), z.unknown())).min(1),
  }),
  execute: ({ filename, rows }) => {
    const columns = Object.keys(rows[0]);
    const lines = [columns, ...rows.map((row) => columns.map((column) => row[column]))].map((r) =>
      r.map(cell).join(","),
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
});
