import { ALLOWED_GLOBALS } from "../eval/allowedGlobals";

/**
 * The `# JavaScript Expressions` block — the micro-expression syntax contract
 * the generation LLM follows when authoring `expr` values (props, hidden,
 * defaults, callbacks). Catalog-/app-agnostic: it documents only the evaluator
 * surface (allowed syntax, the `scopes` / `evt` context variables), not any
 * specific host functions.
 *
 * A partial-prompt primitive: the consuming app's prompt assembler composes
 * this — alongside the other `get*PartialPrompt` builders — into the full
 * system prompt. The closing line refers to RPC/host functions "listed below",
 * so the app should join its function-list partial (e.g.
 * `getFunctionsPartialPrompt(tools)`) as the next section after this one. core
 * ships the pieces; the app owns the assembly.
 */
export function getExpressionsPartialPrompt(): string {
	return /*md*/ `# JavaScript Expressions

All \`expr\` values are JavaScript expressions evaluated with a provided context. Key syntax rules:
- Expressions are standard JavaScript expressions (single expression, no statements).
- No variable declarations (let, const, var), no assignments (=, +=), no loops, no if/else statements.
- Arrow functions are allowed for callbacks: \`items.filter(o => o.active)\`
- Template literals are allowed: \`\\\`Hello \${name}\\\`\`
- Ternary operator: \`condition ? trueVal : falseVal\`
- Object literals: when the expression IS an object literal, wrap in parentheses: \`({ key: value })\`
- Array literals: \`[1, 2, 3]\`
- String concatenation: \`"hello" + " " + name\` or template literals.
- Array methods: \`.map()\`, \`.filter()\`, \`.reduce()\`, \`.find()\`, \`.some()\`, \`.every()\`, \`.length\`, \`.includes()\`, \`.indexOf()\`, \`.join()\`, \`.slice()\`, \`.concat()\`, \`.flat()\`, \`.flatMap()\`
- Object methods: \`Object.keys()\`, \`Object.values()\`, \`Object.entries()\`
- Nullish coalescing: \`value ?? defaultValue\`
- Optional chaining: \`obj?.field\`, \`arr?.[0]\`
- Spread operator in arrays/objects: \`[...arr, newItem]\`, \`{ ...obj, key: val }\`
- \`typeof\` operator: \`typeof value === "string"\`
- Logical operators: \`&&\`, \`||\`, \`!\`
- Comparison: \`===\`, \`!==\`, \`<\`, \`<=\`, \`>\`, \`>=\` (prefer strict equality \`===\`)
- Math: \`Math.floor()\`, \`Math.ceil()\`, \`Math.round()\`, \`Math.max()\`, \`Math.min()\`, \`Math.abs()\`
- Available globals (anything else is \`undefined\` — don't reference other globals): ${ALLOWED_GLOBALS.join(", ")}.
- CRITICAL: All defaults in a single chunk are evaluated BEFORE any are written. A later default CANNOT read a value set by an earlier default in the same chunk. Split dependent defaults across parent/child chunks.

Available context variables:
- \`scopes\` - reactive state object with all scopes
- \`evt\` - event object (in callbacks only)
- All RPC functions listed below are available as async function calls, so they need to be avaited with \`await\`.`;
}
