// Excel runs a cell that starts with one of these as a formula, so such text gets a leading apostrophe.
const FORMULA_START = /^[=+\-@\t\r]/;
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

const csvCell = (text: string): string => {
  const safe = FORMULA_START.test(text) && !NUMBER.test(text) ? `'${text}` : text;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

// The byte order mark makes Excel read the file as UTF-8.
export const toCsv = (rows: string[][]): string =>
  `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;

// Form controls hold no data of their own; links and badges keep their text.
const CONTROLS =
  "button, input, select, textarea, [role=button], [role=checkbox], [role=switch], [role=radio], [role=slider], [role=combobox]";

const cellText = (cell: HTMLTableCellElement): string => {
  const copy = cell.cloneNode(true) as HTMLElement;
  for (const control of copy.querySelectorAll(CONTROLS)) control.remove();
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
};

// The table as shown: rows and columns that hold no text (skeletons, a checkbox column) are left out.
export const tableToRows = (table: HTMLTableElement): string[][] => {
  const rows = Array.from(table.rows, (tr) =>
    Array.from(tr.cells).flatMap((cell) => [cellText(cell), ...Array<string>(Math.max(0, cell.colSpan - 1)).fill("")]),
  ).filter((row) => row.some(Boolean));
  const width = Math.max(0, ...rows.map((row) => row.length));
  const used = Array.from({ length: width }, (_, i) => rows.some((row) => row[i]));
  return rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? "").filter((_, i) => used[i]));
};

export const downloadCsv = (name: string, rows: string[][]): void => {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  // Safari still reads the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
