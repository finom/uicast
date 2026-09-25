// The shapes real documents use. The interpreter and a toFunction subclass run them; the /expr and /custom-expr docs pages quote them.

export const BUDGET = { budget: { steps: 50_000_000, ms: 60_000 } };

export const rows = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  stock: i % 50,
  price: (i % 17) + 0.5,
}));
export const scopes = { root: { count: 3, q: "Item 1", user: { name: "Ada" }, products: rows } };

export const cases: [string, string][] = [
  ["predicate", "scopes.root.count > 0"],
  ["member chain", "scopes.root.user.name"],
  // biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
  ["template", "`${scopes.root.user.name} has ${scopes.root.count} items`"],
  ["object literal", "({ label: scopes.root.user.name, value: scopes.root.count })"],
  ["filter 1000", "scopes.root.products.filter(p => p.stock <= 20).length"],
  ["map 1000", "scopes.root.products.map(p => p.name).length"],
  ["reduce 1000", "scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)"],
];

// One reactive wave over a realistic table: 1000 rows, five expression sites per row (props, hidden, text).
export const WAVE_EXPRS = [
  "({ text: scopes.row.name })",
  "({ text: scopes.row.id + 1 })",
  "scopes.row.stock > 0",
  // biome-ignore lint/suspicious/noTemplateCurlyInString: the string IS the expression under test
  "`${scopes.row.name}: ${scopes.row.price.toFixed(2)}`",
  "({ value: scopes.row.price })",
];
