// Static: Tailwind only compiles class names written literally in source.

export const GAP: Record<string, string> = {
  "0": "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
};

// Responsive: stacks on phones, declared count from sm/md up.
export const COLUMNS: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
  "5": "grid-cols-2 md:grid-cols-5",
  "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

// Union of what the defs allow: only FlexRow declares `baseline`.
export const ALIGN: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

export const JUSTIFY: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};
