// The closed allow-list of AST node types: validate.ts rejects anything else,
// compile.ts has one handler per member, and a test compares the two sets.

export const ALLOWED_NODES: ReadonlySet<string> = new Set([
	"Program",
	"ExpressionStatement",
	"Literal",
	"TemplateLiteral",
	"TemplateElement",
	"Identifier",
	"MemberExpression",
	"ChainExpression",
	"CallExpression",
	"NewExpression",
	"UnaryExpression",
	"BinaryExpression",
	"LogicalExpression",
	"ConditionalExpression",
	"ArrayExpression",
	"ObjectExpression",
	"Property",
	"SpreadElement",
	"ArrowFunctionExpression",
	"ObjectPattern",
	"ArrayPattern",
	"AssignmentPattern",
	"RestElement",
]);

/** Unary operators. `delete` and `void` are writes/discards — not here. */
export const ALLOWED_UNARY: ReadonlySet<string> = new Set(["!", "-", "+", "typeof"]);

/** `instanceof` reads `.prototype`, `in` diverges once nothing inherited is readable, bitwise serves no display value — all absent. */
export const ALLOWED_BINARY: ReadonlySet<string> = new Set([
	"+", "-", "*", "/", "%", "**",
	"==", "!=", "===", "!==",
	"<", "<=", ">", ">=",
]);

export const ALLOWED_LOGICAL: ReadonlySet<string> = new Set(["&&", "||", "??"]);

/** Property names that reach the prototype chain or rebind a receiver. */
export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
	"constructor",
	"__proto__",
	"prototype",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__",
	"caller",
	"callee",
	"arguments",
	"bind",
	"call",
	"apply",
]);
