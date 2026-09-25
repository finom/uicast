export const ALLOWED_NODES: ReadonlySet<string> = new Set([
  "Literal",
  "TemplateLiteral",
  "TemplateElement",
  "Identifier",
  "MemberExpression",
  "ChainExpression",
  "CallExpression",
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

// `delete` and `void` are writes/discards — not here.
export const ALLOWED_UNARY: ReadonlySet<string> = new Set(["!", "-", "+", "typeof"]);

// `instanceof` reads `.prototype`, `in` diverges once nothing inherited is readable, bitwise serves no display value — all absent.
export const ALLOWED_BINARY: ReadonlySet<string> = new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
]);

export const ALLOWED_LOGICAL: ReadonlySet<string> = new Set(["&&", "||", "??"]);
